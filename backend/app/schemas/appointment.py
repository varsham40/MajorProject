from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AppointmentCreate(BaseModel):
    hospital_id: Optional[str] = None
    doctor_id: str
    appointment_date: str
    appointment_time: Optional[str] = "10:00 AM"
    target_disease: Optional[str] = "General Consultation"
    reason: Optional[str] = None
    notes: Optional[str] = None

class AppointmentOut(BaseModel):
    id: str
    appointment_code: str
    patient_id: str
    patient_name: Optional[str] = None
    patient_code: Optional[str] = None
    hospital_id: str
    hospital_name: Optional[str] = None
    doctor_id: str
    doctor_name: Optional[str] = None
    doctor_specialization: Optional[str] = None
    appointment_date: str
    appointment_time: Optional[str] = "10:00 AM"
    target_disease: Optional[str] = None
    reason: Optional[str] = None
    status: str
    notes: Optional[str] = None
    record_id: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True
