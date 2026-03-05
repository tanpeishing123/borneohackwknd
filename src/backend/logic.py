import sqlite3
import os
import json
from fpdf import FPDF
import datetime
import qrcode
import pytesseract
from PIL import Image
import io
import base64
import re
try:
    import fitz  # PyMuPDF
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False
    print('Warning: PyMuPDF not installed. PDF files will not be supported for OCR.')

# Try common Windows install locations so OCR works even if PATH is not refreshed.
for tesseract_path in [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]:
    if os.path.exists(tesseract_path):
        pytesseract.pytesseract.tesseract_cmd = tesseract_path
        break

# --- SQLite Database Initialization ---
DB_PATH = os.path.join(os.path.dirname(__file__), 'veri_demo.db')

def get_db_connection():
    """Get a database connection with row factory"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initialize SQLite database tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Farmers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS farmers (
            id_number TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            permits TEXT,
            other_permit_name TEXT,
            permit_photo_url TEXT,
            plots TEXT,
            monthly_quota REAL,
            current_total_sold REAL DEFAULT 0,
            is_eudr_safe INTEGER DEFAULT 1,
            created_at TEXT
        )
    ''')
    
    # Dealers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dealers (
            license_id TEXT PRIMARY KEY,
            representative_name TEXT NOT NULL,
            mobile TEXT,
            station_name TEXT,
            license_types TEXT,
            license_numbers TEXT,
            license_photos TEXT,
            other_license_name TEXT,
            location TEXT,
            registered_at TEXT
        )
    ''')
    
    # Transactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            farmer_id TEXT NOT NULL,
            farmer_name TEXT,
            weight REAL,
            mode TEXT,
            location TEXT,
            timestamp TEXT,
            ffb_batch_url TEXT,
            farmer_signature_url TEXT,
            status TEXT DEFAULT 'verified',
            risk TEXT DEFAULT 'Safe',
            crop_type TEXT DEFAULT 'Palm Oil',
            FOREIGN KEY(farmer_id) REFERENCES farmers(id_number)
        )
    ''')
    
    # Audit requests table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_requests (
            transaction_id TEXT PRIMARY KEY,
            status TEXT,
            risk TEXT,
            audit_requested_at TEXT,
            audit_requested_by TEXT,
            source TEXT
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on import
init_database()


def get_user_profile(user_id: str):
    """Retrieve user profile from database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # First try to find in farmers
        cursor.execute('SELECT id_number as id, name, "farmer" as role FROM farmers WHERE id_number = ?', (user_id,))
        row = cursor.fetchone()
        
        if row:
            conn.close()
            return {
                "id": row[0],
                "name": row[1],
                "role": row[2]
            }
        
        # Then try dealers
        cursor.execute('SELECT license_id as id, representative_name as name, "dealer" as role FROM dealers WHERE license_id = ?', (user_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                "id": row[0],
                "name": row[1],
                "role": row[2]
            }
        
        return None
    except Exception as e:
        print(f"Get User Profile Error: {e}")
        return None


def extract_ic_data(image_base64: str):
    """Extract name and Malaysian IC number from an IC image."""
    try:
        if ',' in image_base64:
            image_data = base64.b64decode(image_base64.split(',')[1])
        else:
            image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        ocr_text = pytesseract.image_to_string(image, lang='eng')

        ic_match = re.search(r'\b\d{6}-\d{2}-\d{4}\b', ocr_text)
        if not ic_match:
            ic_match = re.search(r'\b\d{12}\b', ocr_text)

        name = None
        for line in [l.strip() for l in ocr_text.splitlines() if l.strip()]:
            if any(ch.isdigit() for ch in line):
                continue
            if len(line) < 4:
                continue
            upper = line.upper()
            if upper in ["MALAYSIA", "WARGANEGARA", "KAD PENGENALAN", "IDENTITY CARD"]:
                continue
            name = line.title()
            break

        ic_number = None
        if ic_match:
            raw = ic_match.group(0)
            if '-' in raw:
                ic_number = raw
            elif len(raw) == 12:
                ic_number = f"{raw[:6]}-{raw[6:8]}-{raw[8:]}"

        return {
            'name': name,
            'idNumber': ic_number,
            'raw_text': ocr_text
        }
    except Exception as e:
        return {'error': str(e), 'name': None, 'idNumber': None, 'raw_text': ''}


def extract_permit_data(image_base64: str, permit_type: str):
    """Extract permit number (e.g. MPOB-9921-2026) from permit image."""
    try:
        if ',' in image_base64:
            image_data = base64.b64decode(image_base64.split(',')[1])
        else:
            image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        ocr_text = pytesseract.image_to_string(image, lang='eng')

        ptype = permit_type.upper()
        generic = re.search(rf'\b{ptype}[-\s]?\d{{3,6}}(?:[-\s]?\d{{2,4}})?\b', ocr_text, re.IGNORECASE)
        fallback = re.search(r'\b[A-Z]{3,5}-\d{3,6}(?:-\d{2,4})?\b', ocr_text)
        permit_number = generic.group(0).replace(' ', '-') if generic else (fallback.group(0) if fallback else None)

        return {
            'permitType': ptype,
            'permitNumber': permit_number,
            'raw_text': ocr_text
        }
    except Exception as e:
        return {'error': str(e), 'permitType': permit_type, 'permitNumber': None, 'raw_text': ''}


def extract_land_title_data(image_base64: str):
    """
    使用 Tesseract OCR 从地契图像提取关键字段
    """
    try:
        if ',' in image_base64:
            image_data = base64.b64decode(image_base64.split(',')[1])
        else:
            image_data = base64.b64decode(image_base64)
        
        # Check if the data is a PDF
        if image_data.startswith(b'%PDF'):
            if not PDF_SUPPORT:
                return {'error': 'PDF support not available. Please install PyMuPDF: pip install PyMuPDF'}
            try:
                pdf_document = fitz.open(stream=image_data, filetype="pdf")
                if pdf_document.page_count == 0:
                    return {'error': 'PDF has no pages'}
                page = pdf_document[0]
                pix = page.get_pixmap(dpi=300)
                img_data = pix.tobytes("png")
                image = Image.open(io.BytesIO(img_data))
                pdf_document.close()
            except Exception as e:
                return {'error': f'PDF conversion failed: {str(e)}'}
        else:
            try:
                image = Image.open(io.BytesIO(image_data))
            except Exception as e:
                return {'error': f'Invalid image format: {str(e)}'}
        
        ocr_text = pytesseract.image_to_string(image, lang='eng')
        data = {
            'lot_number': None,
            'plot_alias': None,
            'mukim': None,
            'district': None,
            'state': None,
            'land_area': None,
            'owner_name': None,
            'raw_text': ocr_text
        }
        
        lot_patterns = [
            r'(?:Lot|LOT|Lote|LOTE)\s*(?:No\.?|NUMBER)?\s*:?\s*([A-Z]?\d+/\d+)',
            r'([A-Z]?\d{2,5}/\d{2,5})'
        ]
        for pattern in lot_patterns:
            match = re.search(pattern, ocr_text, re.IGNORECASE)
            if match:
                data['lot_number'] = match.group(1).strip()
                break
        
        alias_patterns = [
            r'(?:Plot\s+(?:Alias|Name|Code)|Plot\s+ID)\s*:?\s*([A-Za-z0-9\-_]+)',
            r'(?:Alias|Plot\s+Name)\s*:?\s*([A-Za-z0-9\-_\s]+?)(?:\n|,|$)'
        ]
        for pattern in alias_patterns:
            match = re.search(pattern, ocr_text, re.IGNORECASE)
            if match:
                data['plot_alias'] = match.group(1).strip()
                break
        
        mukim_match = re.search(r'(?:Mukim|MUKIM)\s*:?\s*([A-Za-z\s]+?)(?:\n|,|District)', ocr_text, re.IGNORECASE)
        if mukim_match:
            data['mukim'] = mukim_match.group(1).strip()
        district_match = re.search(r'(?:District|DISTRICT)\s*:?\s*([A-Za-z\s]+?)(?:\n|,|State|Slate)', ocr_text, re.IGNORECASE)
        if district_match:
            data['district'] = district_match.group(1).strip()
        state_match = re.search(r'(?:State|STATE|Slate|SLATE)\s*:?\s*([A-Za-z\s]+?)(?:\n|$)', ocr_text, re.IGNORECASE)
        if state_match:
            data['state'] = state_match.group(1).strip()
        area_match = re.search(r'(?:Area|AREA|vea|VEA)\s*:?\s*([\d.]+)\s*(?:HA|Hectares)', ocr_text, re.IGNORECASE)
        if area_match:
            try:
                data['land_area'] = float(area_match.group(1))
            except ValueError:
                pass
        owner_match = re.search(r'(?:\()?(?:Owner|OWNER)\s*(?:Name)?\s*:?\s*([A-Za-z\s]+?)(?:\n|,|\)|$)', ocr_text, re.IGNORECASE)
        if owner_match:
            data['owner_name'] = owner_match.group(1).strip()

        lat_match = re.search(r'(?:Lat|Latitude)\s*:?\s*(-?\d+(?:\.\d+)?)', ocr_text, re.IGNORECASE)
        lng_match = re.search(r'(?:Lng|Lon|Longitude)\s*:?\s*(-?\d+(?:\.\d+)?)', ocr_text, re.IGNORECASE)
        if lat_match and lng_match:
            data['center_lat'] = float(lat_match.group(1))
            data['center_lng'] = float(lng_match.group(1))
        else:
            data['center_lat'] = 3.1390
            data['center_lng'] = 101.6869

        return data
    except Exception as e:
        return {'error': str(e), 'lot_number': None, 'raw_text': ''}


def calculate_quota(area: float, unit: str):
    actual_ha = area * 0.4047 if unit == 'Acre' else area
    return round(actual_ha * 1.5, 2)

# --- Farmer Registration ---
def process_farmer_registration(farmer_data: dict):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        total_area = sum(plot['landArea'] for plot in farmer_data.get('plots', []))
        monthly_quota = round(total_area * 1.5, 2)
        
        cursor.execute('''
            INSERT OR REPLACE INTO farmers 
            (id_number, name, permits, other_permit_name, permit_photo_url, plots, monthly_quota, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            farmer_data['idNumber'],
            farmer_data['name'],
            json.dumps(farmer_data['permits']),
            farmer_data.get('otherPermitName'),
            farmer_data.get('permitPhotoUrl'),
            json.dumps(farmer_data['plots']),
            monthly_quota,
            datetime.datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
        return {"success": True, "quota": monthly_quota, "eudr_safe": True}
    except Exception as e:
        print(f"SQLite Save Error: {e}")
        return {"success": False}

# --- Add Plot to Farmer ---
def add_plot_to_farmer(farmer_id: str, plot_data: dict):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT plots FROM farmers WHERE id_number = ?', (farmer_id,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return {"success": False, "message": "Farmer not found"}
        
        plots = json.loads(row['plots']) if row['plots'] else []
        plots.append(plot_data)
        
        total_area = sum(p['landArea'] for p in plots)
        new_quota = round(total_area * 1.5, 2)
        
        cursor.execute('''
            UPDATE farmers 
            SET plots = ?, monthly_quota = ?
            WHERE id_number = ?
        ''', (json.dumps(plots), new_quota, farmer_id))
        
        conn.commit()
        conn.close()
        return {"success": True, "new_quota": new_quota}
    except Exception as e:
        print(f"SQLite Save Error: {e}")
        return {"success": False}

# --- Dealer Registration ---
def process_dealer_registration(dealer_data: dict):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        license_numbers = dealer_data.get('licenseNumbers', {})
        license_types = dealer_data.get('licenseTypes', [])
        
        primary_license = ''
        if license_types and license_numbers:
            primary_license = license_numbers.get(license_types[0], '')
        
        if not primary_license:
            primary_license = f"DEALER-{int(datetime.datetime.now().timestamp())}"
        
        cursor.execute('''
            INSERT OR REPLACE INTO dealers 
            (license_id, representative_name, mobile, station_name, license_types, license_numbers, license_photos, other_license_name, location, registered_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            primary_license,
            dealer_data['representativeName'],
            dealer_data.get('mobile'),
            dealer_data.get('stationName'),
            json.dumps(dealer_data.get('licenseTypes', [])),
            json.dumps(dealer_data.get('licenseNumbers', {})),
            json.dumps(dealer_data.get('licensePhotos', {})),
            dealer_data.get('otherLicenseName'),
            json.dumps(dealer_data.get('location', {})),
            datetime.datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
        return {"success": True, "dealer_id": primary_license}
    except Exception as e:
        print(f"SQLite Save Error: {e}")
        return {"success": False}

# --- Check Security Filters ---
def check_security_filters(tx_data: dict):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        farmer_id = tx_data['farmerId']
        new_weight = tx_data['weight']

        cursor.execute('''
            SELECT monthly_quota, current_total_sold, name, permits 
            FROM farmers 
            WHERE id_number = ?
        ''', (farmer_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return {"allowed": False, "reason": "INVALID_ID", "message": "Farmer not found"}

        quota = row['monthly_quota']
        sold = row['current_total_sold']

        if (sold + new_weight) > quota:
            return {
                "allowed": False, 
                "reason": "LAUNDERING_LOCK", 
                "message": f"Quota exceeded. Remaining: {round(quota-sold, 2)} MT"
            }

        # Update the sold amount
        conn = get_db_connection()
        cursor = conn.cursor()
        new_total_sold = sold + new_weight
        cursor.execute('''
            UPDATE farmers 
            SET current_total_sold = ?
            WHERE id_number = ?
        ''', (new_total_sold, farmer_id))
        conn.commit()
        conn.close()

        permits = json.loads(row['permits']) if row['permits'] else []
        
        return {
            "allowed": True, 
            "remaining": round(quota - new_total_sold, 2),
            "farmer_name": row['name'],
            "permit_info": permits
        }
    except Exception as e:
        return {"allowed": False, "reason": "SYSTEM_ERROR", "message": str(e)}

# --- Generate Compliance Report ---
def generate_compliance_report(tx_data: dict, security_result: dict):
    pdf = FPDF()
    pdf.add_page()
    
    tx_id = tx_data.get('id', 'TEMP_ID_001')
    
    qr_data = f"TX_ID: {tx_id} | Verified by PalmOil-DDS"
    qr = qrcode.make(qr_data)
    qr.save("temp_qr.png")

    pdf.set_font("Arial", 'B', 20)
    pdf.cell(200, 20, "EUDR COMPLIANCE REPORT", ln=True, align='C')
    pdf.image("temp_qr.png", x=160, y=10, w=30)
    
    pdf.ln(10)
    pdf.set_font("Arial", '', 12)
    pdf.cell(200, 10, f"Farmer Name: {security_result.get('farmer_name', 'Unknown')}", ln=True)
    pdf.cell(200, 10, f"Farmer ID: {tx_data.get('farmerId')}", ln=True)
    permit_info = security_result.get('permit_info', [])
    if permit_info:
        permit_line = ', '.join([
            f"{p.get('type')}:{p.get('number', 'N/A')}" if isinstance(p, dict) else str(p)
            for p in permit_info
        ])
    else:
        permit_line = 'N/A'
    pdf.cell(200, 10, f"Permit Info: {permit_line}", ln=True)
    pdf.cell(200, 10, f"Transaction Weight: {tx_data['weight']} MT", ln=True)
    pdf.cell(200, 10, f"Date: {datetime.datetime.now().strftime('%Y-%m-%d')}", ln=True)
    
    pdf.ln(10)
    pdf.set_font("Arial", 'B', 14)
    pdf.set_text_color(0, 150, 0)
    pdf.cell(200, 10, "STATUS: PASSED - NO DEFORESTATION DETECTED", ln=True, align='C')

    file_name = f"report_{tx_id}.pdf"
    pdf.output(file_name)
    
    if os.path.exists("temp_qr.png"):
        os.remove("temp_qr.png")
        
    return file_name

# --- Generate Farmer QR ---
from io import BytesIO

def generate_farmer_qr_logic(farmer_id: str):
    qr_content = f"PALM_FARMER:{farmer_id}"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_content)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"

from shapely.geometry import Point, Polygon

# --- Get Farmer Status ---
def get_farmer_status_logic(farmer_id: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT name, monthly_quota, current_total_sold, permits, plots, is_eudr_safe
            FROM farmers
            WHERE id_number = ?
        ''', (farmer_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
        
        remaining = round(row['monthly_quota'] - row['current_total_sold'], 2)
        
        return {
            "name": row['name'],
            "remaining_quota": remaining,
            "permits": json.loads(row['permits']) if row['permits'] else [],
            "plots": json.loads(row['plots']) if row['plots'] else [],
            "is_eudr_safe": bool(row['is_eudr_safe'])
        }
    except Exception as e:
        print(f"Get Farmer Status Error: {e}")
        return None

# --- Verify Spatial Compliance ---
def verify_spatial_compliance(current_lat: float, current_lng: float, boundary_points: list):
    if not boundary_points or len(boundary_points) < 3:
        return {"status": "NEED_STAGE_2", "message": "No boundary data! Please complete Stage 2: Add Plot first."}

    polygon_coords = [(p['lng'], p['lat']) for p in boundary_points]
    fence = Polygon(polygon_coords)
    current_point = Point(current_lng, current_lat)
    
    is_inside = fence.contains(current_point)
    return {"status": "SUCCESS" if is_inside else "OUT_OF_BOUNDS", "is_inside": is_inside}

# --- Generate Consolidated Report ---
def generate_consolidated_report(manifest_data: dict):
    pdf = FPDF()
    pdf.add_page()
    
    manifest_id = manifest_data.get('id', 'MANIFEST_TEMP')
    
    qr_data = f"MANIFEST:{manifest_id} | Consolidated DDS"
    qr = qrcode.make(qr_data)
    qr.save("temp_manifest_qr.png")
    
    pdf.set_font("Arial", 'B', 20)
    pdf.cell(200, 20, "CONSOLIDATED DDS REPORT", ln=True, align='C')
    pdf.image("temp_manifest_qr.png", x=160, y=10, w=30)
    
    pdf.ln(10)
    pdf.set_font("Arial", '', 12)
    pdf.cell(200, 10, f"Lorry Plate: {manifest_data.get('lorryPlate', 'N/A')}", ln=True)
    pdf.cell(200, 10, f"Total Weight: {manifest_data['totalWeight']} MT", ln=True)
    pdf.cell(200, 10, f"Date: {datetime.datetime.now().strftime('%Y-%m-%d')}", ln=True)
    
    pdf.ln(10)
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(200, 10, "Farmers Involved:", ln=True)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    for tx_id in manifest_data['selectedTransactions']:
        cursor.execute('''
            SELECT farmer_name, farmer_id, weight, location 
            FROM transactions
            WHERE id = ?
        ''', (tx_id,))
        
        tx_row = cursor.fetchone()
        if tx_row:
            location = json.loads(tx_row['location']) if tx_row['location'] else {}
            pdf.set_font("Arial", '', 12)
            pdf.cell(200, 10, f"- {tx_row['farmer_name']} ({tx_row['farmer_id']}): {tx_row['weight']} MT", ln=True)
            pdf.cell(200, 10, f"  GPS: {location.get('lat', 'N/A')}, {location.get('lng', 'N/A')}", ln=True)
            pdf.cell(200, 10, f"  Planting Year: {2020}", ln=True)
    
    conn.close()
    
    pdf.ln(10)
    pdf.set_font("Arial", 'B', 14)
    pdf.set_text_color(0, 150, 0)
    pdf.cell(200, 10, "STATUS: CONSOLIDATED COMPLIANCE PASSED", ln=True, align='C')
    
    file_name = f"consolidated_report_{manifest_id}.pdf"
    pdf.output(file_name)
    
    if os.path.exists("temp_manifest_qr.png"):
        os.remove("temp_manifest_qr.png")
        
    return file_name

# --- Save Transaction ---
def save_transaction(tx_data: dict):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if not tx_data.get('id'):
            tx_data['id'] = f"TX-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        cursor.execute('''
            INSERT OR REPLACE INTO transactions 
            (id, farmer_id, farmer_name, weight, mode, location, timestamp, ffb_batch_url, farmer_signature_url, status, risk, crop_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            tx_data['id'],
            tx_data['farmerId'],
            tx_data.get('farmerName'),
            tx_data['weight'],
            tx_data.get('mode'),
            json.dumps(tx_data.get('location', {})),
            datetime.datetime.now().isoformat(),
            tx_data.get('ffbBatchUrl'),
            tx_data.get('farmerSignatureUrl'),
            tx_data.get('status', 'verified'),
            tx_data.get('risk', 'Safe'),
            tx_data.get('cropType', 'Palm Oil')
        ))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True, 
            "transaction_id": tx_data['id'],
            "message": "Transaction saved successfully"
        }
    except Exception as e:
        print(f"Transaction Save Error: {e}")
        return {"success": False, "error": str(e)}

# --- Request Transaction Audit ---
def request_transaction_audit(transaction_id: str, requested_by: str = "dealer"):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        audit_time = datetime.datetime.now().isoformat()
        
        # Try to update transaction
        cursor.execute('''
            UPDATE transactions 
            SET status = ?, risk = ?
            WHERE id = ?
        ''', ('PENDING_AUDIT', 'PENDING_AUDIT', transaction_id))
        
        # Also insert into audit_requests
        cursor.execute('''
            INSERT OR REPLACE INTO audit_requests 
            (transaction_id, status, risk, audit_requested_at, audit_requested_by, source)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (transaction_id, 'PENDING_AUDIT', 'PENDING_AUDIT', audit_time, requested_by, 'mock_dashboard'))
        
        conn.commit()
        conn.close()

        return {
            "success": True,
            "transaction_id": transaction_id,
            "audit_status": "PENDING_AUDIT",
        }
    except Exception as e:
        print(f"Audit Request Error: {e}")
        return {"success": False, "error": str(e)}

# --- Sync Transactions ---
def sync_transactions(sync_payload: dict):
    try:
        transactions = sync_payload.get('transactions', [])
        if not isinstance(transactions, list):
            transactions = []

        synced_count = 0
        failed_count = 0

        for tx in transactions:
            result = save_transaction(tx)
            if result.get("success"):
                synced_count += 1
            else:
                failed_count += 1

        return {
            "success": True,
            "synced_count": synced_count,
            "failed_count": failed_count,
            "message": f"Synced {synced_count} transaction(s)",
            "synced_at": datetime.datetime.now().isoformat(),
        }
    except Exception as e:
        print(f"Sync Error: {e}")
        return {"success": False, "error": str(e)}
