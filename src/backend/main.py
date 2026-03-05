from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.responses import FileResponse
from fpdf import FPDF
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Literal, Optional
import sys
import os
import base64
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from logic import process_farmer_registration, check_security_filters, generate_compliance_report, generate_farmer_qr_logic, get_farmer_status_logic, verify_spatial_compliance, process_dealer_registration, add_plot_to_farmer, generate_consolidated_report, extract_land_title_data, extract_ic_data, extract_permit_data, save_transaction, request_transaction_audit, sync_transactions
import time

app = FastAPI()

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. 坐标点模型
class LatLng(BaseModel):
    lat: float
    lng: float

# 2. 准证模型
class PermitSchema(BaseModel):
    type: Literal['MPOB', 'MCB', 'LGM', 'OTHER']
    number: Optional[str] = None

# 3. 地块模型
class PlotSchema(BaseModel):
    id: str
    cropType: str
    plantingYear: int
    alias: str
    landArea: float
    landTitleUrl: Optional[str] = None
    boundary: List[LatLng]

# 4. 农民数据模型 (更新对应 types.ts)
class FarmerSchema(BaseModel):
    name: str
    idNumber: str
    permits: List[PermitSchema]
    otherPermitName: Optional[str] = None
    permitPhotoUrl: Optional[str] = None
    plots: List[PlotSchema]

# 5. 经销商数据模型
class DealerSchema(BaseModel):
    representativeName: str
    mobile: str
    stationName: str
    licenseTypes: List[Literal['MPOB', 'MCB', 'LGM', 'OTHER']]
    otherLicenseName: Optional[str] = None
    licenseNumbers: dict = {}  # {MPOB: "xxx", MCB: "yyy"}
    licensePhotos: dict = {}   # {MPOB: "url1", MCB: "url2"}
    location: LatLng

# 6. 交易数据模型 (更新对应 types.ts)
class TransactionSchema(BaseModel):
    id: str
    farmerId: str
    farmerName: str
    weight: float
    location: LatLng
    mode: Literal['Plantation', 'Ramp']  # Dealer端的Mode
    ffbBatchUrl: Optional[str] = None
    farmerSignatureUrl: Optional[str] = None
    status: str
    risk: Optional[str] = 'Safe'
    cropType: Optional[str] = None

class UserProfile(BaseModel):
    id: str
    name: str
    role: Literal['farmer', 'collector']


class AuditRequestSchema(BaseModel):
    transactionId: str
    requestedBy: Optional[str] = 'dealer'

@app.get("/user/{user_id}")
async def get_user(user_id: str):
    # 调用 logic 里的函数去查数据
    profile = get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return profile


@app.post("/farmer/register")
async def register_farmer(data: FarmerSchema):
    """
    接收前端 FarmerData，进行逻辑处理并返回结果
    """
    # 调用 logic 层的处理函数
    result = process_farmer_registration(data.model_dump())
    
    if result["success"]:
        return {
            "status": "success",
            "message": "Registration successed",
            "quota_mt": result["quota"],
            "is_eudr_safe": result["eudr_safe"]
        }
    else:
        raise HTTPException(status_code=500, detail="Registration failed")

# main.py

@app.post("/transaction/verify")
async def verify_transaction(tx: TransactionSchema):
    tx_dict = tx.model_dump()
    
    # 1. 先进行安全核验
    security_check = check_security_filters(tx_dict)
    
    if security_check["allowed"]:
        # --- 重点：在这里调用生成报告 ---
        # 我们给报告取个名字，比如使用交易 ID (假设前端传了 id，没有就用时间戳)
        tx_id = tx_dict.get("id", f"TX_{int(time.time())}")
        
        # 调用 logic.py 里的函数
        report_file = generate_compliance_report(tx_dict, security_check)
        
        return {
            "status": "success",
            "message": "Transaction verified",
            "report_url": f"/transaction/report/{tx_id}", # 告诉前端下载地址
            "remaining": security_check.get("remaining_quota")
        }
    else:
        return {"status": "flagged", "reason": security_check["reason"]}        

