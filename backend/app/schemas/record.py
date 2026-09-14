from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class FullRecordViewOut(BaseModel):
    record_id: str
    record_code: str
    created_at: datetime
    
    disease: str
    result: str
    confidence: float
    risk_level: str
    ai_analysis_text: str
    
    clinical_inputs: Dict[str, Any]
    shap_base_value: float
    shap_features: List[Dict[str, Any]]
    
    reports_used: List[Dict[str, Any]]
    
    patient_name: str
    patient_code: str
    doctor_name: str
    doctor_specialization: str
    hospital_name: str
    hospital_address: Optional[str]
    
    is_blockchain_registered: bool
    blockchain_details: Optional[Dict[str, Any]] = None
    source_info: Optional[str] = "Originating Hospital"

class AccessTokenCreate(BaseModel):
    hospital_id: str
    doctor_id: str
    record_id: Optional[str] = None
    expiry_hours: int = 24

class AccessTokenOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    token_code: str
    patient_id: str
    hospital_id: str
    hospital_name: Optional[str] = None
    doctor_id: str
    doctor_name: Optional[str] = None
    record_id: Optional[str] = None
    record_code: Optional[str] = None
    disease_name: Optional[str] = None
    expires_at: datetime
    status: str
    created_at: datetime

class RecordShareCreate(BaseModel):
    patient_id: str
    record_id: str
    token_code: str
    to_hospital_id: str
    to_doctor_id: str

class IntegrityVerifyRequest(BaseModel):
    record_id: str

class IntegrityVerifyOut(BaseModel):
    record_id: str
    record_code: str
    current_hash: str
    blockchain_hash: str
    result: str  # MATCH / MISMATCH
    verified_at: datetime
    message: str

class TokenRedeemRequest(BaseModel):
    token_code: str
