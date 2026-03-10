# Veri - EUDR Compliance System

Palm oil supply chain verification and traceability platform for EUDR compliance.

## Prerequisites

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
- 🌴 **Supply Chain Traceability** - Full palm oil supply chain tracking
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

**Built for Borneo Hackathon 2026** 🌴