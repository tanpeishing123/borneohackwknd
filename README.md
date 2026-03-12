# Veri - EUDR Compliance System

Veri is an AI- and GIS-powered multi-commodity compliance ecosystem designed to bridge the digital divide for smallholders under the EU Deforestation Regulation (EUDR) 2023/1115.

## 📝Project Overview
Veri automates the entire compliance workflow—from farmer identity verification to proactive fraud interception and Due Diligence Statement (DDS) generation. It ensures that every batch of commodities (Palm Oil, Cocoa, Rubber) entering the supply chain is verified for "Zero Deforestation" and "Legal Production."

## 🌍SDGs Addressed
__🏛️ SDG 9: Industry, Innovation, and Infrastructure__

- __Resilient Digital Infrastructure__: Veri establishes a decentralized, "Offline-First" digital infrastructure in connectivity-deprived agricultural regions. By utilizing Edge AI, the system overcomes traditional infrastructure gaps, ensuring that technological reliability is independent of network availability.

- __Inclusive Innovation__: The platform fosters inclusive industrialization by ensuring that technological barriers do not disenfranchise small-scale producers. It facilitates the integration of agricultural MSMEs into the global industrial value chain through localized, accessible innovation.
🏛️ SDG 9: Industry, Innovation, and Infrastructure

Resilient Digital Infrastructure: Veri establishes a decentralized, "Offline-First" digital infrastructure in connectivity-deprived agricultural regions. By utilizing Edge AI, the system overcomes traditional infrastructure gaps, ensuring that technological reliability is independent of network availability.

Inclusive Innovation: The platform fosters inclusive industrialization by ensuring that technological barriers do not disenfranchise small-scale producers. It facilitates the integration of agricultural MSMEs into the global industrial value chain through localized, accessible innovation.

## 👥 Target Users

- __Smallholder Farmers:__ To digitize land assets and obtain a "Digital Compliance Passport."
****

- **Dealers / Ramp Operators: # Prerequisites:**To perform real-time field verification and intercept non-compliant transactions.

- **Millers & Exporters:**To automatically generate EU-compliant DDS reports.

## 🛠️ Prerequisites

