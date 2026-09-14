from pydantic import BaseModel, ConfigDict
from typing import Optional

class DoctorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    hospital_id: Optional[str]
    name: str
    specialization: str
    doctor_code: str
