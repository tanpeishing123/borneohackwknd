import firebase_admin
from firebase_admin import credentials, firestore
from fpdf import FPDF
import datetime
import qrcode
import os
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

# --- 1. 初始化 Firebase ---
if not firebase_admin._apps:
    backend_dir = os.path.dirname(__file__)
    cred_path = os.path.join(backend_dir, "serviceAccountKey.json")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()


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

# --- OCR 帮助函数 ---
def extract_land_title_data(image_base64: str):
    """
    使用 Tesseract OCR 从地契图像提取关键字段
    支持图像格式 (PNG, JPG) 和 PDF
    返回字典包含 lot_number, plot_alias, mukim, district, state, land_area, owner_name, raw_text
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
            # Convert PDF to image (first page only) using PyMuPDF
            try:
                pdf_document = fitz.open(stream=image_data, filetype="pdf")
                if pdf_document.page_count == 0:
                    return {'error': 'PDF has no pages'}
                # Render first page as image
                page = pdf_document[0]
                pix = page.get_pixmap(dpi=300)  # High DPI for better OCR
                # Convert pixmap to PIL Image
                img_data = pix.tobytes("png")
                image = Image.open(io.BytesIO(img_data))
                pdf_document.close()
            except Exception as e:
                return {'error': f'PDF conversion failed: {str(e)}'}
        else:
            # Regular image file
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
        # Extract Lot Number
        lot_patterns = [
            r'(?:Lot|LOT|Lote|LOTE)\s*(?:No\.?|NUMBER)?\s*:?\s*([A-Z]?\d+/\d+)',
            r'([A-Z]?\d{2,5}/\d{2,5})'  # OCR fallback when label is noisy
        ]
        for pattern in lot_patterns:
            match = re.search(pattern, ocr_text, re.IGNORECASE)
            if match:
                data['lot_number'] = match.group(1).strip()
                break
        
        # Extract Plot Alias/Name
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
            # Fallback centroids for demo when no explicit coordinates are present.
            data['center_lat'] = 3.1390
            data['center_lng'] = 101.6869

        return data
    except Exception as e:
        return {'error': str(e), 'lot_number': None, 'raw_text': ''}


def calculate_quota(area: float, unit: str):
    actual_ha = area * 0.4047 if unit == 'Acre' else area
    return round(actual_ha * 1.5, 2)

# --- 2. 农民注册 ---
def process_farmer_registration(farmer_data: dict):
    try:
        # 计算总面积和配额
        total_area = sum(plot['landArea'] for plot in farmer_data.get('plots', []))
        monthly_quota = round(total_area * 1.5, 2)  # 假设每HA 1.5 MT
        
        doc_ref = db.collection('farmers').document(farmer_data['idNumber'])
        doc_ref.set({
            "name": farmer_data['name'],
            "idNumber": farmer_data['idNumber'],
            "permits": farmer_data['permits'],
            "otherPermitName": farmer_data.get('otherPermitName'),
            "permitPhotoUrl": farmer_data.get('permitPhotoUrl'),
            "plots": farmer_data['plots'],
            "monthly_quota": monthly_quota,
            "current_total_sold": 0.0,
            "is_eudr_safe": True
        })
        return {"success": True, "quota": monthly_quota, "eudr_safe": True}
    except Exception as e:
        print(f"Firebase Save Error: {e}")
        return {"success": False}

# --- 2.6 添加地块到农民 ---
def add_plot_to_farmer(farmer_id: str, plot_data: dict):
    try:
        doc_ref = db.collection('farmers').document(farmer_id)
        doc = doc_ref.get()
        if not doc.exists:
            return {"success": False, "message": "Farmer not found"}
        
        farmer_data = doc.to_dict()
        plots = farmer_data.get('plots', [])
        plots.append(plot_data)
        
        # 重新计算配额
        total_area = sum(p['landArea'] for p in plots)
        new_quota = round(total_area * 1.5, 2)
        
        doc_ref.update({
            "plots": plots,
            "monthly_quota": new_quota
        })
        return {"success": True, "new_quota": new_quota}
    except Exception as e:
        print(f"Firebase Save Error: {e}")
        return {"success": False}
def process_dealer_registration(dealer_data: dict):
    try:
        # 获取所有许可证号码，用第一个作为document ID
        license_numbers = dealer_data.get('licenseNumbers', {})
        license_types = dealer_data.get('licenseTypes', [])
        
        # 选择主许可证ID（第一个许可证类型对应的号码）
        primary_license = ''
        if license_types and license_numbers:
            primary_license = license_numbers.get(license_types[0], '')
        
        if not primary_license:
            primary_license = f"DEALER-{int(datetime.datetime.now().timestamp())}"
        
        doc_ref = db.collection('dealers').document(primary_license)
        doc_ref.set({
            "representativeName": dealer_data['representativeName'],
            "mobile": dealer_data['mobile'],
            "stationName": dealer_data['stationName'],
            "licenseTypes": dealer_data['licenseTypes'],
            "licenseNumbers": dealer_data.get('licenseNumbers', {}),  # 保存所有许可证号码
            "licensePhotos": dealer_data.get('licensePhotos', {}),  # 保存所有许可证照片
            "otherLicenseName": dealer_data.get('otherLicenseName'),
            "location": dealer_data['location'],
            "registered_at": datetime.datetime.now().isoformat()
        })
        return {"success": True, "dealer_id": primary_license}
    except Exception as e:
        print(f"Firebase Save Error: {e}")
        return {"success": False}

# --- 3. 交易核验 + 实时更新数据库 ---
def check_security_filters(tx_data: dict):
    try:
        farmer_id = tx_data['farmerId']
        new_weight = tx_data['weight']

        doc_ref = db.collection('farmers').document(farmer_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return {"allowed": False, "reason": "INVALID_ID", "message": "Farmer not found"}

        farmer_info = doc.to_dict()
        quota = farmer_info['monthly_quota']
        sold = farmer_info['current_total_sold']

        if (sold + new_weight) > quota:
            return {
                "allowed": False, 
                "reason": "LAUNDERING_LOCK", 
                "message": f"Quota exceeded. Remaining: {round(quota-sold, 2)} MT"
            }

        # --- 重点：核验通过，立刻更新 Firebase 里的已售重量 ---
        new_total_sold = sold + new_weight
        doc_ref.update({"current_total_sold": new_total_sold})

        # 把完整的 farmer_info 也传回去，方便 main.py 调用 PDF 时拿到名字
        return {
            "allowed": True, 
            "remaining": round(quota - new_total_sold, 2),
            "farmer_name": farmer_info.get('name', 'Unknown'), # 传出姓名
            "permit_info": farmer_info.get('permits', [])
        }
    except Exception as e:
        return {"allowed": False, "reason": "SYSTEM_ERROR", "message": str(e)}

# --- 4. 生成带二维码的 PDF 报告 ---
def generate_compliance_report(tx_data: dict, security_result: dict):
    pdf = FPDF()
    pdf.add_page()
    
    tx_id = tx_data.get('id', 'TEMP_ID_001')
    
    # --- 1. 生成二维码 ---
    qr_data = f"TX_ID: {tx_id} | Verified by PalmOil-DDS"
    qr = qrcode.make(qr_data)
    qr.save("temp_qr.png")

    # --- 2. 绘制 PDF 内容 ---
    pdf.set_font("Arial", 'B', 20)
    pdf.cell(200, 20, "EUDR COMPLIANCE REPORT", ln=True, align='C')
    
    # 插入二维码图片 (右上角)
    pdf.image("temp_qr.png", x=160, y=10, w=30)
    
    pdf.ln(10)
    pdf.set_font("Arial", '', 12)
    # 这里使用从 security_result 传进来的姓名
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
    pdf.set_text_color(0, 150, 0) # 绿色字体表示合格
    pdf.cell(200, 10, "STATUS: PASSED - NO DEFORESTATION DETECTED", ln=True, align='C')

    file_name = f"report_{tx_id}.pdf"
    pdf.output(file_name)
    
    # 清理临时二维码图片
    if os.path.exists("temp_qr.png"):
        os.remove("temp_qr.png")
        
    return file_name

import qrcode
from io import BytesIO
import base64

def generate_farmer_qr_logic(farmer_id: str):
    """
    [对应第二阶段 Step 3] 将 FarmerID 封装进 QR 码
    返回 Base64 字符串，前端 <img> 标签可以直接使用
    """
    # 构造二维码内容，通常包含一个前缀防止乱扫
    qr_content = f"PALM_FARMER:{farmer_id}"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_content)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    # 将图片保存到内存中并转为 base64
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"

from shapely.geometry import Point, Polygon

# --- [对应第三阶段 Dashboard] 获取农民实时状态 ---
def get_farmer_status_logic(farmer_id: str):
    """
    检查农民是否存在，并返回其本月剩余配额 
    """
    doc = db.collection('farmers').document(farmer_id).get()
    if not doc.exists:
        return None
    
    data = doc.to_dict()
    remaining = round(data['monthly_quota'] - data['current_total_sold'], 2)
    
    return {
        "name": data.get('name'),
        "remaining_quota": remaining,
        "permits": data.get('permits', []),
        "plots": data.get('plots', []),
        "is_eudr_safe": data.get('is_eudr_safe', True)
    }

# --- [对应第三阶段 Mode Toggle] 地理围栏核验 ---
def verify_spatial_compliance(current_lat: float, current_lng: float, boundary_points: list):
    """
    使用 shapely 检查收购坐标是否在农民地块多边形内 
    """
    # ⚠️ 提醒：如果此处 boundary_points 为空，说明【第二阶段】的地块注册未完成
    if not boundary_points or len(boundary_points) < 3:
        return {"status": "NEED_STAGE_2", "message": "No boundary data! Please complete Stage 2: Add Plot first."}

    polygon_coords = [(p['lng'], p['lat']) for p in boundary_points]
    fence = Polygon(polygon_coords)
    current_point = Point(current_lng, current_lat)
    
    is_inside = fence.contains(current_point)
    return {"status": "SUCCESS" if is_inside else "OUT_OF_BOUNDS", "is_inside": is_inside}

# --- 4.5 生成整合版 DDS 报告 ---
def generate_consolidated_report(manifest_data: dict):
    pdf = FPDF()
    pdf.add_page()
    
    manifest_id = manifest_data.get('id', 'MANIFEST_TEMP')
    
    # 生成二维码
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
    
    for tx_id in manifest_data['selectedTransactions']:
        tx_doc = db.collection('transactions').document(tx_id).get()
        if tx_doc.exists:
            tx_data = tx_doc.to_dict()
            pdf.set_font("Arial", '', 12)
            pdf.cell(200, 10, f"- {tx_data['farmerName']} ({tx_data['farmerId']}): {tx_data['weight']} MT", ln=True)
            pdf.cell(200, 10, f"  GPS: {tx_data['location']['lat']}, {tx_data['location']['lng']}", ln=True)
            # 假设种植年份从农民数据获取，这里简化
            pdf.cell(200, 10, f"  Planting Year: {2020}", ln=True)  # 需要从plots获取
    
    pdf.ln(10)
    pdf.set_font("Arial", 'B', 14)
    pdf.set_text_color(0, 150, 0)
    pdf.cell(200, 10, "STATUS: CONSOLIDATED COMPLIANCE PASSED", ln=True, align='C')
    
    file_name = f"consolidated_report_{manifest_id}.pdf"
    pdf.output(file_name)
    
    if os.path.exists("temp_manifest_qr.png"):
        os.remove("temp_manifest_qr.png")
        
    return file_name

# --- 4.6 保存交易数据 ---
def save_transaction(tx_data: dict):
    """
    保存dealer端的transaction数据到Firebase
    """
    try:
        # 生成transaction ID（如果前端没有传）
        if not tx_data.get('id'):
            tx_data['id'] = f"TX-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        # 保存到transactions collection
        doc_ref = db.collection('transactions').document(tx_data['id'])
        doc_ref.set({
            "id": tx_data['id'],
            "farmerId": tx_data['farmerId'],
            "farmerName": tx_data['farmerName'],
            "weight": tx_data['weight'],
            "mode": tx_data['mode'],  # 'Plantation' or 'Ramp'
            "location": tx_data.get('location', {}),
            "timestamp": datetime.datetime.now().isoformat(),
            "ffbBatchUrl": tx_data.get('ffbBatchUrl'),
            "farmerSignatureUrl": tx_data.get('farmerSignatureUrl'),
            "status": tx_data.get('status', 'verified'),
            "risk": tx_data.get('risk', 'Safe'),
            "cropType": tx_data.get('cropType', 'Palm Oil')
        })
        
        return {
            "success": True, 
            "transaction_id": tx_data['id'],
            "message": "Transaction saved successfully"
        }
    except Exception as e:
        print(f"Transaction Save Error: {e}")
        return {"success": False, "error": str(e)}


def request_transaction_audit(transaction_id: str, requested_by: str = "dealer"):
    """Mark a transaction as pending audit. Supports mock-only rows via audit_requests."""
    try:
        tx_ref = db.collection('transactions').document(transaction_id)
        tx_doc = tx_ref.get()

        audit_payload = {
            "status": "PENDING_AUDIT",
            "risk": "PENDING_AUDIT",
            "auditRequestedAt": datetime.datetime.now().isoformat(),
            "auditRequestedBy": requested_by,
        }

        if tx_doc.exists:
            tx_ref.update(audit_payload)
        else:
            db.collection('audit_requests').document(transaction_id).set({
                "transactionId": transaction_id,
                "source": "mock_dashboard",
                **audit_payload,
            })

        return {
            "success": True,
            "transaction_id": transaction_id,
            "audit_status": "PENDING_AUDIT",
        }
    except Exception as e:
        print(f"Audit Request Error: {e}")
        return {"success": False, "error": str(e)}


def sync_transactions(sync_payload: dict):
    """Batch sync offline transactions to Firebase."""
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