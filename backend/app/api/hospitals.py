from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_, func, and_
from typing import List, Optional

from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user, require_roles
from backend.app.models.user import User
from backend.app.models.healthcare import Hospital, Doctor, Patient, Appointment
from backend.app.models.record import MedicalRecord
from backend.app.models.ml import Prediction
from backend.app.models.sharing import AccessToken, RecordShare
from datetime import datetime, timedelta, timezone

def format_ist(dt):
    if not dt:
        return "N/A"
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
        except Exception:
            return dt
    if hasattr(dt, 'tzinfo') and dt.tzinfo is not None:
        ist_dt = dt.astimezone(timezone(timedelta(hours=5, minutes=30)))
    else:
        ist_dt = dt + timedelta(hours=5, minutes=30)
    return ist_dt.strftime("%d %b %Y, %I:%M:%S %p IST")


router = APIRouter(prefix="/hospitals", tags=["Hospital Management"])

async def get_hospital_entity(user: User, db: AsyncSession) -> Hospital:
    stmt = select(Hospital).where(Hospital.user_id == user.id)
    res = await db.execute(stmt)
    hosp = res.scalar_one_or_none()
    if not hosp:
        raise HTTPException(status_code=404, detail="Hospital profile not found for current user.")
    return hosp

@router.get("/me")
async def get_hospital_profile(
    current_user: User = Depends(require_roles(["HOSPITAL"])),
    db: AsyncSession = Depends(get_db)
):
    hosp = await get_hospital_entity(current_user, db)
    return {
        "id": hosp.id,
        "name": hosp.name,
        "email": current_user.email,
        "license_number": hosp.license_number,
        "address": hosp.address,
        "phone": hosp.phone
    }

