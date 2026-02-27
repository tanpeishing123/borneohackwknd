import qrcode
from io import BytesIO
from fpdf import FPDF
from shapely.geometry import Point, Polygon
import folium
import json
import time

# --- 1. QR Code Logic ---
def generate_qr_code(data_dict):
    """Converts data dictionary to QR code byte stream."""
    qr_str = json.dumps(data_dict)
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_str)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#064e3b", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

# --- 2. GPS Geofencing Logic ---
def check_gps_fence(lat, lng):
    """Verifies if coordinates are within the legal polygon."""
    point = Point(lng, lat)
    # Mock boundary for demo
    poly_coords = [[102.360, 3.930], [102.365, 3.930], [102.365, 3.935], [102.360, 3.935], [102.360, 3.930]]
    poly = Polygon(poly_coords)
    return poly.contains(point)

# --- 3. Map Rendering Logic ---
def render_interactive_map(lat, lng):
    """Creates a map with geofence and collection marker."""
    m = folium.Map(location=[lat, lng], zoom_start=15)
    folium.Marker([lat, lng], popup="Current Batch").add_to(m)
    folium.Polygon(
        locations=[[3.930, 102.360], [3.930, 102.365], [3.935, 102.365], [3.935, 102.360]],
        color="green", fill=True, fill_opacity=0.2
    ).add_to(m)
    return m

# --- 4. PDF Generation Logic ---
def create_dds_report(name, lot):
    """Generates a PDF byte stream for EUDR compliance."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, "OFFICIAL EUDR DDS REPORT", ln=True, align='C')
    pdf.set_font("Arial", '', 12)
    pdf.ln(10)
    pdf.cell(200, 10, f"Farmer: {name}", ln=True)
    pdf.cell(200, 10, f"Location: {lot}", ln=True)
    pdf.cell(200, 10, "Status: COMPLIANT / NEGLIGIBLE RISK", ln=True)
    return pdf.output(dest='S').encode('latin-1')

# --- 5. Firebase Placeholder ---
def save_farmer_to_firebase(name, ic, lot, mspo):
    """Interface for database storage (Backend Member's Task)."""
    # Member B will implement firebase-admin here
    pass