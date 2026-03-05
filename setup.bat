@echo off
echo Installing dependencies for Veri EUDR Demo...
echo.

echo [1/3] Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

echo.
echo [2/3] Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo.
echo [3/3] Setup complete!
echo.
echo IMPORTANT: Make sure you have installed:
echo - Python 3.8+
echo - Node.js 18+
echo - Tesseract OCR
echo.
echo To start the app:
echo   Backend: cd src\backend ^& python main.py
echo   Frontend: npm run dev
echo.
pause