from fastapi.responses import FileResponse
import os

@app.get("/transaction/report/{tx_id}")
async def get_report(tx_id: str):
    """
    华文解释：这是专门用来下载 PDF 的接口。
    它会根据你输入的 ID，去文件夹里找对应的文件并传给浏览器。
    """
    # 构造文件名
    file_path = f"report_{tx_id}.pdf"
    
    # 检查这个文件是不是真的存在
    if os.path.exists(file_path):
        return FileResponse(
            path=file_path, 
            filename=file_path, 
            media_type='application/pdf'
        )
    else:
        # 如果找不到文件，返回 404 错误
        raise HTTPException(status_code=404, detail="Report file not found. Please verify transaction first.")

@app.get("/farmer/qr/{farmer_id}")
async def get_farmer_qr(farmer_id: str):
    """
    前端行为：点击 Generate ID 按钮
    """
    # 1. 理论上这里应该先检查 Firebase 里有没有这个农民 (第一阶段逻辑)
    # 2. 调用逻辑层生成二维码
    try:
        qr_code_base64 = generate_farmer_qr_logic(farmer_id)
        return {
            "status": "success",
            "farmer_id": farmer_id,
            "qr_code": qr_code_base64
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# [对应第三阶段 Dashboard] 扫码获取农民信息
@app.get("/verify/farmer/{id}")
async def verify_farmer_id(id: str):
    status = get_farmer_status_logic(id)
    if not status:
        raise HTTPException(status_code=404, detail="Farmer not recognized.")
    return status

# [对应第三阶段 Mode Toggle] 检查地理围栏
@app.post("/verify/gps")
async def verify_gps(farmer_id: str, lat: float, lng: float):
    # 1. 先拿农民的地块数据
    status = get_farmer_status_logic(farmer_id)
    if not status:
        raise HTTPException(status_code=404, detail="Farmer not found.")
    
    # 2. 进行地理核验
    geo_result = verify_spatial_compliance(lat, lng, status['boundary'])
    
    # ⚠️ 提醒第二阶段：如果返回 NEED_STAGE_2，说明需要去补齐地块坐标
    return geo_result

# --- 新增API ---

@app.post("/dealer/register")
async def register_dealer(data: DealerSchema):
    result = process_dealer_registration(data.model_dump())
    if result["success"]:
        return {"status": "success", "message": "Dealer registration successful"}
    else:
        raise HTTPException(status_code=500, detail="Dealer registration failed")

@app.post("/transaction/save")
async def save_transaction_endpoint(transaction: dict):
    """
    Save transaction data from dealer's TransactionFlow
    """
    result = save_transaction(transaction)
    if result["success"]:
        return {
            "status": "success", 
            "transaction_id": result["transaction_id"],
            "message": result["message"]
        }
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "Failed to save transaction"))


@app.post("/transaction/audit")
async def request_audit_endpoint(payload: AuditRequestSchema):
    result = request_transaction_audit(payload.transactionId, payload.requestedBy or 'dealer')
    if result["success"]:
        return {
            "status": "success",
            "transaction_id": result["transaction_id"],
            "audit_status": result["audit_status"],
        }
    raise HTTPException(status_code=500, detail=result.get("error", "Failed to request audit"))


@app.post("/transactions/sync")
async def sync_transactions_endpoint(payload: dict):
    result = sync_transactions(payload)
    if result["success"]:
        return {
            "status": "success",
            "synced_count": result["synced_count"],
            "failed_count": result["failed_count"],
            "message": result["message"],
            "synced_at": result["synced_at"],
        }
    raise HTTPException(status_code=500, detail=result.get("error", "Sync failed"))


@app.post("/transaction/sync")
async def sync_transactions_endpoint_compat(payload: dict):
    """Backward-compatible alias for clients using singular path."""
    return await sync_transactions_endpoint(payload)

