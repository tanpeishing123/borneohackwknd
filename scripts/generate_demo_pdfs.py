from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "demo_assets"


def draw_document(file_path: Path, title: str, subtitle: str, fields: list[tuple[str, str]], footer_note: str) -> None:
    c = canvas.Canvas(str(file_path), pagesize=A4)
    width, height = A4

    x_margin = 20 * mm
    y = height - 25 * mm

    c.setFont("Helvetica-Bold", 18)
    c.drawString(x_margin, y, title)

    y -= 8 * mm
    c.setFont("Helvetica", 10)
    c.drawString(x_margin, y, subtitle)

    y -= 6 * mm
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x_margin, y, "DEMO ONLY - FICTIONAL DATA FOR TESTING")

    y -= 10 * mm
    c.setLineWidth(0.7)
    c.line(x_margin, y, width - x_margin, y)

    y -= 10 * mm
    label_w = 58 * mm
    line_h = 9 * mm

    c.setFont("Helvetica", 10)
    for label, value in fields:
        if y < 25 * mm:
            c.showPage()
            y = height - 25 * mm
            c.setFont("Helvetica", 10)

        c.setFont("Helvetica-Bold", 10)
        c.drawString(x_margin, y, f"{label}")

        c.setFont("Helvetica", 10)
        c.drawString(x_margin + label_w, y, value)
        y -= line_h

    y -= 4 * mm
    c.setLineWidth(0.5)
    c.line(x_margin, y, width - x_margin, y)

    y -= 8 * mm
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(x_margin, y, footer_note)

    c.save()


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    documents: list[dict] = [
        {
            "filename": "farmer_ic_demo.pdf",
            "title": "Malaysia Identity Card (IC) - Farmer Demo",
            "subtitle": "National Registration Department (JPN)",
            "fields": [
                ("Full Name", "Ahmad Faizal bin Rahman"),
                ("IC Number", "820101-01-5543"),
                ("Date of Birth", "1982-01-01"),
                ("Gender", "Male"),
                ("Nationality", "Malaysian"),
                ("Address", "Lot 27, Kampung Sungai Tekam, Jerantut, Pahang"),
                ("Issue Date", "2018-05-14"),
                ("Card Status", "Valid"),
            ],
            "footer": "For OCR and registration flow testing in Veri only.",
        },
        {
            "filename": "farmer_mpob_license_demo.pdf",
            "title": "MPOB Smallholder License - Farmer Demo",
            "subtitle": "Malaysian Palm Oil Board (MPOB)",
            "fields": [
                ("License Type", "MPOB - Palm Oil Smallholder"),
                ("License Number", "MPOB-PLH-2026-004581"),
                ("License Holder", "Ahmad Faizal bin Rahman"),
                ("IC Number", "820101-01-5543"),
                ("Farm/Plot Alias", "Kebun Sawit Sungai Tekam"),
                ("District / State", "Jerantut / Pahang"),
                ("Crop", "Palm Oil"),
                ("Land Area", "2.50 hectares"),
                ("Issue Date", "2025-09-20"),
                ("Expiry Date", "2027-09-19"),
                ("Status", "Active"),
            ],
            "footer": "Sample permit document aligned with permit upload and number extraction fields.",
        },
        {
            "filename": "farmer_lgm_license_demo.pdf",
            "title": "LGM Rubber Permit - Farmer Demo",
            "subtitle": "Lembaga Getah Malaysia (LGM)",
            "fields": [
                ("Permit Type", "LGM - Rubber Smallholder Registration"),
                ("Permit Number", "LGM-RB-2026-009312"),
                ("Permit Holder", "Ahmad Faizal bin Rahman"),
                ("IC Number", "820101-01-5543"),
                ("Smallholding Location", "Mukim Pulau Tawar, Jerantut"),
                ("District / State", "Jerantut / Pahang"),
                ("Crop", "Rubber"),
                ("Registered Area", "1.80 hectares"),
                ("Issue Date", "2025-10-03"),
                ("Expiry Date", "2027-10-02"),
                ("Status", "Active"),
            ],
            "footer": "Sample permit document for demo upload and OCR scenarios.",
        },
        {
            "filename": "farmer_mcb_license_demo.pdf",
            "title": "MCB Cocoa Permit - Farmer Demo",
            "subtitle": "Malaysian Cocoa Board (MCB)",
            "fields": [
                ("Permit Type", "MCB - Cocoa Smallholder Registration"),
                ("Permit Number", "MCB-COCOA-2026-003198"),
                ("Permit Holder", "Ahmad Faizal bin Rahman"),
                ("IC Number", "820101-01-5543"),
                ("Farm/Plot Alias", "Kebun Koko Tekam"),
                ("District / State", "Jerantut / Pahang"),
                ("Crop", "Cocoa"),
                ("Registered Area", "1.20 hectares"),
                ("Issue Date", "2025-10-15"),
                ("Expiry Date", "2027-10-14"),
                ("Status", "Active"),
            ],
            "footer": "Sample MCB permit for farmer-side upload and number extraction tests.",
        },
        {
            "filename": "farmer_land_title_demo.pdf",
            "title": "Land Title (Geran Tanah) - Farmer Demo",
            "subtitle": "Pejabat Tanah dan Galian Negeri Selangor",
            "fields": [
                ("Lot No", "LOT BGI-27/112"),
                ("Plot Alias", "Bangi Palm Demonstration Plot"),
                ("Mukim", "Bangi"),
                ("District", "Hulu Langat"),
                ("State", "Selangor"),
                ("Owner Name", "Ahmad Faizal bin Rahman"),
                ("IC Number", "820101-01-5543"),
                ("Area", "5.50 HA"),
                ("Latitude", "2.9185"),
                ("Longitude", "101.7854"),
                ("Title Reference", "GERAN MUKIM PTG-BGI-2026-9911"),
            ],
            "footer": "Coordinates align with Bangi safe baseline demo scenario for pitch flow.",
        },
    ]

    dealer_common = {
        "representative": "Suresh Kumar a/l Muniandy",
        "mobile": "+60 12-684 2291",
        "station": "Jerantut Agro Collection Ramp",
        "location": "Jerantut, Pahang",
        "entity": "Jerantut Agro Trading Sdn. Bhd.",
    }

    dealer_docs = [
        ("MPOB", "MPOB-DLR-2026-002151", "MPOB Dealer License"),
        ("LGM", "LGM-DLR-2026-000819", "LGM Dealer Authorization"),
        ("MCB", "MCB-COCOA-2026-000472", "MCB Cocoa Trading License"),
        ("MPOB-MILL", "MPOB-MILL-2026-001203", "MPOB Mill Operation License"),
        ("MPOB-RAMP", "MPOB-RAMP-2026-003744", "MPOB Ramp License"),
        ("MSPO", "MSPO-CERT-2026-01887", "MSPO Certificate"),
        ("RSPO", "RSPO-SCC-2026-04411", "RSPO Supply Chain Certificate"),
        ("SSM", "SSM-1376542-H", "SSM Business Registration"),
        ("KPKT", "KPKT-LA-2026-0093", "KPKT Local Council Permit"),
        ("DOE", "DOE-EIA-2026-0874", "DOE Environmental Approval"),
        ("SCCS", "SCCS-2026-11209", "SCCS Compliance Certificate"),
        ("ISCC", "ISCC-EU-2026-50177", "ISCC EU Certificate"),
    ]

    for code, number, doc_name in dealer_docs:
        documents.append(
            {
                "filename": f"dealer_{code.lower()}_demo.pdf",
                "title": f"{doc_name} - Dealer Demo",
                "subtitle": "Collection Station Compliance Document",
                "fields": [
                    ("Document Type", doc_name),
                    ("License/Certificate Number", number),
                    ("Registered Entity", dealer_common["entity"]),
                    ("Representative Name", dealer_common["representative"]),
                    ("Mobile", dealer_common["mobile"]),
                    ("Station/Ramp Name", dealer_common["station"]),
                    ("Operating Location", dealer_common["location"]),
                    ("Issue Date", "2025-11-15"),
                    ("Expiry Date", "2027-11-14"),
                    ("Status", "Active"),
                ],
                "footer": "Sample dealer document for front-end license upload and number capture tests.",
            }
        )

    for doc in documents:
        draw_document(
            file_path=OUT_DIR / doc["filename"],
            title=doc["title"],
            subtitle=doc["subtitle"],
            fields=doc["fields"],
            footer_note=doc["footer"],
        )


if __name__ == "__main__":
    main()
