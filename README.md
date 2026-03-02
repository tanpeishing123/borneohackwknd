<div align="center">
  <img src="https://via.placeholder.com/800x200?text=Akar-Bukti+2.0+Compliance+Tracker" alt="Banner" style="width: 80%; max-width: 100%; height: auto; border-radius: 10px;"/>
</div>

<details open>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#project-overview">Project Overview</a></li>
    <li><a href="#features">Features</a></li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#running">Running</a></li>
      </ul>
    </li>
    <li><a href="#demo-and-resources">Demo and Resources</a></li>
    <li><a href="#special-thanks">Special Thanks</a></li>
    <li><a href="#disclaimer">Disclaimer</a></li>
  </ol>
</details>

---

## 🔎 Project Overview

**Akar-Bukti 2.0** is a prototype system for agricultural compliance verification based on artificial intelligence and Geographic Information Systems (GIS), designed specifically for the Malaysian palm oil industry to help it comply with EU regulations, particularly the access requirements of **EUDR (EU Regulation 2023/1115)**.  This project aims to bridge the digital divide for smallholder farmers and ensure that every batch of palm fruit can be traced from the land to the export end.

### 🏆 Competition Track
**Borneo Hackathon** - ESG & Digital Transformation Track.

### 💡 Problem Statement
With the implementation of the EUDR, palm oil exported to the EU must prove it has "zero deforestation" and "complies with the laws of the producing country." However, in reality:
- **No signal in forest areas**：Remote orchards lack network coverage, causing traditional cloud-based tracking to fail.
- **Traceability chain broken**：Paper-based MSPO certificates are disconnected from the logistics process, making “order washing” possible.
- **Complex logistics**：The transaction locations are not fixed (orchard vs weighing station), making GPS coordinates difficult to match accurately.

### 🎯 Objectives
- **Automated legal compliance**：Link with MSPO to instantly verify land legality.
- **End-to-end traceability**：Use a “scan-and-handshake” protocol to accommodate multiple transaction scenarios, including orchards and weighing stations (Ramp).
- **Fraud prevention monitoring**：Implement Edge AI for offline evidence storage and yield prediction models to block the entry of illegal fruits.
---

## 📝 Features

1. **MSPO Legal Compliance Integration (Legality Check)**:
   - Automatically extract MSPO certificate data to ensure the production process complies with Malaysian land, labor, and tax laws.

2. **GIS Boundary and Area Verification**:
   - Integrate APIs to verify farmland polygon boundaries, compare with land titles, and block fraudulent land claims.

3. **Dual-Mode “Scan-and-Handshake” (The Handshake)**:
   - **Mode A (Orchard Acquisition)**：Enforce geofencing for location verification.
   - **Mode B (Weighing Station Delivery)**：Use AI-based visual verification and traceability trust chain to complete remote authentication.

4. **Edge AI Offline Evidence Lock**:
   - Supports offline capture in no-signal environments, GPS anti-spoofing, and tamper-proof timestamp recording.

5. **Dynamic Yield Interception System**:
   - Calculate monthly yield limits based on plot area; triggers interception if cumulative sales are abnormal to eliminate laundering loopholes.

6. **One-Click Standard DDS Report Generation**:
   - Automatically generates EU-compliant PDF Due Diligence Statements and delivery manifests.
---

## 🚀 Getting Started

> [!NOTE]  
> It is recommended to use **Python 3.11** or later for development in Visual Studio Code.

### Installation
1. Clone repository：
   ```bash
   git clone []
   ```
2. Create and activate a virtual environment：
    ```
    python -m venv venv
    .\venv\Scripts\activate
    ```
3. Install dependencies：
    ```
    pip install -r requirements.txt
    ```

### Running
4. Running the app
    ```
    streamlit run app.py
    ```
### Demo and Resources
### Demo Video:[]  
### Slides: []
### Project prototype link: []


---
## 👤Special Thanks
Hi, We are from Team Dust 404.  
We would like to extend our gratitude to:

- Our team members for commiting and collaborating throughout the project.
   - []
   - []
   - []
   - []

---
## 📌Disclaimer  
> [!Important]
> The data verification and production forecasts provided in this project are for the purpose of demonstrating a technical prototype only and do not represent final legal advice or actual EU certification conclusions.

<div align="center">
  <strong>Made by Dust 404</strong>
  <br>
  <strong><em>© 2026 Dust 404 project<em>
</div>