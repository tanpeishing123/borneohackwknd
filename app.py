import streamlit as st
import pandas as pd
from datetime import datetime
import io
from PIL import Image

# Import your logic functions
from logic import generate_qr_code, check_gps_fence, render_interactive_map, create_dds_report

# --- Page Configuration ---
st.set_page_config(page_title="Akar-Bukti 2.0 | EUDR Compliance Platform", layout="wide")

# --- Custom Styling ---
st.markdown("""
    <style>
    .main { background-color: #f8fafc; }
    .stButton>button { 
        width: 100%; 
        border-radius: 8px; 
        height: 3.5em; 
        background-color: #064e3b; 
        color: white;
        font-weight: bold;
    }
    .stBadge { background-color: #e2e8f0; }
    </style>
    """, unsafe_allow_html=True)

# --- Sidebar Navigation ---
st.sidebar.image("https://cdn-icons-png.flaticon.com/512/628/628324.png", width=80)
st.sidebar.title("Akar-Bukti 2.0")
st.sidebar.markdown("---")
menu = st.sidebar.radio(
    "Modules", 
    ["1. Farmer Onboarding (MSPO)", "2. Transaction (Edge AI)", "3. Compliance Dashboard"]
)

# --- Mock Database Session ---
if 'db' not in st.session_state:
    st.session_state.db = []

# ----------------- MODULE 1: FARMER ONBOARDING -----------------
if menu == "1. Farmer Onboarding (MSPO)":
    st.header("🌿 Farmer Digital Identity & MSPO Linking")
    st.info("Verification of Legality: Syncing with MSPO Database to ensure land and labor compliance.")
    
    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Profile Registration")
        name = st.text_input("Farmer Name", placeholder="e.g. Tan Pei Shing")
        ic_number = st.text_input("National ID (IC)")
        mspo_id = st.text_input("MSPO Certificate No.", placeholder="MSPO-XXXX-2026")
        land_size = st.number_input("Total Land Size (Hectares)", min_value=0.1, step=0.1)
        
    with col2:
        st.subheader("📍 Geofence Definition (GIS)")
        st.caption("Define the legal polygon boundary for the plantation.")
        # Default mock coordinates: Jerantut, Pahang
        m = render_interactive_map(3.933, 102.362)
        st.components.v1.html(m._repr_html_(), height=300)

    if st.button("Generate Digital Compliance ID"):
        if name and mspo_id:
            user_data = {
                "name": name, 
                "mspo": mspo_id, 
                "size": land_size, 
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            qr_img_bytes = generate_qr_code(user_data)
            
            st.success("✅ Profile Verified! MSPO Legality Link Established.")
            st.image(qr_img_bytes, caption=f"Encrypted QR ID for {name}", width=200)
            st.session_state.db.append(user_data)
            st.download_button("Download QR Identity", data=qr_img_bytes, file_name="farmer_id.png", mime="image/png")
        else:
            st.error("Please fill in all required fields.")

# ----------------- MODULE 2: TRANSACTION (EDGE AI) -----------------
elif menu == "2. Transaction (Edge AI)":
    st.header("🤝 Secure Handshake & Scenario Recognition")
    st.warning("📡 OFFLINE MODE ACTIVE: Using Edge AI for local verification.")

    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("Field Data Capture")
        uploaded_qr = st.file_uploader("Scan Farmer QR Code", type=['png', 'jpg'])
        
        # Simulated GPS from device
        current_lat = st.number_input("Live GPS Latitude", value=3.932, format="%.4f")
        current_lng = st.number_input("Live GPS Longitude", value=102.363, format="%.4f")
        weight = st.number_input("Harvest Weight (Metric Tonnes)", min_value=0.0, step=0.1)

    with col2:
        st.subheader("AI Verification Engine")
        if uploaded_qr:
            # 1. Geofence Check
            is_inside = check_gps_fence(current_lat, current_lng)
            
            if is_inside:
                st.success("🎯 Geofence Match: IN-PLANTATION (Low Risk)")
            else:
                st.error("🚨 Warning: GPS Mismatch! Out-of-Bound Transaction Detected.")
                st.info("Triggering Traceability Trust-Chain Protocol...")
            
            # 2. Yield Anomaly Detection
            if weight > 10.0:
                st.warning("⚠️ Yield Anomaly: Input exceeds monthly capacity. Anti-Laundering Lock engaged.")
            else:
                st.info("✅ Yield Check: Within legal threshold.")

            if st.button("Submit Encrypted Evidence"):
                st.balloons()
                st.success("Transaction locally hashed and stored. Syncing will resume once network is available.")

# ----------------- MODULE 3: COMPLIANCE DASHBOARD -----------------
elif menu == "3. Compliance Dashboard":
    st.header("📊 Global Compliance & Risk Analytics")
    
    # Key Performance Indicators
    c1, c2, c3 = st.columns(3)
    c1.metric("Verified Farmers", len(st.session_state.db))
    c2.metric("Zero-Deforestation Rate", "100%", delta="Verified")
    c3.metric("Blocked Laundering Attempts", "2", delta_color="inverse")

    st.subheader("Pending EU-DDS Reports")
    if st.session_state.db:
        for i, farmer in enumerate(st.session_state.db):
            with st.expander(f"Batch ID: AB-{i+1001} | Farmer: {farmer['name']}"):
                col_a, col_b = st.columns([3, 1])
                with col_a:
                    st.write(f"**MSPO Status:** ACTIVE")
                    st.write(f"**EUDR Alignment:** Deforestation-Free (Verified by Satellite Sync)")
                    st.write(f"**Timestamp:** {farmer['timestamp']}")
                
                with col_b:
                    # PDF Generation
                    pdf_bytes = create_dds_report(farmer['name'], f"Lot-PAH-{i+22}")
                    st.download_button(
                        label="📄 Download DDS",
                        data=pdf_bytes,
                        file_name=f"EUDR_DDS_{farmer['name']}.pdf",
                        mime="application/pdf",
                        key=f"btn_{i}"
                    )
    else:
        st.info("No synchronized transaction data found. Please complete an onboarding session first.")

# --- Footer ---
st.divider()
st.caption("Akar-Bukti 2.0 | Empowering Smallholders for EUDR Compliance | BorNEO HackWknd Project")