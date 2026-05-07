#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
生成演示 Land Title PDF - 包含标准地契字段供 OCR 提取
"""
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "demo_assets"
OUT_DIR.mkdir(exist_ok=True)

def create_land_title_pdf():
    """生成演示地契 PDF"""
    file_path = OUT_DIR / "demo_land_title.pdf"
    
    c = canvas.Canvas(str(file_path), pagesize=A4)
    width, height = A4
    
    x_margin = 20 * mm
    y = height - 20 * mm
    
    # 标题
    c.setFont("Helvetica-Bold", 16)
    c.drawString(x_margin, y, "LAND TITLE CERTIFICATE")
    
    y -= 8 * mm
    c.setFont("Helvetica", 9)
    c.drawString(x_margin, y, "Malaysian Land Registry - Demo Document")
    
    y -= 5 * mm
    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor((255, 0, 0))
    c.drawString(x_margin, y, "*** DEMO ONLY - FICTIONAL DATA FOR TESTING ***")
    c.setFillColor((0, 0, 0))
    
    y -= 8 * mm
    c.setLineWidth(1)
    c.line(x_margin, y, width - x_margin, y)
    
    # 表单字段
    y -= 12 * mm
    fields = [
        ("Lot Number", "BGI/27/112"),
        ("Lot Status", "Active Registration"),
        ("Mukim", "Bangi"),
        ("District", "Hulu Langat"),
        ("State", "Selangor"),
        ("Land Area", "5.5 Hectares"),
        ("Owner Name", "Ahmad Faizal Bin Rahman"),
        ("Registration Date", "15 January 2020"),
        ("Certificate Number", "SEL-2020-001234"),
        ("Land Use", "Agricultural (Palm Oil)"),
        ("GPS Coordinates", "2.9185°N 101.7854°E"),
        ("Adjacent Lot 1", "BGI/28/112 - Category A"),
        ("Adjacent Lot 2", "BGI/26/112 - Category A"),
        ("Encumbrances", "None Registered"),
    ]
    
    label_w = 50 * mm
    line_h = 8 * mm
    c.setFont("Helvetica", 10)
    
    for label, value in fields:
        # 标签（粗体）
        c.setFont("Helvetica-Bold", 9)
        c.drawString(x_margin, y, label + ":")
        
        # 值
        c.setFont("Helvetica", 9)
        c.drawString(x_margin + label_w, y, value)
        
        y -= line_h
    
    # 底部信息
    y -= 8 * mm
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(x_margin, y, f"Generated: {datetime.now().strftime('%d %b %Y %H:%M:%S')}")
    y -= 5 * mm
    c.drawString(x_margin, y, "This document is for demonstration and testing purposes only.")
    
    c.save()
    print(f"✓ Created demo Land Title PDF: {file_path}")
    return file_path

if __name__ == "__main__":
    create_land_title_pdf()
