from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import date, datetime

class DynamicFeatureSpec(BaseModel):
    name: str
    label: str
    type: str  # float, int, string
    unit: Optional[str] = None
    min: Optional[float] = None
    max: Optional[float] = None
    options: Optional[List[str]] = None

class DiseaseModelSpecOut(BaseModel):
    disease_key: str
    disease_name: str
    algorithm: str
    version: str
    accuracy: float
    features: List[DynamicFeatureSpec]

class PredictionCreate(BaseModel):
    patient_id: str
    disease_key: str
    inputs: Dict[str, Any]
    report_ids: Optional[List[str]] = []
    appointment_id: Optional[str] = None
    appointment_code: Optional[str] = None

class SHAPFeatureOut(BaseModel):
    feature_name: str
    patient_value: str
    shap_value: float
    effect: str

class SHAPExplanationOut(BaseModel):
    base_value: float
    features: List[SHAPFeatureOut]

class PredictionOut(BaseModel):
    prediction_id: str
    record_id: Optional[str] = None
    record_code: Optional[str] = None
    disease: str
    result: str
    confidence: float
    risk_level: str
    ai_analysis_text: str
    shap_explanation: SHAPExplanationOut
    inputs: Dict[str, Any]
    created_at: datetime
