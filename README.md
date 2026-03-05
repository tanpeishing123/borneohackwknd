# Veri - EUDR Compliance System

Palm oil supply chain verification and traceability platform for EUDR compliance.

---

## 🚀 Quick Start

### Step 1: Install Prerequisites

1. **Python 3.8+**
   - Download: https://www.python.org/downloads/
   - ⚠️ **Important:** Check "Add Python to PATH" during installation

2. **Node.js 16+**
   - Download: https://nodejs.org/
   
3. **Tesseract OCR**
   - Download: https://github.com/UB-Mannheim/tesseract/wiki
   - ⚠️ Install to default path: `C:\Program Files\Tesseract-OCR`
   - **Restart your computer after installation**

### Step 2: Install Dependencies

Open terminal and navigate to project folder:

```bash
cd C:\Users\User\Documents\borneohackwknd
```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

Install Node.js dependencies:
```bash
npm install
```

### Step 3: Start the Application

**Open TWO terminal windows:**

#### Terminal 1 - Backend:
```bash
cd src/backend
python main.py
```

✅ Success when you see: `Uvicorn running on http://127.0.0.1:8002`

#### Terminal 2 - Frontend:
```bash
npm run dev
```

✅ Success when you see: `VITE ready in...`

### Step 4: Open the App

Visit in your browser: **http://localhost:3000**

---

## 📁 Project Structure

```
borneohackwknd/
├── src/
│   ├── backend/          # FastAPI server
│   │   ├── main.py       # API endpoints
│   │   ├── logic.py      # Business logic (SQLite)
│   │   └── veri_demo.db  # SQLite database (auto-created)
│   └── frontend/         # React frontend
│       └── App.tsx       # Main application component
├── requirements.txt      # Python dependencies
└── package.json          # Node.js dependencies
```

---

## 🔧 Troubleshooting

### ❌ ModuleNotFoundError

**Issue:** `ModuleNotFoundError: No module named 'pytesseract'`

**Solution:**
```bash
pip install -r requirements.txt
```

### ❌ TesseractNotFoundError

**Issue:** `TesseractNotFoundError`

**Solution:**
1. Verify Tesseract is installed at: `C:\Program Files\Tesseract-OCR`
2. Restart your computer
3. If still not working, manually add to PATH environment variable

### ❌ Port Already in Use

**Issue:** `Address already in use (port 8002 or 3000)`

**Solution:**
```bash
# Kill Python processes
taskkill /F /IM python.exe

# Kill Node processes
taskkill /F /IM node.exe
```

Then restart the application.

### ❌ Cannot Find Command

**Issue:** `python/npm command not found`

**Solution:**
1. Verify Python and Node.js are installed
2. Restart your computer
3. Open a new terminal window

---

## 🗄️ Database

The system uses **SQLite** database located at: `src/backend/veri_demo.db`

The database is automatically created on first run with the following tables:
- `farmers` - Farmer registration data
- `dealers` - Dealer information
- `transactions` - Transaction records
- `audit_requests` - Audit trail

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
- 📦 **Transaction Verification** - EUDR compliance checking
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

**Built for Borneo Hackathon 2026** 🌴