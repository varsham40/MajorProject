from pydantic import BaseModel, ConfigDict
from typing import Optional

class HospitalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    address: Optional[str]
    code: str
