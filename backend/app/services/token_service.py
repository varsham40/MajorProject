import random
import string
from datetime import datetime, timedelta
from typing import Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.models.sharing import AccessToken
from backend.app.models.record import MedicalRecord

def generate_random_token_code() -> str:
    """Generates a secure 12-char formatted token code e.g. PAT-8F4K-92MX"""
    chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    p1 = "".join(random.choices(chars, k=4))
    p2 = "".join(random.choices(chars, k=4))
    return f"PAT-{p1}-{p2}"

async def validate_token_sharing_conditions(
    db: AsyncSession,
    token_code: str,
    patient_id: str,
    from_doctor_id: str,
    from_hospital_id: str,
    record_id: str
) -> Tuple[bool, str, AccessToken]:
    """
    Validates all 6 mandatory AND conditions required to share a patient record:
    1. Token exists
    2. Token belongs to selected patient
    3. Authorized hospital matches sending/requesting hospital
    4. Authorized doctor matches sending/requesting doctor
    5. Token has not expired (expires_at > now AND status == ACTIVE)
    6. Selected record belongs to selected patient
    """
    # 1. Query token
    stmt = select(AccessToken).where(AccessToken.token_code == token_code.strip())
    res = await db.execute(stmt)
    token = res.scalar_one_or_none()

    if not token:
        return False, "Access token does not exist.", None

    # 2. Token belongs to patient
    if str(token.patient_id) != str(patient_id):
        return False, "Access token does not belong to the selected patient.", None

    # 3. Authorized hospital matches
    if str(token.hospital_id) != str(from_hospital_id):
        return False, "Access token is not authorized for your hospital.", None

    # 4. Authorized doctor matches
    if str(token.doctor_id) != str(from_doctor_id):
        return False, "Access token is not authorized for your doctor account.", None

    # 5. Not expired
    if token.status != "ACTIVE":
        return False, f"Access token status is '{token.status}'.", None

    if token.expires_at < datetime.utcnow():
        token.status = "EXPIRED"
        await db.commit()
        return False, "Access token has expired.", None

    # 6. Selected record belongs to selected patient & matches token record scope if specific
    record_stmt = select(MedicalRecord).where(MedicalRecord.id == record_id)
    rec_res = await db.execute(record_stmt)
    record = rec_res.scalar_one_or_none()

    if not record:
        return False, "Selected medical record does not exist.", None

    if str(record.patient_id) != str(patient_id):
        return False, "Selected medical record does not belong to the selected patient.", None

    if token.record_id and str(token.record_id) != str(record_id):
        return False, "Access token is scoped to a specific analysis report, which does not match this record.", None

    return True, "Validation successful.", token
