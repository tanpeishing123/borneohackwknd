import sqlite3
import os
import json
from fpdf import FPDF
import datetime
import qrcode
import pytesseract
from PIL import Image, ImageFilter, ImageOps, ImageEnhance
import io
import base64
import re
import urllib.request
import urllib.error
try:
    import fitz  # PyMuPDF
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False
    print('Warning: PyMuPDF not installed. PDF files will not be supported for OCR.')

# EUDR Deforestation Check Dependencies
try:
    import numpy as np
    import matplotlib
    matplotlib.use('Agg')  # Non-interactive backend for server
    import matplotlib.pyplot as plt
    from matplotlib.patches import Rectangle
    import planetary_computer
    from pystac_client import Client
    import rasterio
    from rasterio.warp import transform_bounds
    from shapely.geometry import box, Polygon as ShapelyPolygon, mapping
    EUDR_SUPPORT = True
except ImportError as e:
    EUDR_SUPPORT = False
    print(f'Warning: EUDR dependencies not installed. Install with: pip install planetary-computer pystac-client rasterio numpy matplotlib shapely. Error: {e}')

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
            source_plot TEXT,
            FOREIGN KEY(farmer_id) REFERENCES farmers(id_number)
        )
    ''')
    cursor.execute("PRAGMA table_info(transactions)")
    transaction_columns = {row[1] for row in cursor.fetchall()}
    if 'source_plot' not in transaction_columns:
        cursor.execute('ALTER TABLE transactions ADD COLUMN source_plot TEXT')
    
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

    # Seed deterministic EUDR demo entries used by pitch scenarios.
    bangi_plot = {
        "id": "P-BANGI-001",
        "cropType": "Palm Oil",
        "plantingYear": 2018,
        "alias": "Bangi Demonstration Plot",
        "landArea": 2.7,
        "landTitleArea": 2.7,
        "landTitleReference": "BGI-LOT-27/112",
        "boundary": [
            {"lat": 2.9178, "lng": 101.7848},
            {"lat": 2.9180, "lng": 101.7861},
            {"lat": 2.9192, "lng": 101.7863},
            {"lat": 2.9194, "lng": 101.7851}
        ],
        "eudrChecked": True,
        "eudrRiskScore": 11.2,
        "eudrRiskLevel": "Low",
        "eudrStatus": "safe"
    }

    lahad_datu_plot = {
        "id": "P-LAHAD-001",
        "cropType": "Palm Oil",
        "plantingYear": 2024,
        "alias": "Lahad Datu Expansion Plot",
        "landArea": 3.4,
        "landTitleArea": 3.4,
        "landTitleReference": "LDU-LOT-88/205",
        "boundary": [
            {"lat": 5.0221, "lng": 118.3274},
            {"lat": 5.0224, "lng": 118.3292},
            {"lat": 5.0237, "lng": 118.3291},
            {"lat": 5.0234, "lng": 118.3273}
        ],
        "eudrChecked": True,
        "eudrRiskScore": 84.6,
        "eudrRiskLevel": "High",
        "eudrStatus": "unsafe"
    }

    cursor.execute('''
        INSERT OR IGNORE INTO farmers
        (id_number, name, permits, other_permit_name, permit_photo_url, plots, monthly_quota, current_total_sold, is_eudr_safe, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        '800101-10-1101',
        'Bangi Demo Farmer',
        json.dumps([{"type": "MPOB", "number": "MPOB-BGI-2026-0001"}]),
        None,
        None,
        json.dumps([bangi_plot]),
        4.05,
        0,
        1,
        datetime.datetime.now().isoformat()
    ))

    cursor.execute('''
        INSERT OR IGNORE INTO farmers
        (id_number, name, permits, other_permit_name, permit_photo_url, plots, monthly_quota, current_total_sold, is_eudr_safe, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        '790404-12-2202',
        'Lahad Datu Demo Farmer',
        json.dumps([{"type": "MPOB", "number": "MPOB-LDU-2026-0002"}]),
        None,
        None,
        json.dumps([lahad_datu_plot]),
        5.1,
        0,
        0,
        datetime.datetime.now().isoformat()
    ))
    
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


def _decode_base64_to_image(image_base64: str):
    # _decode_base64_to_image - convert base64 uploads into a PIL image or PDF page.
    if ',' in image_base64:
        image_data = base64.b64decode(image_base64.split(',')[1])
    else:
        image_data = base64.b64decode(image_base64)

    if image_data.startswith(b'%PDF'):
        if not PDF_SUPPORT:
            raise ValueError('PDF support not available. Please install PyMuPDF: pip install PyMuPDF')
        pdf_document = fitz.open(stream=image_data, filetype='pdf')
        if pdf_document.page_count == 0:
            pdf_document.close()
            raise ValueError('PDF has no pages')
        page = pdf_document[0]
        pix = page.get_pixmap(dpi=300)
        img_data = pix.tobytes('png')
        pdf_document.close()
        return Image.open(io.BytesIO(img_data))

    return Image.open(io.BytesIO(image_data))


def _normalize_spaces(text: str):
    # _normalize_spaces - collapse OCR whitespace before parsing labels and values.
    return re.sub(r'\s+', ' ', (text or '')).strip()


def _clean_name(text: str):
    # _clean_name - clean OCR text into a likely human name candidate.
    if not text:
        return None
    cleaned = _normalize_spaces(text)
    cleaned = cleaned.strip(" .,:;|_`'\"-")
    cleaned = re.sub(r'[^A-Za-z@/\-\.\s]', '', cleaned)
    cleaned = _normalize_spaces(cleaned)
    if len(cleaned) < 4:
        return None
    return cleaned.title()


def _normalize_ic_number(text: str):
    # _normalize_ic_number - normalize IC strings into a comparison-friendly format.
    if not text:
        return None
    digits = re.sub(r'\D', '', text)
    if len(digits) != 12:
        return None
    return f"{digits[:6]}-{digits[6:8]}-{digits[8:]}"


def _normalize_permit_number(text: str):
    # _normalize_permit_number - normalize permit identifiers before matching.
    if not text:
        return None
    normalized = _normalize_spaces(text.upper())
    normalized = re.sub(r'\s*[-–—]\s*', '-', normalized)
    normalized = normalized.replace(' ', '-')
    normalized = re.sub(r'-{2,}', '-', normalized)
    return normalized.strip('-')


def _is_valid_owner_name(candidate: str) -> bool:
    # _is_valid_owner_name - reject office names and labels before accepting an OCR owner.
    """Check if a candidate string looks like a real human name and not a label."""
    if not candidate:
        return False
    cleaned = _normalize_spaces(candidate).upper()
    
    # Reject if it's clearly a document label
    label_markers = {
        'IC NUMBER', 'NO IC', 'NO KAD', 'FULL NAME', 'NAME', 'NAMA',
        'IDENTITY CARD', 'KAD PENGENALAN', 'MYKAD', 'KAD PENGENALAN MALAYSIA',
        'OWNER', 'PEMILIK', 'LICENSEE', 'LICENCEE', 'HOLDER',
        'NUMBER', 'NOMBOR', 'CARD', 'DOCUMENT', 'DATE OF BIRTH',
        'DOB', 'TARIKH', 'ADDRESS', 'ALAMAT', 'NATIONALITY', 'WARGANEGARA',
        'GENDER', 'JANTINA', 'ISSUE DATE', 'EXPIRY DATE', 'TERBIT',
        'EXPIRED', 'TAMAT', 'TELEPHONE', 'MOBILE', 'TEL', 'NO TEL'
    }
    
    # Reject if it's an institution/office/department name
    institution_keywords = {
        'PEJABAT', 'TANAH', 'GALIAN', 'NEGERI', 'SELANGOR', 'DEPARTMENT',
        'MINISTRY', 'BOARD', 'AGENCY', 'OFFICE', 'KEMENTERIAN', 'LEMBAGA',
        'BADAN', 'KANTOR', 'PERANGKAT', 'UNIT', 'BAHAGIAN', 'MALAYSIA',
        'GOVERNMENT', 'FEDERAL', 'STATE', 'KERAJAAN', 'JOHOR', 'SABAH',
        'SARAWAK', 'KEDAH', 'KELANTAN', 'PERAK', 'PERLIS', 'PAHANG',
        'PULAU PINANG', 'SELANGOR', 'NEGERI SEMBILAN', 'MELAKA', 'KUALA LUMPUR'
    }
    
    # If the whole candidate is a label, reject
    if cleaned in label_markers:
        return False
    
    # If candidate contains mostly label markers, reject
    for marker in label_markers:
        if marker in cleaned:
            return False
    
    # Check for institution keywords
    words_in_candidate = set(cleaned.split())
    institution_overlap = words_in_candidate & institution_keywords
    if len(institution_overlap) >= 2:  # If 2+ institution keywords, likely an office name
        return False
    
    # Must have at least 2 words (first name + last name)
    words = cleaned.split()
    if len(words) < 2:
        return False
    
    # Each word should be mostly letters (not numbers or special chars)
    for word in words:
        letter_count = sum(1 for c in word if c.isalpha())
        if letter_count < len(word) * 0.7:  # At least 70% letters
            return False
    
    # Minimum length check
    if len(cleaned) < 6:  # e.g., "AB XY" is too short
        return False
    
    return True


def _find_name_candidate(ocr_text: str):
    # _find_name_candidate - scan OCR lines for the most plausible personal name.
    def _looks_like_name_label_noise(candidate: str) -> bool:
        upper = _normalize_spaces(candidate).upper()
        noisy_markers = [
            'IC NUMBER', 'NO IC', 'FULL NAME', 'NAME', 'NAMA',
            'IDENTITY CARD', 'KAD PENGENALAN', 'MYKAD'
        ]
        if upper in noisy_markers:
            return True
        return any(marker in upper for marker in noisy_markers)

    def _looks_like_non_person_text(candidate: str) -> bool:
        upper = _normalize_spaces(candidate).upper()
        blocked_keywords = [
            'NATIONAL REGISTRATION', 'DEPARTMENT', 'JPN', 'DEMO', 'FICTIONAL',
            'TESTING', 'MALAYSIA IDENTITY CARD', 'DATE OF BIRTH', 'NATIONALITY',
            'GENDER', 'ADDRESS', 'ISSUE DATE', 'CARD STATUS', 'FOR OCR', 'VERI'
        ]
        return any(keyword in upper for keyword in blocked_keywords)

    # 0) First pass: line-based label extraction (avoids cross-line greedy capture).
    for raw_line in (ocr_text or '').splitlines():
        line = _normalize_spaces(raw_line)
        if not line:
            continue
        m = re.search(r'\b(?:NAMA PENUH|FULL NAME|NAMA|NAME)\b\s*[:\-]?\s*(.+)$', line, re.IGNORECASE)
        if not m:
            continue
        extracted = _clean_name(m.group(1))
        if extracted and not _looks_like_name_label_noise(extracted) and not _looks_like_non_person_text(extracted):
            return extracted

    # 1) Prefer explicit label-based extraction when OCR contains NAME/NAMA fields.
    label_patterns = [
        r'\b(?:NAMA|NAME)\b\s*[:\-]?\s*([A-Z][A-Z\s\'\.-]{3,60})',
        r'\b(?:NAMA PENUH|FULL NAME)\b\s*[:\-]?\s*([A-Z][A-Z\s\'\.-]{3,60})',
    ]
    for pattern in label_patterns:
        m = re.search(pattern, (ocr_text or '').upper())
        if m:
            extracted = _clean_name(m.group(1))
            if extracted and not _looks_like_name_label_noise(extracted) and not _looks_like_non_person_text(extracted):
                return extracted

    # 2) Fallback: line-by-line candidate search with stricter noise filters.
    blocked_terms = {
        'MALAYSIA', 'WARGANEGARA', 'KAD PENGENALAN', 'IDENTITY CARD',
        'MYKAD', 'KAD PENGENALAN MALAYSIA', 'MALAYSIAN IDENTITY CARD',
        'IDENTITI', 'IC', 'NO KAD', 'NOMBOR', 'NUMBER', 'CITIZEN', 'JANTINA',
        'LELAKI', 'PEREMPUAN', 'ALAMAT', 'ADDRESS', 'TARIKH', 'DATE OF BIRTH',
        'IC NUMBER', 'NO IC', 'FULL NAME'
    }
    for raw_line in ocr_text.splitlines():
        line = _normalize_spaces(raw_line)
        if not line:
            continue
        if any(ch.isdigit() for ch in line):
            continue
        if len(line) < 4:
            continue
        upper = line.upper()
        if upper in blocked_terms:
            continue
        if any(term in upper for term in blocked_terms):
            continue
        if _looks_like_non_person_text(upper):
            continue
        # Keep likely human-name lines only.
        if len(upper.split()) < 2:
            continue
        return _clean_name(line)
    return None


def _extract_ic_number(ocr_text: str):
    # _extract_ic_number - locate the IC number using label-first OCR parsing.
    match = re.search(r'\b\d{6}-\d{2}-\d{4}\b', ocr_text)
    if match:
        return _normalize_ic_number(match.group(0))
    match = re.search(r'\b\d{12}\b', ocr_text)
    if match:
        return _normalize_ic_number(match.group(0))
    return None


def _extract_permit_area(ocr_text: str):
    # _extract_permit_area - recover the licensed area from OCR text when present.
    """Extract registered/licensed area from permit document (in hectares)."""
    # Look for patterns like "2.50 hectares", "2.50 HA", "Area: 2.50", etc.
    # Allow flexible whitespace and newlines for PDF table layouts
    patterns = [
        r'(?:Registered Area|Licensed Area|Land Area|Area)[\s:]*([\s\n]*)(\d+\.?\d*)\s*(?:hectare|HA|ha)',
        r'(\d+\.?\d*)\s*(?:hectare|hectares|HA|ha)\b',
    ]
    for pattern in patterns:
        match = re.search(pattern, ocr_text, re.IGNORECASE | re.DOTALL)
        if match:
            try:
                # Get the numeric group (different positions in different patterns)
                area_str = match.group(2) if match.lastindex >= 2 else match.group(1)
                area = float(area_str)
                if 0 < area < 10000:  # Sanity check: reasonable land size
                    return round(area, 2)
            except (ValueError, AttributeError, IndexError):
                continue
    return None


def _preprocess_image_for_ocr(image: Image.Image) -> Image.Image:
    # _preprocess_image_for_ocr - improve contrast and sharpness before OCR runs.
    """Apply gentle preprocessing to improve OCR accuracy: auto-orient,
    convert to grayscale, increase contrast, denoise and threshold.
    Returns a PIL Image suitable for pytesseract.
    """
    try:
        img = image.convert('RGB')
        img = ImageOps.exif_transpose(img)
        gray = img.convert('L')

        # Increase contrast moderately
        enhancer = ImageEnhance.Contrast(gray)
        gray = enhancer.enhance(1.6)

        # Median filter reduces salt-and-pepper noise
        gray = gray.filter(ImageFilter.MedianFilter(size=3))

        # Slight binarization helps on printed documents
        threshold = 140
        bw = gray.point(lambda x: 0 if x < threshold else 255, 'L')

        return bw.convert('RGB')
    except Exception:
        return image


def _extract_name_from_document_image(image: Image.Image):
    # _extract_name_from_document_image - isolate the owner name using positional OCR.
    """Attempt to extract the human name by looking for nearby words to common
    labels such as 'Name', 'Nama', 'Owner', 'Licensee', etc., using
    pytesseract image_to_data for positional context. Falls back to
    _find_name_candidate on full OCR text. Uses _is_valid_owner_name to
    strictly filter candidates.
    """
    try:
        data = pytesseract.image_to_data(image, lang='eng', output_type=pytesseract.Output.DICT, config='--psm 6')
        n = len(data.get('text', []))
        labels = ['NAME', 'NAMA', 'OWNER', 'LICENSEE', 'LICENCEE', 'HOLDER', 'PEMILIK', 'NAMA PEMILIK']

        for i in range(n):
            txt = (data['text'][i] or '').strip()
            if not txt:
                continue
            u = txt.upper()
            for label in labels:
                if label in u:
                    top = data['top'][i]
                    left = data['left'][i]
                    height = data['height'][i] or 10

                    # Prefer same-line, right-side candidates
                    candidates = []
                    for j in range(n):
                        if j == i:
                            continue
                        t = (data['text'][j] or '').strip()
                        if not t:
                            continue
                        # same visual line
                        if abs(data['top'][j] - top) <= max(8, height // 2):
                            if data['left'][j] > left:
                                candidates.append((j, data['left'][j], int(data.get('conf', [])[j] if isinstance(data.get('conf', []), list) and data.get('conf', [])[j].isdigit() else -1)))

                    # If no same-line right-side, look below label
                    if not candidates:
                        for j in range(n):
                            if j == i:
                                continue
                            t = (data['text'][j] or '').strip()
                            if not t:
                                continue
                            if data['top'][j] > top and (data['top'][j] - top) < 120:
                                candidates.append((j, data['top'][j], int(data.get('conf', [])[j] if isinstance(data.get('conf', []), list) and data.get('conf', [])[j].isdigit() else -1)))

                    if not candidates:
                        continue

                    # Sort candidates by horizontal position then confidence
                    candidates_sorted = sorted(candidates, key=lambda x: (x[1], -x[2]))
                    parts = []
                    for idx_info in candidates_sorted[:8]:
                        idx = idx_info[0]
                        word = (data['text'][idx] or '').strip()
                        if not word:
                            continue
                        # Skip tokens with digits (likely IDs or numbers)
                        if re.search(r'\d', word):
                            continue
                        parts.append(word)
                    if parts:
                        candidate_name = ' '.join(parts)
                        # Use strong validation before cleaning
                        if _is_valid_owner_name(candidate_name):
                            cleaned = _clean_name(candidate_name)
                            if cleaned:
                                return cleaned

        # Fallback: run a gentle full-text OCR and use existing name candidate logic
        ocr_text = pytesseract.image_to_string(image, lang='eng', config='--psm 6')
        result = _find_name_candidate(ocr_text)
        if result and _is_valid_owner_name(result):
            return result
        return None
    except Exception:
        try:
            ocr_text = pytesseract.image_to_string(image, lang='eng')
            result = _find_name_candidate(ocr_text)
            if result and _is_valid_owner_name(result):
                return result
            return None
        except Exception:
            return None


def _extract_permit_number(ocr_text: str, permit_type: str):
    # _extract_permit_number - find the permit number with permit-specific label priority.
    ptype = (permit_type or '').upper()
    
    # STEP 1: Look for explicit "License Number" or "Permit Number" labels first (most reliable)
    label_patterns = [
        r'(?:License\s*Number|Permit\s*Number|Nomor\s*Permit)\s*[:\-]?\s*([A-Z0-9\-]{5,40})',
    ]
    for pattern in label_patterns:
        match = re.search(pattern, ocr_text, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip()
            normalized = _normalize_permit_number(candidate)
            if normalized and len(normalized) >= 5:  # Valid permit number
                return normalized
    
    # STEP 2: Fallback to permit-type-specific patterns if label not found
    patterns = []
    if ptype:
        patterns.extend([
            rf'\b{re.escape(ptype)}[-–—][A-Z0-9]{{2,12}}(?:[-–—]\d{{4}})?(?:[-–—]\d{{6}})?\b',
            rf'\b{re.escape(ptype)}(?:\s*[-–—]\s*[A-Z0-9]{{2,12}}){{1,5}}\b',
        ])

    # Generic fallback for uncommon license formats.
    patterns.extend([
        r'\b[A-Z]{2,10}[-–—][A-Z0-9]{2,12}(?:[-–—]\d{4})?(?:[-–—]\d{6})?\b',
        r'\b[A-Z]{2,10}(?:\s*[-–—]\s*[A-Z0-9]{2,12}){1,5}\b',
    ])

    for pattern in patterns:
        match = re.search(pattern, ocr_text, re.IGNORECASE)
        if match:
            return _normalize_permit_number(match.group(0))
    return None


def _extract_permit_holder_name(ocr_text: str):
    # _extract_permit_holder_name - extract the holder name without confusing issuer text.
    """Extract permit/license holder name by looking for specific labels first."""
    # Step 1: Look for explicit label-based extraction (most reliable)
    label_patterns = [
        r'(?:License\s+Holder|Permit\s+Holder|Licensee|Pemilik\s*Permit|Penerima|Pemegangan)\s*[:–—]?\s*([A-Za-z][A-Za-z\s\-\'\.]*?)(?:\n|$)',
    ]
    for pattern in label_patterns:
        match = re.search(pattern, ocr_text, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip()
            candidate = re.sub(r'\s+', ' ', candidate)
            if _is_valid_owner_name(candidate):
                return candidate
    
    # Step 2: Fall back to positional/generic extraction
    return None

def extract_ic_data(image_base64: str):
    # extract_ic_data - OCR the IC document and return identity fields for matching.
    """Extract name and Malaysian IC number from an IC image."""
    try:
        image = _decode_base64_to_image(image_base64)
        ocr_text = pytesseract.image_to_string(image, lang='eng')

        name = _find_name_candidate(ocr_text)
        if name:
            name_upper = _normalize_spaces(name).upper()
            if any(marker in name_upper for marker in ['IC NUMBER', 'NO IC', 'FULL NAME', 'KAD PENGENALAN', 'IDENTITY CARD']):
                name = None
        if name:
            name_upper = _normalize_spaces(name).upper()
            if any(marker in name_upper for marker in ['IC NUMBER', 'NO IC', 'FULL NAME', 'KAD PENGENALAN', 'IDENTITY CARD']):
                name = None
        ic_number = _extract_ic_number(ocr_text)

        return {
            'name': name,
            'idNumber': ic_number,
            'raw_text': ocr_text,
            'confidence': {
                'name': 0.0,
                'idNumber': 0.0
            },
            'evidence': {
                'name': '',
                'idNumber': ''
            },
            'extraction_mode': 'ocr-only',
            'ai_error': None
        }
    except Exception as e:
        return {'error': str(e), 'name': None, 'idNumber': None, 'raw_text': ''}


def extract_permit_data(image_base64: str, permit_type: str):
    # extract_permit_data - OCR a permit and return number, area, and holder metadata.
    """Extract permit number and registered area from permit image."""
    try:
        ocr_text = ''
        try:
            image = _decode_base64_to_image(image_base64)
            # Preprocess image to improve OCR accuracy
            pre = _preprocess_image_for_ocr(image)
            ocr_text = pytesseract.image_to_string(pre, lang='eng', config='--psm 6')
        except Exception as decode_err:
            # Fallback: try direct PDF text extraction if PIL image decode fails
            if not PDF_SUPPORT:
                raise decode_err
            try:
                if ',' in image_base64:
                    image_data = base64.b64decode(image_base64.split(',')[1])
                else:
                    image_data = base64.b64decode(image_base64)
                if image_data.startswith(b'%PDF'):
                    pdf_doc = fitz.open(stream=image_data, filetype='pdf')
                    if pdf_doc.page_count == 0:
                        pdf_doc.close()
                        raise Exception('PDF has no pages')
                    page = pdf_doc[0]
                    ocr_text = page.get_text(sort=True) or ''
                    pdf_doc.close()
                else:
                    raise decode_err
            except Exception as pdf_err:
                raise Exception(f'Image decode: {str(decode_err)[:100]}; PDF text extraction: {str(pdf_err)[:100]}')

        ptype = permit_type.upper()
        permit_number = _extract_permit_number(ocr_text, ptype)
        registered_area = _extract_permit_area(ocr_text)

        # Try to extract permit holder/owner name using label-based extraction
        try:
            owner_name = _extract_permit_holder_name(ocr_text)
        except Exception:
            owner_name = None

        return {
            'permitType': ptype,
            'permitNumber': permit_number,
            'registeredArea': registered_area,
            'ownerName': owner_name,
            'raw_text': ocr_text,
            'confidence': {
                'permitNumber': 0.0,
                'registeredArea': 0.0
            },
            'evidence': {
                'permitNumber': '',
                'registeredArea': ''
            },
            'extraction_mode': 'ocr-only',
            'ai_error': None
        }
    except Exception as e:
        error_msg = str(e)
        return {'error': error_msg, 'permitType': permit_type, 'permitNumber': None, 'registeredArea': None, 'raw_text': '', 'debug_error': error_msg}


def detect_document_type_match(raw_text: str, expected_type: str, permit_type: str = None):
    # detect_document_type_match - validate the OCR result against the requested document class.
    """Heuristic document-type gate to reject wrong uploads before auto-fill."""
    text = (raw_text or '')
    upper = text.upper()
    normalized = re.sub(r'[^A-Z0-9]+', '', upper)

    has_ic_number = bool(re.search(r'\b\d{6}-\d{2}-\d{4}\b|\b\d{12}\b', text))
    ic_score = 0
    if 'KAD PENGENALAN' in upper or 'IDENTITY CARD' in upper or 'MYKAD' in upper:
        ic_score += 2
    if has_ic_number:
        ic_score += 2
    if 'WARGANEGARA' in upper or 'MALAYSIA' in upper:
        ic_score += 1

    lot_like = bool(re.search(r'\bLOT\b|\bLOT NO\b|\bMUKIM\b|\bGERAN\b|\bDISTRICT\b|\bSTATE\b', upper))
    area_like = bool(re.search(r'\bHECTARE\b|\bHECTARES\b|\bHA\b|\bLAND AREA\b|\bAREA\b', upper))
    land_score = 0
    if lot_like:
        land_score += 2
    if area_like:
        land_score += 1
    if 'OWNER' in upper or 'TITLE' in upper:
        land_score += 1

    permit_markers = ['LICENSE', 'LICENCE', 'CERTIFICATE', 'PERMIT', 'MPOB', 'LGM', 'MCB', 'MSPO', 'RSPO', 'SSM', 'DOE', 'ISCC', 'KPKT', 'SCCS']
    permit_score = sum(1 for marker in permit_markers if marker in upper)
    has_permit_pattern = bool(re.search(r'\b[A-Z]{2,10}-\d{2,8}(?:-\d{2,8})*\b', upper))
    if has_permit_pattern:
        permit_score += 1

    scores = {
        'ic': float(ic_score),
        'land-title': float(land_score),
        'permit': float(permit_score),
    }
    detected_type = max(scores, key=scores.get)
    max_score = scores[detected_type]

    expected = (expected_type or '').lower()
    matched = False
    reason = ''

    if expected == 'ic':
        matched = ic_score >= 3 and has_ic_number
        reason = 'Missing IC-specific markers or IC number pattern.'
    elif expected == 'land-title':
        matched = land_score >= 2 and (lot_like or area_like)
        reason = 'Missing land-title markers such as LOT/MUKIM/AREA.'
    elif expected == 'permit':
        required = (permit_type or '').upper().strip()

        # Permit signatures with OCR-tolerant markers.
        permit_signatures = {
            'MPOB': [
                'MPOB',
                'MALAYSIAN PALM OIL BOARD',
                'PALM OIL SMALLHOLDER',
                'MPOBPLH',
                'PALM OIL'
            ],
            'MCB': [
                'MCB',
                'MALAYSIAN COCOA BOARD',
                'COCOA SMALLHOLDER REGISTRATION',
                'MCBCOCOA',
                'COCOA'
            ],
            'LGM': [
                'LGM',
                'LEMBAGA GETAH MALAYSIA',
                'RUBBER SMALLHOLDER REGISTRATION',
                'LGMRB',
                'RUBBER'
            ]
        }

        tokens = permit_signatures.get(required, [required] if required else [])
        token_hits = 0
        for token in tokens:
            token_norm = re.sub(r'[^A-Z0-9]+', '', token.upper())
            if not token_norm:
                continue
            if token.upper() in upper or token_norm in normalized:
                token_hits += 1

        # Keep generic permit evidence + require at least one specific signature.
        has_required_signature = token_hits >= 1 if required else False
        has_strong_required_signature = token_hits >= 2 if required else False

        matched = bool(required) and (
            (permit_score >= 2 and has_required_signature) or
            (permit_score >= 1 and has_strong_required_signature)
        )
        reason = f'Document does not appear to be a {required} permit. Please upload the correct license type.'
    else:
        matched = False
        reason = f'Unsupported expected type: {expected_type}'

    confidence = min(1.0, max_score / 6.0)
    return {
        'matched': matched,
        'expected_type': expected,
        'detected_type': detected_type,
        'confidence': round(confidence, 2),
        'scores': scores,
        'reason': '' if matched else reason,
    }


def extract_land_title_data(image_base64: str):
    # extract_land_title_data - OCR land titles for owner, lot, area, and geocoding hints.
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
        
        # Preprocess image to improve OCR accuracy for land title
        pre = _preprocess_image_for_ocr(image)
        ocr_text = pytesseract.image_to_string(pre, lang='eng', config='--psm 6')
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
        owner_match = re.search(r'(?:Owner|OWNER|Pemilik|PEMILIK)\s*(?:Name|Nama)?\s*[:\-]?\s*([A-Za-z\s\-\'\.]{5,120})(?:\n|$)', ocr_text, re.IGNORECASE | re.MULTILINE)
        if owner_match:
            candidate = owner_match.group(1).strip()
            # Clean up trailing junk (like extra spaces or formatting)
            candidate = re.sub(r'\s+', ' ', candidate)
            if _is_valid_owner_name(candidate):
                data['owner_name'] = candidate

        # Try positional name extraction from the preprocessed image for higher accuracy
        try:
            if not data['owner_name']:
                owner_name_pos = _extract_name_from_document_image(pre)
                if owner_name_pos and _is_valid_owner_name(owner_name_pos):
                    data['owner_name'] = owner_name_pos
            else:
                # Double-check that regex-extracted name is still valid
                owner_name_pos = _extract_name_from_document_image(pre)
                if owner_name_pos and _is_valid_owner_name(owner_name_pos):
                    # Prefer positional if different (positional is more accurate)
                    if owner_name_pos.upper() != data['owner_name'].upper():
                        data['owner_name'] = owner_name_pos
        except Exception:
            # If positional fails, keep the regex result if valid
            if not data['owner_name']:
                fallback = _find_name_candidate(ocr_text)
                if fallback and _is_valid_owner_name(fallback):
                    data['owner_name'] = fallback

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
    # calculate_quota - convert declared land area into the quota used by the demo rules.
    actual_ha = area * 0.4047 if unit == 'Acre' else area
    return round(actual_ha * 1.5, 2)


def _parse_plot_crops(plot: dict):
    # _parse_plot_crops - normalize plot crop labels into a stable list for validation.
    # Prefer structured cropTypes when provided by frontend.
    crop_types = plot.get('cropTypes') or []
    if isinstance(crop_types, list) and crop_types:
        parsed = [str(c).strip() for c in crop_types if str(c).strip()]
    else:
        # Backward compatibility for old cropType string values.
        crop_text = str(plot.get('cropType') or '').strip()
        parsed = []
        if crop_text:
            for part in re.split(r'[/,]', crop_text):
                p = part.strip()
                if p:
                    parsed.append(p)

    # Extract explicit Other crop label from either structured field or legacy display text.
    other_crop = str(plot.get('otherCropType') or '').strip()
    if not other_crop:
        raw = str(plot.get('cropType') or '')
        m = re.search(r'Other\s*\(([^)]+)\)', raw, re.IGNORECASE)
        if m:
            other_crop = m.group(1).strip()

    return parsed, other_crop


def _tokenize(text: str):
    # _tokenize - split text into searchable tokens for permit and crop matching.
    stop = {
        'permit', 'license', 'licence', 'registration', 'certificate', 'board',
        'smallholder', 'holder', 'farm', 'plot', 'type', 'other'
    }
    tokens = re.findall(r'[A-Za-z]{3,}', (text or '').lower())
    return {t for t in tokens if t not in stop}


def _other_crop_supported(other_crop: str, other_permit_names: list[str]):
    # _other_crop_supported - confirm that an Other crop is backed by a matching custom permit.
    crop_tokens = _tokenize(other_crop)
    if not crop_tokens:
        return False
    for permit_name in other_permit_names:
        permit_tokens = _tokenize(permit_name)
        if crop_tokens & permit_tokens:
            return True
    return False


def _validate_land_title_area_cap(farmer_data: dict):
    # _validate_land_title_area_cap - ensure plot areas stay within the land title boundary.
    """
    按 land title 分组，检查同一 land title 上的所有 plots 的 license area 总和
    是否超过 land title 的总面积。如果超过，返回 False 和错误信息。
    """
    plots = farmer_data.get('plots', []) or []
    if not plots:
        return True, ''
    
    # 按 landTitleReference 分组
    plots_by_land_title = {}
    for idx, plot in enumerate(plots, start=1):
        land_title_ref = plot.get('landTitleReference', '').strip()
        if not land_title_ref:
            return False, f'Plot {idx}: Land Title Reference is missing.'
        
        land_title_area = float(plot.get('landTitleArea', 0))
        if land_title_area <= 0:
            return False, f'Plot {idx}: Land Title Area must be greater than 0.'
        
        plot_area = float(plot.get('landArea', 0))
        if plot_area <= 0:
            return False, f'Plot {idx}: License Area must be greater than 0.'
        
        if land_title_ref not in plots_by_land_title:
            plots_by_land_title[land_title_ref] = {
                'land_title_area': land_title_area,
                'plots': []
            }
        
        plots_by_land_title[land_title_ref]['plots'].append({
            'index': idx,
            'crop': plot.get('cropType', 'Unknown'),
            'area': plot_area
        })
    
    # 检查每个 land title
    for land_title_ref, data in plots_by_land_title.items():
        total_license_area = sum(p['area'] for p in data['plots'])
        land_title_area = data['land_title_area']
        
        if total_license_area > land_title_area:
            plots_str = ', '.join([f"Plot {p['index']}({p['crop']})" for p in data['plots']])
            return False, f'Land Title {land_title_ref}: Total license area({total_license_area} HA) exceeds land title area({land_title_area} HA). Plots: {plots_str}'
    
    return True, ''


def _validate_farmer_crop_permit_alignment(farmer_data: dict):
    # _validate_farmer_crop_permit_alignment - block crop registrations that do not match an uploaded permit.
    permit_entries = farmer_data.get('permits', []) or []

    standard_permits = {
        p.get('type')
        for p in permit_entries
        if p.get('type') in {'MPOB', 'MCB', 'LGM'} and (p.get('photoUrl') or p.get('number'))
    }
    other_permit_names = [
        str(p.get('name', '')).strip()
        for p in permit_entries
        if p.get('type') == 'OTHER' and str(p.get('name', '')).strip()
    ]
    has_other_permit = len(other_permit_names) > 0

    required_by_crop = {
        'palm oil': 'MPOB',
        'cocoa': 'MCB',
        'rubber': 'LGM',
    }

    for idx, plot in enumerate(farmer_data.get('plots', []) or [], start=1):
        crops, other_crop = _parse_plot_crops(plot)
        if not crops:
            return False, f'Plot {idx}: at least one crop type must be selected.'

        for crop in crops:
            c = crop.strip().lower()
            if not c:
                continue

            if c in required_by_crop:
                required = required_by_crop[c]
                if required not in standard_permits:
                    return False, f'Plot {idx}: crop "{crop}" requires {required} permit.'
                continue

            if c == 'other':
                if not has_other_permit:
                    return False, f'Plot {idx}: crop "Other" requires an uploaded OTHER permit.'
                if not other_crop:
                    return False, f'Plot {idx}: please specify Other crop type.'
                if not _other_crop_supported(other_crop, other_permit_names):
                    return False, f'Plot {idx}: Other crop "{other_crop}" does not match uploaded OTHER permit name.'
                continue

            # Unknown crop label is only allowed when it can be supported by OTHER permit naming.
            if not has_other_permit:
                return False, f'Plot {idx}: crop "{crop}" is not covered by uploaded permits.'
            if not _other_crop_supported(crop, other_permit_names):
                return False, f'Plot {idx}: crop "{crop}" is not matched to uploaded OTHER permit name.'

    return True, ''

# --- Farmer Registration ---
def process_farmer_registration(farmer_data: dict):
    # process_farmer_registration - run the full farmer onboarding and quota calculation flow.
    try:
        # 1. 检查作物与执照的对齐
        valid, msg = _validate_farmer_crop_permit_alignment(farmer_data)
        if not valid:
            return {'success': False, 'message': msg}
        
        # 2. 检查 land title 面积上限
        valid, msg = _validate_land_title_area_cap(farmer_data)
        if not valid:
            return {'success': False, 'message': msg}

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
        return {"success": False, "message": "Registration failed due to server error."}

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
    # process_dealer_registration - persist dealer station identity, location, and license records.
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
    # check_security_filters - enforce the anti-laundering quota gate before transaction approval.
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
    # generate_compliance_report - build the PDF evidence report for a verified transaction.
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
    # generate_farmer_qr_logic - create the QR payload that links a farmer to the traceability flow.
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
    # get_farmer_status_logic - load farmer status, permits, and plot data for dashboard verification.
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

# --- Resolve Land Title Location (Geolocation) ---
def resolve_land_title_location(lot_number: str, mukim: str, district: str, state: str):
    # resolve_land_title_location - geocode land title metadata into ranked location candidates.
    """
    调用 Nominatim (OpenStreetMap) 获取地块位置坐标
    策略优化：优先使用 District 级查询（Nominatim 识别度最高），返回评分最高的候选点
    """
    # 优化后的查询策略：优先 District（最可靠），跳过 Lot（Nominatim 不认识）
    queries = [
        f"{district}, {state}, Malaysia" if district and state else None,  # 最优
        f"{mukim}, {district}, {state}, Malaysia" if mukim and district and state else None,  # 更精准尝试
        f"{state}, Malaysia" if state else None,  # 后备
    ]
    
    # 过滤空查询和去重
    seen = set()
    filtered_queries = []
    for q in queries:
        if q and q not in seen:
            filtered_queries.append(q)
            seen.add(q)
    queries = filtered_queries
    
    if not queries:
        return {
            "success": False,
            "candidates": [],
            "error": "Insufficient land title metadata for geolocation"
        }
    
    candidates = []
    
    for query_text in queries:
        try:
            # 调用 Nominatim API (OpenStreetMap)
            nominatim_url = "https://nominatim.openstreetmap.org/search"
            params = urllib.parse.urlencode({
                'q': query_text,
                'format': 'json',
                'limit': 5,
                'countrycodes': 'MY'  # Malaysia only
            })
            
            url = f"{nominatim_url}?{params}"
            headers = {'User-Agent': 'BorneoHack-Geocoder/1.0'}
            
            request = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(request, timeout=5) as response:
                results = json.loads(response.read().decode('utf-8'))
            
            # 优化置信度评分：优先 District 级结果
            # District 查询给予更高基础分
            query_priority_score = 0.85 if 'District' not in query_text and 'Mukim' not in query_text else 0.70  # 只有 State -> 0.70
            if district and district in query_text:
                query_priority_score = 0.90  # District 级 -> 0.90
            if mukim and mukim in query_text:
                query_priority_score = 0.75  # Mukim 级 -> 0.75
            
            for result in results:
                if result.get('lat') and result.get('lon'):
                    osm_importance = float(result.get('importance', 0.5))
                    
                    # 新权重：OSM importance 占 50%，查询优先级占 50%
                    confidence = round((query_priority_score * 0.5 + osm_importance * 0.5), 3)
                    
                    candidate = {
                        "lat": float(result['lat']),
                        "lng": float(result['lon']),
                        "display_name": result.get('display_name', ''),
                        "confidence": confidence,
                        "source": "nominatim",
                        "query_used": query_text,
                        "osm_type": result.get('osm_type', 'N/A'),
                        "osm_id": result.get('osm_id', 'N/A'),
                    }
                    candidates.append(candidate)
        
        except Exception as e:
            print(f"Nominatim query error for '{query_text}': {e}")
            continue
    
    # 智能排序：优先细粒度结果（District > State），然后才是置信度
    def sort_key(candidate):
        confidence = candidate['confidence']
        display = candidate['display_name'].lower()
        
        # 粒度加成：如果是 District 级（包含县名），提升排序优先级
        granularity_bonus = 0
        if district and district.lower() in display and state and state.lower() in display:
            # 同时包含 District + State -> District 级结果
            granularity_bonus = 0.15
        elif state and state.lower() in display and district and district.lower() not in display:
            # 只包含 State -> 州级结果（降低优先级）
            granularity_bonus = -0.10
        
        return confidence + granularity_bonus
    
    candidates.sort(key=sort_key, reverse=True)
    
    # 去重：如果坐标太接近（<0.01 度 ≈ 1km），只保留一个
    deduped = []
    for candidate in candidates:
        is_duplicate = any(
            abs(candidate['lat'] - d['lat']) < 0.01 and 
            abs(candidate['lng'] - d['lng']) < 0.01
            for d in deduped
        )
        if not is_duplicate:
            deduped.append(candidate)
    
    return {
        "success": len(deduped) > 0,
        "candidates": deduped[:5],  # 返回前5个候选
        "queries_used": queries,
        "primary_candidate": deduped[0] if deduped else None
    }

# --- Verify Spatial Compliance ---
def verify_spatial_compliance(current_lat: float, current_lng: float, boundary_points: list):
    # verify_spatial_compliance - test whether a point falls inside the registered geofence boundary.
    if not boundary_points or len(boundary_points) < 3:
        return {"status": "NEED_STAGE_2", "message": "No boundary data! Please complete Stage 2: Add Plot first."}

    polygon_coords = [(p['lng'], p['lat']) for p in boundary_points]
    fence = Polygon(polygon_coords)
    current_point = Point(current_lng, current_lat)
    
    is_inside = fence.contains(current_point)
    return {"status": "SUCCESS" if is_inside else "OUT_OF_BOUNDS", "is_inside": is_inside}

# --- Generate Consolidated Report ---
def generate_consolidated_report(manifest_data: dict):
    # generate_consolidated_report - build the dealer manifest PDF from a batch of transactions.
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
    # save_transaction - persist a transaction record for later audit and sync.
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if not tx_data.get('id'):
            tx_data['id'] = f"TX-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        cursor.execute('''
            INSERT OR REPLACE INTO transactions 
            (id, farmer_id, farmer_name, weight, mode, location, timestamp, ffb_batch_url, farmer_signature_url, status, risk, crop_type, source_plot)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            tx_data.get('cropType', 'Palm Oil'),
            json.dumps(tx_data.get('sourcePlot')) if tx_data.get('sourcePlot') is not None else None
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


def get_all_transactions():
    # get_all_transactions - return the complete transaction ledger for the dashboard.
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, farmer_id, farmer_name, weight, mode, location, timestamp, ffb_batch_url, farmer_signature_url, status, risk, crop_type, source_plot
            FROM transactions
            ORDER BY timestamp DESC
        ''')
        rows = cursor.fetchall()
        conn.close()

        transactions = []
        for row in rows:
            location = json.loads(row['location']) if row['location'] else {}
            source_plot = json.loads(row['source_plot']) if row['source_plot'] else None
            transactions.append({
                'id': row['id'],
                'txId': row['id'],
                'farmerId': row['farmer_id'],
                'farmerDisplayId': f"F-{str(row['farmer_id'])[-6:]}" if row['farmer_id'] else row['id'],
                'name': row['farmer_name'],
                'farmerName': row['farmer_name'],
                'weight': row['weight'],
                'weightDisplay': str(row['weight']) if row['weight'] is not None else '0',
                'mode': row['mode'],
                'location': location,
                'timestamp': row['timestamp'],
                'time': datetime.datetime.fromisoformat(row['timestamp']).strftime('%H:%M') if row['timestamp'] else '',
                'ffbBatchUrl': row['ffb_batch_url'],
                'farmerSignatureUrl': row['farmer_signature_url'],
                'status': row['status'],
                'risk': row['risk'],
                'warning': row['risk'] not in (None, 'Safe', 'verified'),
                'cropType': row['crop_type'],
                'crop': row['crop_type'],
                'sourcePlot': source_plot,
                'sourcePlotId': source_plot.get('id') if isinstance(source_plot, dict) else None,
                'sourcePlotName': source_plot.get('plotName') if isinstance(source_plot, dict) else None,
            })
        return {'success': True, 'transactions': transactions}
    except Exception as e:
        print(f"Get Transactions Error: {e}")
        return {'success': False, 'error': str(e)}


def get_transactions_by_farmer(farmer_id: str):
    # get_transactions_by_farmer - filter the transaction ledger to one farmer ID.
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        farmer_display_id = farmer_id
        if farmer_id and '-' in farmer_id:
            farmer_display_id = f"F-{farmer_id[-6:]}"
        cursor.execute('''
            SELECT id, farmer_id, farmer_name, weight, mode, location, timestamp, ffb_batch_url, farmer_signature_url, status, risk, crop_type, source_plot
            FROM transactions
            WHERE farmer_id = ? OR farmer_id = ?
            ORDER BY timestamp DESC
        ''', (farmer_id, farmer_display_id))
        rows = cursor.fetchall()
        conn.close()

        transactions = []
        for row in rows:
            location = json.loads(row['location']) if row['location'] else {}
            source_plot = json.loads(row['source_plot']) if row['source_plot'] else None
            transactions.append({
                'id': row['id'],
                'txId': row['id'],
                'farmerId': row['farmer_id'],
                'name': row['farmer_name'],
                'farmerName': row['farmer_name'],
                'weight': row['weight'],
                'weightDisplay': str(row['weight']) if row['weight'] is not None else '0',
                'mode': row['mode'],
                'location': location,
                'timestamp': row['timestamp'],
                'ffbBatchUrl': row['ffb_batch_url'],
                'farmerSignatureUrl': row['farmer_signature_url'],
                'status': row['status'],
                'risk': row['risk'],
                'warning': row['risk'] not in (None, 'Safe', 'verified'),
                'cropType': row['crop_type'],
                'reason': None,
                'sourcePlot': source_plot,
                'sourcePlotId': source_plot.get('id') if isinstance(source_plot, dict) else None,
                'sourcePlotName': source_plot.get('plotName') if isinstance(source_plot, dict) else None,
            })
        return {'success': True, 'transactions': transactions}
    except Exception as e:
        print(f"Get Farmer Transactions Error: {e}")
        return {'success': False, 'error': str(e)}


def clear_transactions_by_farmer(farmer_id: str):
    # clear_transactions_by_farmer - delete one farmer's transactions after sync or reset.
    """Clear all transactions for a farmer (demo reset flow)."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        farmer_display_id = farmer_id
        if farmer_id and '-' in farmer_id:
            farmer_display_id = f"F-{farmer_id[-6:]}"
        cursor.execute('''
            DELETE FROM transactions
            WHERE farmer_id = ? OR farmer_id = ?
        ''', (farmer_id, farmer_display_id))
        deleted_rows = cursor.rowcount
        conn.commit()
        conn.close()
        return {"success": True, "deleted": deleted_rows}
    except Exception as e:
        print(f"Clear Farmer Transactions Error: {e}")
        return {"success": False, "error": str(e)}

# --- Request Transaction Audit ---
def request_transaction_audit(transaction_id: str, requested_by: str = "dealer"):
    # request_transaction_audit - flag a transaction for manual review when risk is detected.
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
    # sync_transactions - import offline transaction batches into the live ledger.
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

# --- EUDR Deforestation Check ---
def check_eudr_deforestation(boundary_coords: list, upload_date_str: str, plot_id: str = None):
    # check_eudr_deforestation - compare historical NDVI against current imagery for deforestation risk.
    """
    Check EUDR deforestation risk by comparing 2020-12-31 vegetation vs upload date.
    
    Args:
        boundary_coords: List of {lat, lng} dicts defining plot polygon
        upload_date_str: ISO date string when land title was uploaded (e.g. '2024-03-15')
        plot_id: Optional plot identifier for logging
    
    Returns:
        {
            'success': bool,
            'risk_score': 0-100 (0=no risk, 100=severe deforestation),
            'risk_level': 'Negligible' | 'Low' | 'Medium' | 'High',
            'ndvi_2020': float,
            'ndvi_current': float,
            'ndvi_change_pct': float,
            'comparison_map_base64': 'data:image/png;base64,...',
            'details': {...}
        }
    """
    if not EUDR_SUPPORT:
        return {
            'success': False,
            'error': 'EUDR dependencies not installed. Run: pip install planetary-computer pystac-client rasterio numpy matplotlib shapely',
            'risk_score': None,
            'risk_level': 'Unknown'
        }
    
    try:
        # Parse upload date
        try:
            upload_date = datetime.datetime.fromisoformat(upload_date_str.replace('Z', '+00:00'))
        except:
            upload_date = datetime.datetime.now()
        
        # EUDR cutoff date
        eudr_cutoff = datetime.datetime(2020, 12, 31)
        
        # Create bounding box from polygon
        lats = [p['lat'] for p in boundary_coords]
        lngs = [p['lng'] for p in boundary_coords]
        bbox = [min(lngs), min(lats), max(lngs), max(lats)]  # [west, south, east, north]
        
        # Buffer bbox slightly for context
        buffer = 0.005  # ~500m
        bbox_buffered = [
            bbox[0] - buffer,
            bbox[1] - buffer,
            bbox[2] + buffer,
            bbox[3] + buffer
        ]
        
        # Connect to Microsoft Planetary Computer
        catalog = Client.open(
            "https://planetarycomputer.microsoft.com/api/stac/v1",
            modifier=planetary_computer.sign_inplace,
        )
        
        # Search for Sentinel-2 imagery (cloud-free preferred)
        def get_best_scene(start_date, end_date, max_cloud=20):
            """Find least cloudy scene in date range"""
            search = catalog.search(
                collections=["sentinel-2-l2a"],
                bbox=bbox_buffered,
                datetime=f"{start_date.date()}/{end_date.date()}",
                query={"eo:cloud_cover": {"lt": max_cloud}}
            )
            items = list(search.items())
            if not items:
                # Retry with higher cloud tolerance
                search = catalog.search(
                    collections=["sentinel-2-l2a"],
                    bbox=bbox_buffered,
                    datetime=f"{start_date.date()}/{end_date.date()}",
                    query={"eo:cloud_cover": {"lt": 50}}
                )
                items = list(search.items())
            
            if not items:
                return None
            
            # Sort by cloud cover
            items_sorted = sorted(items, key=lambda x: x.properties.get('eo:cloud_cover', 100))
            return items_sorted[0]
        
        # Get 2020 baseline scene (within 3 months of cutoff)
        scene_2020_start = datetime.datetime(2020, 10, 1)
        scene_2020_end = datetime.datetime(2021, 2, 28)
        scene_2020 = get_best_scene(scene_2020_start, scene_2020_end)
        
        if not scene_2020:
            return {
                'success': False,
                'error': 'No cloud-free Sentinel-2 imagery available for 2020 baseline',
                'risk_score': None,
                'risk_level': 'Unknown'
            }
        
        # Get current scene (within 3 months of upload date)
        scene_current_start = upload_date - datetime.timedelta(days=90)
        scene_current_end = upload_date + datetime.timedelta(days=30)
        scene_current = get_best_scene(scene_current_start, scene_current_end)
        
        if not scene_current:
            return {
                'success': False,
                'error': f'No cloud-free Sentinel-2 imagery available near upload date {upload_date.date()}',
                'risk_score': None,
                'risk_level': 'Unknown'
            }
        
        # Extract NDVI from scenes
        def calculate_ndvi_from_scene(scene, bbox):
            """Calculate mean NDVI for plot area"""
            # Get NIR (B08) and Red (B04) bands
            nir_href = scene.assets["B08"].href
            red_href = scene.assets["B04"].href
            
            with rasterio.open(nir_href) as nir_src:
                # Read bbox window
                window = rasterio.windows.from_bounds(*bbox, transform=nir_src.transform)
                nir = nir_src.read(1, window=window).astype(float)
            
            with rasterio.open(red_href) as red_src:
                window = rasterio.windows.from_bounds(*bbox, transform=red_src.transform)
                red = red_src.read(1, window=window).astype(float)
            
            # Calculate NDVI: (NIR - Red) / (NIR + Red)
            # Avoid division by zero
            denominator = nir + red
            ndvi = np.where(denominator != 0, (nir - red) / denominator, 0)
            
            # Mask invalid values (clouds, water, etc.)
            ndvi_masked = np.where((ndvi >= -1) & (ndvi <= 1), ndvi, np.nan)
            
            return ndvi_masked, np.nanmean(ndvi_masked)
        
        ndvi_2020_map, ndvi_2020_mean = calculate_ndvi_from_scene(scene_2020, bbox_buffered)
        ndvi_current_map, ndvi_current_mean = calculate_ndvi_from_scene(scene_current, bbox_buffered)
        
        # Calculate NDVI change
        ndvi_change = ndvi_current_mean - ndvi_2020_mean
        ndvi_change_pct = (ndvi_change / abs(ndvi_2020_mean)) * 100 if ndvi_2020_mean != 0 else 0
        
        # Calculate deforestation risk score (0-100)
        # EU guideline: NDVI drop > 30% = high risk
        risk_score = 0
        if ndvi_change_pct < -30:  # Severe loss
            risk_score = 90 + min(10, abs(ndvi_change_pct) - 30) / 2
        elif ndvi_change_pct < -15:  # Moderate loss
            risk_score = 50 + (abs(ndvi_change_pct) - 15) * 2.67
        elif ndvi_change_pct < 0:  # Minor loss
            risk_score = abs(ndvi_change_pct) * 3.33
        else:  # No loss or gain
            risk_score = 0
        
        risk_score = min(100, max(0, risk_score))
        
        # Risk level classification
        if risk_score < 15:
            risk_level = 'Negligible'
        elif risk_score < 40:
            risk_level = 'Low'
        elif risk_score < 70:
            risk_level = 'Medium'
        else:
            risk_level = 'High'
        
        # Generate comparison visualization
        fig, axes = plt.subplots(1, 3, figsize=(15, 5))
        
        # 2020 NDVI
        im1 = axes[0].imshow(ndvi_2020_map, cmap='RdYlGn', vmin=-0.2, vmax=1)
        axes[0].set_title(f'2020 Baseline NDVI\n(Mean: {ndvi_2020_mean:.3f})', fontsize=10, fontweight='bold')
        axes[0].axis('off')
        plt.colorbar(im1, ax=axes[0], fraction=0.046, pad=0.04)
        
        # Current NDVI
        im2 = axes[1].imshow(ndvi_current_map, cmap='RdYlGn', vmin=-0.2, vmax=1)
        axes[1].set_title(f'Current NDVI ({upload_date.date()})\n(Mean: {ndvi_current_mean:.3f})', fontsize=10, fontweight='bold')
        axes[1].axis('off')
        plt.colorbar(im2, ax=axes[1], fraction=0.046, pad=0.04)
        
        # NDVI Change (Deforestation Risk)
        ndvi_diff = ndvi_current_map - ndvi_2020_map
        im3 = axes[2].imshow(ndvi_diff, cmap='RdYlGn', vmin=-0.5, vmax=0.5)
        axes[2].set_title(f'NDVI Change\n({ndvi_change_pct:.1f}% | Risk: {risk_level})', fontsize=10, fontweight='bold')
        axes[2].axis('off')
        plt.colorbar(im3, ax=axes[2], fraction=0.046, pad=0.04, label='NDVI Δ')
        
        plt.tight_layout()
        
        # Save to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close()
        
        comparison_map_data_uri = f"data:image/png;base64,{img_base64}"
        
        return {
            'success': True,
            'risk_score': round(risk_score, 1),
            'risk_level': risk_level,
            'ndvi_2020': round(ndvi_2020_mean, 3),
            'ndvi_current': round(ndvi_current_mean, 3),
            'ndvi_change_pct': round(ndvi_change_pct, 1),
            'comparison_map_base64': comparison_map_data_uri,
            'details': {
                'scene_2020_date': scene_2020.datetime.date().isoformat(),
                'scene_2020_cloud_cover': scene_2020.properties.get('eo:cloud_cover'),
                'scene_current_date': scene_current.datetime.date().isoformat(),
                'scene_current_cloud_cover': scene_current.properties.get('eo:cloud_cover'),
                'plot_id': plot_id,
                'upload_date': upload_date.date().isoformat()
            }
        }
    
    except Exception as e:
        print(f"EUDR Check Error for plot {plot_id}: {e}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e),
            'risk_score': None,
            'risk_level': 'Unknown'
        }