- **Python 3.8+** (https://www.python.org/downloads/)
- **Node.js 16+** (https://nodejs.org/)

## Setup

```bash
cd c:\Users\User\Documents\borneohackwknd

# Install dependencies
pip install -r requirements.txt
npm install
```

## Run

**Terminal 1 - Backend:**
```bash
cd src/backend && python main.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Project Structure

```
src/
├── backend/           # FastAPI server (main.py, logic.py)
├── frontend/          # React frontend (App.tsx, main.tsx)
scripts/               # Demo helpers (generate_demo_pdfs.py, create_demo_land_title.py)
demo_assets/           # Sample files
requirements.txt       # Python dependencies
package.json           # Node.js dependencies
```

To reset the database, simply delete the `veri_demo.db` file and restart the backend.

---

## 🌐 API Documentation

After starting the backend, visit: **http://localhost:8002/docs**

### Key Endpoints:

- `POST /extract/ic` - Extract identity card information (OCR)
- `POST /extract/land-title` - Extract land title data (OCR)
- `POST /extract/permit` - Extract permit information (OCR)
- `POST /farmer/register` - Register new farmer
- `POST /transaction/verify` - Verify transaction for EUDR compliance

---

## 💻 System Requirements

- **OS:** Windows 10/11, macOS, Linux
- **Python:** 3.8 or higher
- **Node.js:** 16 or higher
- **RAM:** Minimum 4GB
- **Storage:** Minimum 500MB free space
- **Tesseract OCR:** Required for document scanning

---

## 📝 Development Commands

```bash
# Start backend server
cd src/backend
python main.py

# Start frontend dev server
cd C:\Users\User\Documents\borneohackwknd
npm run dev

# Check code types
npm run lint

# Reset database
# Simply delete src/backend/veri_demo.db and restart backend
```

---

## 🎯 Features

- 🆔 **Identity Card OCR** - Automatic IC information extraction
- 📄 **Land Title OCR** - Extract land area and owner information
- 🗺️ **Map Drawing** - Manual polygon drawing or auto-detection
- � **Transaction Verification** - EUDR compliance checking
- 🌴 **Supply Chain Traceability** - Full crops supply chain tracking
- 📊 **Audit Trail** - Complete transaction history

---

## ✅ Pre-flight Checklist

Before running the application, verify:

- [ ] Python is installed (`python --version`)
- [ ] Node.js is installed (`node --version`)
- [ ] Tesseract is installed at `C:\Program Files\Tesseract-OCR`
- [ ] Python dependencies installed (`pip install -r requirements.txt`)
- [ ] Node dependencies installed (`npm install`)
- [ ] Two terminal windows are open
- [ ] Backend shows success message
- [ ] Frontend shows success message
- [ ] Browser can access http://localhost:3000

---

## 🔒 Security Notes

**API Keys are Safe:**
- `.env` files are automatically ignored by Git (see `.gitignore`)
- Never commit `.env` to GitHub — only commit `.env.example`
- Team members should copy `.env.example` to `.env` and add their own keys
- No API key is required for the system to work (optional enhancement only)

**Database:**
- SQLite database contains test/demo data only
- In production, migrate to PostgreSQL/MySQL for better security

---

## Resource
__Demo Video and Report Link__:https://drive.google.com/drive/u/0/folders/1Bje1DI_3ZuZOQ4uxSTxMm20ktqQqqW0X

## 🕹️ How to Interact with the Prototype

Veri facilitates a dual-role workflow: the __Farmer__(Onboarding & Plot Modeling) and the __Dealer__(Verification & Fraud Interception). Follow these steps to test the "Edge AI" and "GIS" logic.

__Step 1: Farmer AI Onboarding (OCR Logic)__
To ensure the best experience and to unlock all demo features __please use the following demo credentials during the 3-step signup process.__
|Filed | Value to Input|
|Name|Ahmad Faizal Bin Rahman|
|ic|820101-01-5543|
1. Enter Portal: On the landing page, click __"I am a Farmer"__ and navigate to the Sign Up screen.
2. __Upload IC__: Click "Upload IC" and select a sample image. 
- __Test Case 1 (Document Error)__: Upload a non-ID image (e.g., a landscape photo). 
- __Expected Result__: The system will trigger an __"IC VALIDATION ERROR"__, demonstrating the local OCR's ability to identify incorrect document types.
1. __Automatic Fill__: Upload `sample_ic.png` from the `demo_assets` folder. 
- __Result__: The __Name__ and __IC Number__ will be automatically extracted and filled via __Pytesseract__.

__Step 2: Multi-Plot Geofencing (GIS Logic)__
Veri offers two distinct methods to register and verify plantation boundaries, ensuring both user convenience and data integrity.
__Method A: Auto-detect (Evidence-Based Position)__
1. Navigate to the Plot Registration page.
2. Click the "__Auto-detect__" button located at the bottom left of the map interface.
3. __Mechanism__: The system uses AI to parse the uploaded "Land Title Evidence." It extracts official GPS coordinates or loScation markers directly from the legal document.
4. __Verification__: A "Location Confirmation" modal will appear (as seen in image_ab5155.png), displaying the extracted address and coordinates with an "__Official Verified__" badge.
5. Click "__Confirm Location__" to automatically center the map and pin the verified site.

__Method B: Draw Polygon (Manual Boundary & Anti-Fraud)__
1. Click the "__Draw Polygon__" button on the right side of the map interface.
2. Use your mouse/touchscreen to draw the physical boundaries of the plantation on the interactive map.
3. __Validation Logic__: Once the polygon is closed, the Shapely engine calculates the actual physical area in Hectares (HA).
4. __Test Case (Area Discrepancy Fraud)__:
- __Action__: Set the "Land Area" field to 2.5 HA, but draw a polygon that covers a much larger area (e.g., covering an entire neighborhood).
- __Expected Result__: The Real-time Area Compliance widget will instantly display a red warning (e.g., "Difference: 59.6%").
- __Safety Lock__: The "Save Plot" button will be disabled/locked, preventing the registration of fraudulent acreage which could be used for "crop laundering."

__Step 3:  Dealer Onboarding (Station Registration)__
Before collection operators can begin scanning crops, they must verify their identity and secure their station's credentials. This is a crucial step to ensure the integrity of the supply chain.
To ensure the best experience and to unlock all demo features (e.g., historical records and manifest generation), __please use the following demo credentials during the 3-step signup process.__

Demo Credentials:
| Field | Value to Input / Select | 
|-------|-------------------------|
|Representative Name| Suresh Kumar a/l Muniandy 
|Mobile|+60 12-684 2291|
|License/Certificate Number|MPOB-DLR-2026-002151|
|Station/Ramp Name|Jerantut Agro Collection Ramp|
1. Identity Entry: On the landing page, click "I am a Dealer" -> "Sign Up".
2. __Step 1: Personal Info__: Enter the Representative Name and Mobile Number
3. __Step 2: Business & License__:
- Input the Collection Station 
- Select your license types (MPOB, MCB, etc.) and enter the corresponding Permit Numbers
4. __Step 3: Verification & AI Audit__:
- __Mechanism__: The system auto-detects the Station's GPS and requires a photo of the physical license 
- __Test Case (License Mismatch)__: Attempt to upload a document that does not match the selected "MPOB" license type.
- __Expected Result__: The system's local validation will trigger a browser alert: "Uploaded file does not look like a MPOB permit", demonstrating our document-type auditing.
5. __Completion__: Upon successful validation, the screen will display "Station Secured!" (image_aacd19.png). Click "__Go to Dashboard__" to proceed.

__Step 4: Transaction, Offline Mode & Data Sync (The Core USP)__
This section allows judges to experience the Edge AI logic and the Offline-First architecture of Veri, ensuring supply chain integrity even in remote "dead zones."
__4a. Establishing the Handshake (QR Verification)__
1. In the Dealer Dashboard, click "Scan Farmer QR".
2. Interaction: Click the "Upload Photo of QR" button 
3. Test Asset: Upload the QR Code image previously generated/downloaded from the Farmer Module.
4. Result: The system instantly establishes a secure handshake, retrieving the farmer's plot data and remaining monthly quota.

__4b. Offline Mode Simulation (Field Test)__
1. __Go Offline__: Click the "Online" toggle at the top right of the screen to switch the app to "Offline Mode".
2. __Conduct Transaction__:
- Select Mode A (Plantation) or Mode B (Ramp Delivery) 
- Input Harvest Weight.
- Test Case (Laundering Lock): Input a weight that exceeds the "Remaining Monthly Quota" shown on the screen.
- Expected Result: The system triggers a red "QUOTA EXCEEDED!" warning (image_aa643b.png). A mandatory "Reason for Audit" must be filled to proceed.
1. __Capture Evidence__: Use the camera to capture the FFB batch. If Mode B is selected, a Farmer Declaration (Digital Signature) is required.
Local Storage: Click "Upload & Save". Since the app is offline, the record is stored in a tamper-resistant local queue.
__4c. Pending Sync & Cloud Push__
1. __Check Queue__: Return to the Dealer Dashboard. You will see the "Pending Sync Queue" count has increased (e.g., "12" pending records as seen in image_aa6098.png).
2. __Re-establish Connection__: Click the toggle at the top right to switch back to "Online".
3. __Run Sync__: Click the "__Run Sync__" button in the Pending Sync Queue card.
4. __Final Result__: The system pushes local records to the cloud server for final audit. The "Recent Verifications" list will automatically update with the new synchronized records, completing the traceability loop.

__Step 5: Consolidated DDS & Manifest (Supply Chain Aggregation)__
This final step demonstrates how Veri prepares bulk shipments for mills while maintaining strict compliance integrity.
1. __Select Batch__: In the Dealer Dashboard, scroll down to the "Recent Verifications" list.
2. __Multi-Select__: Click the checkboxes next to "Safe" farmers (e.g., Ahmad bin Ismail, Siti Aminah).
3. __Test Case (Integrity Guard)__: Try to select a "FLAGGED" record (e.g., M. Rajan or Zulkifli Ali).
- __Expected Result__: The checkbox is disabled or the system prevents selection. Only "SAFE" status records can be consolidated into a manifest, ensuring no illegal fruit enters the bulk supply chain.
4. __Create Manifest__: Once compliant records are selected, look at the "Lorry Manifest" button in the Hub (image_a9f7d9.png). It shows a notification badge for the number of selected items.
5. __Review Manifest__: Click the button to see the Consolidated Manifest preview (image_a9f7bc.png). This summaries the total load (e.g., 4.25 MT) and the contributing farmers.
6. __Export DDS__: Click "View Consolidated DDS".
- __Final Output__: The system generates a professional Batch Manifest Certificate (image_a9f79b.png).
- __Evidence__: This report features a "Negligible Risk" audit result, a unique Manifest ID, and a Consolidated Traceability Matrix that lists every verified source plot, ready for EU regulatory submission.

**Built for Borneo Hackathon 2026** 🌴