@router.get("/overview")
@router.get("/dashboard-stats")
async def get_hospital_dashboard_overview(
    current_user: User = Depends(require_roles(["HOSPITAL", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    hosp = await get_hospital_entity(current_user, db) if current_user.role == "HOSPITAL" else None

    doc_ids_stmt = select(Doctor.id).where(Doctor.hospital_id == hosp.id) if hosp else select(Doctor.id)
    doc_ids = set((await db.execute(doc_ids_stmt)).scalars().all())

    # 1. Total Doctors
    docs_stmt = select(func.count(Doctor.id)).where(Doctor.hospital_id == hosp.id) if hosp else select(func.count(Doctor.id))
    total_doctors = (await db.execute(docs_stmt)).scalar() or 0

    # 2. Total Medical Records
    recs_stmt = select(MedicalRecord, Prediction).outerjoin(Prediction, MedicalRecord.prediction_id == Prediction.id)
    if hosp:
        recs_stmt = recs_stmt.where(
            or_(
                MedicalRecord.hospital_id == hosp.id,
                MedicalRecord.doctor_id.in_(doc_ids) if doc_ids else False
            )
        )
    records_res = (await db.execute(recs_stmt)).all()
    total_records = len(records_res)

    # Calculate Disease Distribution & Risk Level Distribution
    disease_counts = {}
    high_risk_cnt = 0
    med_risk_cnt = 0
    low_risk_cnt = 0

    for rec, pred in records_res:
        if pred:
            d_name = pred.disease or "Health Analysis"
            disease_counts[d_name] = disease_counts.get(d_name, 0) + 1

            r_level = (pred.risk_level or "Low").upper()
            if "HIGH" in r_level:
                high_risk_cnt += 1
            elif "MEDIUM" in r_level or "MODERATE" in r_level:
                med_risk_cnt += 1
            else:
                low_risk_cnt += 1

    # 3. Consented Patient Access Tokens
    auth_stmt = select(func.count(AccessToken.id))
    if hosp:
        auth_stmt = auth_stmt.where(
            or_(
                AccessToken.hospital_id == hosp.id,
                AccessToken.doctor_id.in_(doc_ids) if doc_ids else False
            )
        )
    total_authorized = (await db.execute(auth_stmt)).scalar() or 0

    # 4. Outward Patient Grants
    outward_stmt = select(func.count(AccessToken.id)).join(MedicalRecord, AccessToken.record_id == MedicalRecord.id)
    if hosp:
        outward_stmt = outward_stmt.where(
            and_(
                MedicalRecord.hospital_id == hosp.id,
                or_(
                    AccessToken.hospital_id != hosp.id,
                    AccessToken.doctor_id.not_in(doc_ids) if doc_ids else True
                )
            )
        )
    total_outward_grants = (await db.execute(outward_stmt)).scalar() or 0

    # 5. Appointments Summary
    apt_stmt = select(Appointment)
    if hosp:
        apt_stmt = apt_stmt.where(
            or_(
                Appointment.hospital_id == hosp.id,
                Appointment.doctor_id.in_(doc_ids) if doc_ids else False
            )
        )
    apts = (await db.execute(apt_stmt)).scalars().all()
    scheduled_apts = sum(1 for a in apts if a.status == "SCHEDULED")
    accepted_apts = sum(1 for a in apts if a.status == "ACCEPTED")
    completed_apts = sum(1 for a in apts if a.status == "COMPLETED")
    rejected_apts = sum(1 for a in apts if a.status == "REJECTED")

    # 6. Top Doctors Performance Leaderboard
    doc_leaderboard_stmt = (
        select(Doctor, User)
        .outerjoin(User, Doctor.user_id == User.id)
    )
    if hosp:
        doc_leaderboard_stmt = doc_leaderboard_stmt.where(Doctor.hospital_id == hosp.id)
    doc_res = (await db.execute(doc_leaderboard_stmt)).all()

    top_doctors = []
    for d, u in doc_res:
        d_rec_cnt = sum(1 for r, p in records_res if r.doctor_id == d.id)
        d_apt_cnt = sum(1 for a in apts if a.doctor_id == d.id and a.status == "COMPLETED")
        top_doctors.append({
            "id": d.id,
            "name": d.name,
            "specialization": d.specialization or "General Physician",
            "department": d.department or "General Medicine",
            "license_number": d.license_number or "N/A",
            "records_count": d_rec_cnt,
            "completed_appointments": d_apt_cnt
        })
    top_doctors.sort(key=lambda x: (x["records_count"], x["completed_appointments"]), reverse=True)

    # 7. Recent Activity Feed
    recent_recs = sorted(records_res, key=lambda x: x[0].created_at, reverse=True)[:5]
    recent_activities = []
    for rec, pred in recent_recs:
        recent_activities.append({
            "id": rec.id,
            "title": f"Diagnostic Record {rec.record_code} Created",
            "disease": pred.disease if pred else "Health Diagnostic",
            "result": pred.result if pred else "Processed",
            "timestamp": format_ist(rec.created_at)
        })

    return {
        "hospital_name": hosp.name if hosp else "Main Hospital Facility",
        "code": hosp.code if hosp else "HOSP-MAIN",
        "license_number": getattr(hosp, "license_number", "LIC-HOSP-9900") if hosp else "LIC-MAIN",
        "address": hosp.address if hosp else "Healthcare Center",
        "kpis": {
            "total_doctors": total_doctors,
            "total_records": total_records,
            "authorized_records": total_authorized,
            "shared_records": total_outward_grants,
            "verification_score": "100% Immutable Verified",
            "total_appointments": len(apts)
        },
        "disease_distribution": disease_counts,
        "appointment_metrics": {
            "scheduled": scheduled_apts,
            "accepted": accepted_apts,
            "completed": completed_apts,
            "rejected": rejected_apts
        },
        "risk_distribution": {
            "high_risk": high_risk_cnt,
            "medium_risk": med_risk_cnt,
            "low_risk": low_risk_cnt
        },
        "top_doctors": top_doctors[:5],
        "recent_activities": recent_activities
    }

@router.get("/records/created")
async def get_hospital_created_records(
    current_user: User = Depends(require_roles(["HOSPITAL", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    hosp = await get_hospital_entity(current_user, db) if current_user.role == "HOSPITAL" else None

    doc_ids_stmt = select(Doctor.id).where(Doctor.hospital_id == hosp.id) if hosp else select(Doctor.id)
    doc_ids = set((await db.execute(doc_ids_stmt)).scalars().all())

    stmt = (
        select(MedicalRecord, Prediction, Patient, Doctor)
        .outerjoin(Prediction, MedicalRecord.prediction_id == Prediction.id)
        .outerjoin(Patient, MedicalRecord.patient_id == Patient.id)
        .outerjoin(Doctor, MedicalRecord.doctor_id == Doctor.id)
    )
    if hosp:
        stmt = stmt.where(
            or_(
                MedicalRecord.hospital_id == hosp.id,
                MedicalRecord.doctor_id.in_(doc_ids) if doc_ids else False
            )
        )

    stmt = stmt.order_by(desc(MedicalRecord.created_at))
    res = await db.execute(stmt)

    created_list = []
    seen = set()
    for rec, pred, pat, doc in res.all():
        if rec.id in seen:
            continue
        seen.add(rec.id)

        created_list.append({
            "id": rec.id,
            "record_id": rec.id,
            "record_code": rec.record_code,
            "patient_name": pat.name if pat else "Unknown Patient",
            "patient_id": pat.id if pat else "",
            "patient_code": pat.patient_code if pat else "PAT-0000",
            "disease": pred.disease if pred else "Health Diagnostic",
            "result": pred.result if pred else "Pending",
            "confidence": pred.confidence if pred else 0.0,
            "risk_level": pred.risk_level if pred else "Low",
            "doctor_name": doc.name if doc else "Hospital Specialist",
            "hospital_name": hosp.name if hosp else "Hospital Facility",
            "created_at": format_ist(rec.created_at),
            "status": "Hospital Medical Record"
        })

    return created_list

@router.get("/records/authorized")
@router.get("/records/consented-inward")
@router.get("/records/received")
async def get_hospital_authorized_records(
    current_user: User = Depends(require_roles(["HOSPITAL", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    hosp = await get_hospital_entity(current_user, db) if current_user.role == "HOSPITAL" else None

    doc_ids_stmt = select(Doctor.id).where(Doctor.hospital_id == hosp.id) if hosp else select(Doctor.id)
    doc_ids = set((await db.execute(doc_ids_stmt)).scalars().all())

    stmt = (
        select(AccessToken, MedicalRecord, Prediction, Patient, Doctor)
        .outerjoin(MedicalRecord, or_(AccessToken.record_id == MedicalRecord.id, AccessToken.patient_id == MedicalRecord.patient_id))
        .outerjoin(Prediction, MedicalRecord.prediction_id == Prediction.id)
        .outerjoin(Patient, AccessToken.patient_id == Patient.id)
        .outerjoin(Doctor, AccessToken.doctor_id == Doctor.id)
    )
    if hosp:
        stmt = stmt.where(
            or_(
                AccessToken.hospital_id == hosp.id,
                AccessToken.doctor_id.in_(doc_ids) if doc_ids else False
            )
        )

    stmt = stmt.order_by(desc(AccessToken.created_at))
    res = await db.execute(stmt)

    authorized_list = []
    seen = set()
    for tok, rec, pred, pat, doc in res.all():
        rec_code = rec.record_code if rec else f"TOKEN-{tok.token_code[:8]}"
        if tok.id in seen:
            continue
        seen.add(tok.id)

        authorized_list.append({
            "id": tok.id,
            "record_id": rec.id if rec else tok.id,
            "record_code": rec_code,
            "patient_name": pat.name if pat else "Patient",
            "patient_id": pat.id if pat else "",
            "disease": pred.disease if pred else "Consented Access",
            "doctor_name": doc.name if doc else "Attending Specialist",
            "hospital_name": hosp.name if hosp else "Hospital Facility",
            "authorized_at": format_ist(tok.created_at),
            "status": tok.status or "Active Patient Consent"
        })

    return authorized_list

@router.get("/records/patient-grants-outward")
@router.get("/records/shared")
async def get_hospital_outward_patient_grants(
    current_user: User = Depends(require_roles(["HOSPITAL", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    hosp = await get_hospital_entity(current_user, db) if current_user.role == "HOSPITAL" else None

    doc_ids_stmt = select(Doctor.id).where(Doctor.hospital_id == hosp.id) if hosp else select(Doctor.id)
    doc_ids = set((await db.execute(doc_ids_stmt)).scalars().all())

    stmt = (
        select(AccessToken, MedicalRecord, Prediction, Patient, Doctor, Hospital)
        .join(MedicalRecord, AccessToken.record_id == MedicalRecord.id)
        .outerjoin(Prediction, MedicalRecord.prediction_id == Prediction.id)
        .outerjoin(Patient, AccessToken.patient_id == Patient.id)
        .outerjoin(Doctor, AccessToken.doctor_id == Doctor.id)
        .outerjoin(Hospital, AccessToken.hospital_id == Hospital.id)
    )
    if hosp:
        stmt = stmt.where(
            and_(
                MedicalRecord.hospital_id == hosp.id,
                or_(
                    AccessToken.hospital_id != hosp.id,
                    AccessToken.doctor_id.not_in(doc_ids) if doc_ids else True
                )
            )
        )

    stmt = stmt.order_by(desc(AccessToken.created_at))
    res = await db.execute(stmt)

    outward_list = []
    seen = set()
    for tok, rec, pred, pat, target_doc, target_hosp in res.all():
        if tok.id in seen:
            continue
        seen.add(tok.id)

        outward_list.append({
            "id": tok.id,
            "record_id": rec.id if rec else tok.id,
            "record_code": rec.record_code if rec else f"TOKEN-{tok.token_code[:8]}",
            "patient_name": pat.name if pat else "Patient",
            "patient_id": pat.id if pat else "",
            "disease": pred.disease if pred else "Health Diagnostic",
            "doctor_name": target_doc.name if target_doc else "External Specialist",
            "hospital_name": target_hosp.name if target_hosp else "External Facility",
            "authorized_at": format_ist(tok.created_at),
            "status": "Patient Granted to External Doctor"
        })

    return outward_list

@router.get("/doctors")
async def get_hospital_doctors(
    current_user: User = Depends(require_roles(["HOSPITAL", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    hosp = await get_hospital_entity(current_user, db) if current_user.role == "HOSPITAL" else None

    stmt = select(Doctor, User).outerjoin(User, Doctor.user_id == User.id)
    if hosp:
        stmt = stmt.where(Doctor.hospital_id == hosp.id)
    stmt = stmt.order_by(Doctor.name)

    res = await db.execute(stmt)

    out = []
    for d, u in res.all():
        out.append({
            "id": d.id,
            "name": d.name,
            "doctor_code": d.doctor_code if hasattr(d, 'doctor_code') else f"DOC-{d.id[:4]}",
            "email": u.email if u else "",
            "license_number": d.license_number or "N/A",
            "department": d.department or "General Medicine",
            "specialization": d.specialization or "General Physician",
            "phone": d.phone or "",
            "is_active": u.is_active if u else True,
            "must_change_password": getattr(u, "must_change_password", False) if u else False,
            "created_at": format_ist(d.created_at) if hasattr(d, 'created_at') else "Recent"
        })
    return out

@router.post("/doctors")
@router.post("/doctors/onboard")
async def create_hospital_doctor(
    data: dict,
    current_user: User = Depends(require_roles(["HOSPITAL", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    hosp = await get_hospital_entity(current_user, db) if current_user.role == "HOSPITAL" else None

    email = data.get("email", "").strip().lower()
    password = data.get("initial_password") or data.get("password") or "doctor123"
    name = data.get("name", "").strip()
    license_number = data.get("license_number", "").strip()
    specialization = data.get("specialization", "General Physician").strip()
    department = data.get("department", "General Medicine").strip()
    phone = data.get("phone", "").strip()

    if not email or not name:
        raise HTTPException(status_code=400, detail="Doctor Name and Email are required.")

    # Check if user email exists
    usr_chk = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if usr_chk:
        raise HTTPException(status_code=400, detail=f"User with email '{email}' already exists.")

    import random, string
    doc_code = f"DOC-{''.join(random.choices(string.digits, k=4))}"

    from backend.app.core.security import get_password_hash
    new_user = User(
        email=email,
        hashed_password=get_password_hash(password),
        role="DOCTOR",
        is_active=True,
        is_verified=True
    )
    db.add(new_user)
    await db.flush()

    new_doc = Doctor(
        user_id=new_user.id,
        hospital_id=hosp.id if hosp else None,
        name=name,
        doctor_code=doc_code,
        license_number=license_number,
        specialization=specialization,
        department=department,
        phone=phone
    )
    db.add(new_doc)
    await db.commit()

    return {"message": f"Doctor {name} registered successfully.", "doctor_id": new_doc.id, "doctor_code": doc_code}


@router.get("/doctors/{doctor_id}/details")
async def get_hospital_doctor_details(
    doctor_id: str,
    current_user: User = Depends(require_roles(["HOSPITAL", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    hosp = await get_hospital_entity(current_user, db) if current_user.role == "HOSPITAL" else None

    # Fetch Doctor Entity
    doc_stmt = select(Doctor, User).outerjoin(User, Doctor.user_id == User.id).where(Doctor.id == doctor_id)
    doc_res = (await db.execute(doc_stmt)).first()
    if not doc_res:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    doctor, doc_user = doc_res
    if hosp and doctor.hospital_id != hosp.id:
        raise HTTPException(status_code=403, detail="Doctor does not belong to your hospital facility.")

    # 1. Appointments Performance Breakdown
    apt_stmt = select(Appointment).where(Appointment.doctor_id == doctor.id)
    apts = (await db.execute(apt_stmt)).scalars().all()

    scheduled_cnt = sum(1 for a in apts if a.status == "SCHEDULED")
    accepted_cnt = sum(1 for a in apts if a.status == "ACCEPTED")
    rejected_cnt = sum(1 for a in apts if a.status == "REJECTED")
    completed_cnt = sum(1 for a in apts if a.status == "COMPLETED")
    total_apts = len(apts)

    # 2. Doctor's Own Analysis Records (created directly by this doctor)
    rec_stmt = (
        select(MedicalRecord, Prediction, Patient)
        .join(Prediction, MedicalRecord.prediction_id == Prediction.id)
        .outerjoin(Patient, MedicalRecord.patient_id == Patient.id)
        .where(MedicalRecord.doctor_id == doctor.id)
        .order_by(desc(MedicalRecord.created_at))
    )
    rec_res = await db.execute(rec_stmt)

    own_records = []
    for rec, pred, pat in rec_res.all():
        own_records.append({
            "id": rec.id,
            "record_code": rec.record_code,
            "patient_name": pat.name if pat else "Patient",
            "patient_code": pat.patient_code if pat else "PAT-0000",
            "disease": pred.disease if pred else "Health Analysis",
            "result": pred.result if pred else "Pending",
            "confidence": pred.confidence if pred else 0.0,
            "risk_level": pred.risk_level if pred else "Low",
            "created_at": format_ist(rec.created_at)
        })

    # 3. Reports Shared To This Doctor (via Patient AccessTokens)
    token_stmt = (
        select(AccessToken, MedicalRecord, Prediction, Patient)
        .outerjoin(MedicalRecord, AccessToken.record_id == MedicalRecord.id)
        .outerjoin(Prediction, MedicalRecord.prediction_id == Prediction.id)
        .outerjoin(Patient, AccessToken.patient_id == Patient.id)
        .where(AccessToken.doctor_id == doctor.id)
        .order_by(desc(AccessToken.created_at))
    )
    tok_res = await db.execute(token_stmt)

    shared_reports = []
    for tok, rec, pred, pat in tok_res.all():
        shared_reports.append({
            "id": tok.id,
            "token_code": tok.token_code,
            "record_code": rec.record_code if rec else f"TOKEN-{tok.token_code[:8]}",
            "patient_name": pat.name if pat else "Patient",
            "disease": pred.disease if pred else "Diagnostic Access",
            "status": tok.status or "ACTIVE",
            "authorized_at": format_ist(tok.created_at),
            "expires_at": format_ist(tok.expires_at)
        })

    return {
        "doctor": {
            "id": doctor.id,
            "name": doctor.name,
            "email": doc_user.email if doc_user else "",
            "specialization": doctor.specialization or "General Physician",
            "department": doctor.department or "General Medicine",
            "license_number": doctor.license_number or "LIC-PENDING",
            "phone": doctor.phone or "N/A"
        },
        "appointments_summary": {
            "scheduled": scheduled_cnt,
            "accepted": accepted_cnt,
            "rejected": rejected_cnt,
            "completed": completed_cnt,
            "total": total_apts
        },
        "analysis_records": own_records,
        "shared_reports": shared_reports
    }


@router.get("/public")
@router.get("/all")
async def get_public_hospitals(db: AsyncSession = Depends(get_db)):
    stmt = select(Hospital).order_by(Hospital.name)
    hospitals = (await db.execute(stmt)).scalars().all()
    out = []
    for h in hospitals:
        code_val = getattr(h, 'hospital_code', None) or f"HOSP-{h.id[:4].upper()}"
        out.append({
            "id": h.id,
            "name": h.name,
            "code": code_val,
            "type": getattr(h, 'hospital_type', 'General Hospital') or "General Hospital",
            "city": getattr(h, 'city', 'Central Facility') or "Central Facility"
        })
    return out

@router.get("/{hospital_id}/doctors")
async def get_doctors_by_hospital_id(
    hospital_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Doctor).where(Doctor.hospital_id == hospital_id).order_by(Doctor.name)
    docs = (await db.execute(stmt)).scalars().all()
    if not docs:
        stmt_all = select(Doctor).order_by(Doctor.name)
        docs = (await db.execute(stmt_all)).scalars().all()

    out = []
    for d in docs:
        d_name = d.name if d.name.startswith("Dr.") else f"Dr. {d.name}"
        out.append({
            "id": d.id,
            "name": d_name,
            "specialization": getattr(d, 'specialization', 'Specialist Physician') or "Specialist Physician",
            "department": getattr(d, 'department', 'General Medicine') or "General Medicine"
        })
    return out


class HospitalProfileUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    email: Optional[str] = None

@router.put("/me")
@router.put("/profile/me")
async def update_hospital_profile(
    req: HospitalProfileUpdate,
    current_user: User = Depends(require_roles(["HOSPITAL"])),
    db: AsyncSession = Depends(get_db)
):
    hosp = await get_hospital_entity(current_user, db)
    if req.name and req.name.strip():
        hosp.name = req.name.strip()
        current_user.name = req.name.strip()
    if req.address is not None:
        hosp.address = req.address.strip()
    if req.phone is not None:
        hosp.phone = req.phone.strip()
        current_user.phone = req.phone.strip()
    if req.license_number is not None:
        hosp.license_number = req.license_number.strip()
    if req.email and req.email.strip() and req.email.strip() != current_user.email:
        chk = (await db.execute(select(User).where(User.email == req.email.strip(), User.id != current_user.id))).scalar_one_or_none()
        if not chk:
            current_user.email = req.email.strip()

    await db.commit()
    await db.refresh(hosp)
    return {"message": "Hospital profile updated successfully.", "hospital_id": hosp.id}
