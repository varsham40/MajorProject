from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime

class PatientCreate(BaseModel):
    name: str
    dob: str
    gender: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    bmi: Optional[float] = None
    blood_pressure: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None
    existing_conditions: Optional[str] = None

class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    dob: date
    gender: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    patient_code: str
    created_at: datetime
