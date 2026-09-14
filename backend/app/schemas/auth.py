from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str  # PATIENT, DOCTOR, HOSPITAL, ADMIN
    name: Optional[str] = None
    hospital_id: Optional[str] = None
    specialization: Optional[str] = "General Physician"
    dob: Optional[str] = "1990-01-01"
    gender: Optional[str] = "Male"
    phone: Optional[str] = None
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    email: str
    entity_id: Optional[str] = None
    must_change_password: Optional[bool] = False

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    role: str
    is_active: bool
    must_change_password: Optional[bool] = False


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