@app.post("/farmer/{farmer_id}/plot")
async def add_plot(farmer_id: str, plot: PlotSchema):
    result = add_plot_to_farmer(farmer_id, plot.model_dump())
    if result["success"]:
        return {"status": "success", "new_quota": result["new_quota"]}
    else:
        raise HTTPException(status_code=404, detail=result.get("message", "Failed to add plot"))

@app.post("/lorry/manifest")
async def create_lorry_manifest(manifest: dict):  # 简化，实际应有schema
    # 假设manifest包含 id, lorryPlate, selectedTransactions, totalWeight
    report_file = generate_consolidated_report(manifest)
    return {"status": "success", "report_url": f"/lorry/report/{manifest['id']}"}

@app.get("/lorry/report/{manifest_id}")
async def get_consolidated_report(manifest_id: str):
    file_path = f"consolidated_report_{manifest_id}.pdf"
    if os.path.exists(file_path):
        return FileResponse(path=file_path, filename=file_path, media_type='application/pdf')
    else:
        raise HTTPException(status_code=404, detail="Consolidated report not found")

# --- 地契OCR提取端点 ---
@app.post("/extract/land-title")
async def extract_land_title(file: UploadFile = File(...)):
    """
    上传地契图像，使用Tesseract OCR提取Lot Number等关键数据
    """
    try:
        # 1. 读取上传的文件
        contents = await file.read()
        
        # 2. 转为Base64
        image_base64 = base64.b64encode(contents).decode('utf-8')
        
        # 3. 调用logic层的OCR提取
        extracted_data = extract_land_title_data(image_base64)
        
        # 4. 验证是否提取到关键数据
        if extracted_data.get('error'):
            return {
                "status": "error",
                "message": f"OCR failed: {extracted_data['error']}"
            }
        
        if not extracted_data.get('lot_number'):
            return {
                "status": "warning",
                "message": "Could not extract Lot Number. Please ensure the image is clear and contains land title information.",
                "data": extracted_data
            }
        
        # 5. 返回提取的结构化数据
        return {
            "status": "success",
            "data": {
                "lot_number": extracted_data.get('lot_number'),
                "mukim": extracted_data.get('mukim'),
                "district": extracted_data.get('district'),
                "state": extracted_data.get('state'),
                "land_area": extracted_data.get('land_area'),
                "owner_name": extracted_data.get('owner_name'),
                "center_lat": extracted_data.get('center_lat'),
                "center_lng": extracted_data.get('center_lng')
            }
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Server error: {str(e)}"
        }


@app.post("/extract/ic")
async def extract_ic(file: UploadFile = File(...)):
    """Extract IC name and ID number from uploaded document image."""
    try:
        contents = await file.read()
        image_base64 = base64.b64encode(contents).decode('utf-8')
        extracted = extract_ic_data(image_base64)
        if extracted.get('error'):
            return {"status": "error", "message": extracted['error']}
        if not extracted.get('name') and not extracted.get('idNumber'):
            return {"status": "warning", "message": "No IC fields detected", "data": extracted}
        return {"status": "success", "data": extracted}
    except Exception as e:
        return {"status": "error", "message": f"Server error: {str(e)}"}


@app.post("/extract/permit/{permit_type}")
async def extract_permit(permit_type: str, file: UploadFile = File(...)):
    """Extract permit number from uploaded permit image/PDF."""
    try:
        contents = await file.read()
        image_base64 = base64.b64encode(contents).decode('utf-8')
        extracted = extract_permit_data(image_base64, permit_type)
        if extracted.get('error'):
            return {"status": "error", "message": extracted['error']}
        if not extracted.get('permitNumber'):
            return {"status": "warning", "message": "Permit number not detected", "data": extracted}
        return {"status": "success", "data": extracted}
    except Exception as e:
        return {"status": "error", "message": f"Server error: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)