import random
import string
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.database import get_db
from backend.app.core.security import verify_password, get_password_hash, create_access_token
from backend.app.core.dependencies import get_current_user
from backend.app.models.user import User
from backend.app.models.healthcare import Patient, Doctor, Hospital, PatientHealthProfile
from backend.app.schemas.auth import UserCreate, UserLogin, TokenResponse, UserOut, ChangePasswordRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])

def rand_code(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.digits, k=4))}"

@router.post("/register", response_model=TokenResponse)
async def register_user(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    role = user_in.role.upper()
    if role not in ["PATIENT", "DOCTOR", "HOSPITAL", "ADMIN"]:
        raise HTTPException(status_code=400, detail="Invalid role specified.")

    clean_email = user_in.email.strip().lower()
    clean_password = user_in.password.strip()

    stmt = select(User).where(User.email.ilike(clean_email))
    existing_user = (await db.execute(stmt)).scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    new_user = User(
        email=clean_email,
        password_hash=get_password_hash(clean_password),
        role=role,
        is_active=True
    )
    db.add(new_user)
    await db.flush()

    entity_id = None
    full_name = user_in.name or user_in.email.split("@")[0].capitalize()

    if role == "PATIENT":
        p_code = rand_code("PAT")
        
        # Safely convert dob string to python datetime.date object for PostgreSQL compatibility
        dob_str = user_in.dob or "1990-01-01"
        try:
            parsed_dob = datetime.strptime(str(dob_str).split("T")[0], "%Y-%m-%d").date()
        except Exception:
            parsed_dob = date(1990, 1, 1)

        patient = Patient(
            user_id=new_user.id,
            name=full_name,
            dob=parsed_dob,
            gender=user_in.gender or "Male",
            phone=user_in.phone,
            email=user_in.email,
            address=user_in.address,
            patient_code=p_code
        )
        db.add(patient)
        await db.flush()
        entity_id = patient.id

        # Create health profile
        hp = PatientHealthProfile(
            patient_id=patient.id,
            height=170.0,
            weight=70.0,
            bmi=24.2,
            blood_pressure="120/80",
            medical_history="None",
            allergies="None",
            existing_conditions="None"
        )
        db.add(hp)

    elif role == "DOCTOR":
        d_code = rand_code("DOC")
        h_id = user_in.hospital_id if (user_in.hospital_id and user_in.hospital_id.strip()) else None
        if not h_id:
            first_hosp_id = (await db.execute(select(Hospital.id))).scalars().first()
            h_id = first_hosp_id
        doctor = Doctor(
            user_id=new_user.id,
            hospital_id=h_id,
            name=full_name,
            specialization=user_in.specialization or "General Physician",
            doctor_code=d_code
        )
        db.add(doctor)
        await db.flush()
        entity_id = doctor.id

    elif role == "HOSPITAL":
        h_code = rand_code("HOSP")
        hospital = Hospital(
            user_id=new_user.id,
            name=full_name,
            address=user_in.address or "Healthcare City Center",
            code=h_code
        )
        db.add(hospital)
        await db.flush()
        entity_id = hospital.id

    await db.commit()
    token = create_access_token(subject=new_user.id, role=new_user.role)
    return TokenResponse(
        access_token=token,
        role=new_user.role,
        user_id=new_user.id,
        email=new_user.email,
        entity_id=entity_id,
        must_change_password=getattr(new_user, "must_change_password", False)
    )

@router.post("/login", response_model=TokenResponse)
async def login_user(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    clean_email = credentials.email.strip().lower()
    clean_password = credentials.password.strip()

    stmt = select(User).where(User.email.ilike(clean_email))
    user = (await db.execute(stmt)).scalar_one_or_none()

    if not user or not verify_password(clean_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password.")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account disabled.")

    entity_id = None
    if user.role == "PATIENT":
        p = (await db.execute(select(Patient).where(Patient.user_id == user.id))).scalar_one_or_none()
        entity_id = p.id if p else None
    elif user.role == "DOCTOR":
        d = (await db.execute(select(Doctor).where(Doctor.user_id == user.id))).scalar_one_or_none()
        entity_id = d.id if d else None
    elif user.role == "HOSPITAL":
        h = (await db.execute(select(Hospital).where(Hospital.user_id == user.id))).scalar_one_or_none()
        entity_id = h.id if h else None

    token = create_access_token(subject=user.id, role=user.role)
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        email=user.email,
        entity_id=entity_id,
        must_change_password=getattr(user, "must_change_password", False)
    )

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/change-password")
async def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(req.current_password.strip(), current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password.")
    if len(req.new_password.strip()) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    current_user.password_hash = get_password_hash(req.new_password.strip())
    current_user.must_change_password = False
    await db.commit()
    return {"message": "Password changed successfully."}
