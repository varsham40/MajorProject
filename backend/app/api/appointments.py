import random
import string
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_, and_

from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user, require_roles
from backend.app.models.user import User
from backend.app.models.healthcare import Patient, Doctor, Hospital, PatientHealthProfile, PatientDoctorRelationship, Appointment, MedicalReport
from backend.app.models.record import MedicalRecord
from backend.app.schemas.appointment import AppointmentCreate, AppointmentOut

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

router = APIRouter(prefix="/appointments", tags=["Appointment Operations"])

@router.get("/booked-slots")
async def get_doctor_booked_slots(
    doctor_id: str,
    date: str,
    db: AsyncSession = Depends(get_db)
):
    """Return list of time slots already booked for a specific doctor on a given date."""
    stmt = select(Appointment).where(
        Appointment.doctor_id == doctor_id,
        Appointment.status.in_(["SCHEDULED", "ACCEPTED", "CONFIRMED", "COMPLETED"])
    )
    res = await db.execute(stmt)
    apts = res.scalars().all()

    target_date_str = str(date).split("T")[0]
    booked_slots = []

    for apt in apts:
        apt_d_str = str(apt.appointment_date).split(" ")[0].split("T")[0]
        if apt_d_str == target_date_str:
            slot = apt.appointment_time or "10:00 AM"
            if slot not in booked_slots:
                booked_slots.append(slot)

    return {"doctor_id": doctor_id, "date": target_date_str, "booked_slots": booked_slots}

@router.post("", response_model=AppointmentOut)
@router.post("/", response_model=AppointmentOut)
@router.post("/book", response_model=AppointmentOut)
async def book_appointment(
    req: AppointmentCreate,
    current_user: User = Depends(require_roles(["PATIENT"])),
    db: AsyncSession = Depends(get_db)
):
    # Fetch patient entity
    patient_stmt = select(Patient).where(Patient.user_id == current_user.id)
    patient = (await db.execute(patient_stmt)).scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found.")

    # Validate Doctor
    doc = (await db.execute(select(Doctor).where(Doctor.id == req.doctor_id))).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Selected doctor not found.")

    hosp_id = req.hospital_id or doc.hospital_id
    hosp = None
    if hosp_id:
        hosp = (await db.execute(select(Hospital).where(Hospital.id == hosp_id))).scalar_one_or_none()
    if not hosp:
        hosp = (await db.execute(select(Hospital))).scalars().first()
    if not hosp:
        raise HTTPException(status_code=404, detail="No hospital entity found.")

    slot_time = req.appointment_time or "10:00 AM"

    # Parse appointment date
    try:
        if "T" in req.appointment_date:
            apt_date = datetime.fromisoformat(req.appointment_date.replace("Z", "+00:00"))
        else:
            apt_date = datetime.strptime(req.appointment_date.split(" ")[0], "%Y-%m-%d")
    except Exception:
        apt_date = datetime.utcnow() + timedelta(days=1)

    target_d_str = apt_date.strftime("%Y-%m-%d")

    # Check for existing slot clash for this doctor
    clash_stmt = select(Appointment).where(
        Appointment.doctor_id == doc.id,
        Appointment.status.in_(["SCHEDULED", "ACCEPTED", "CONFIRMED", "COMPLETED"])
    )
    existing_apts = (await db.execute(clash_stmt)).scalars().all()
    for e_apt in existing_apts:
        e_d_str = str(e_apt.appointment_date).split(" ")[0].split("T")[0]
        e_slot = e_apt.appointment_time or "10:00 AM"
        if e_d_str == target_d_str and e_slot == slot_time:
            raise HTTPException(
                status_code=400,
                detail=f"Slot Conflict: Dr. {doc.name} already has an appointment booked for {slot_time} on {target_d_str}."
            )

    apt_code = f"APT-{''.join(random.choices(string.digits, k=5))}"

    appointment = Appointment(
        appointment_code=apt_code,
        patient_id=patient.id,
        doctor_id=doc.id,
        hospital_id=hosp.id,
        appointment_date=apt_date,
        appointment_time=slot_time,
        target_disease=req.target_disease or "General Consultation",
        reason=req.reason or "Routine Checkup",
        notes=req.notes,
        status="SCHEDULED"
    )
    db.add(appointment)

    # Doctor-Patient Relationship will be established upon Acceptance or Treatment

    await db.commit()
    await db.refresh(appointment)

    return AppointmentOut(
        id=appointment.id,
        appointment_code=appointment.appointment_code,
        patient_id=patient.id,
        patient_name=patient.name,
        patient_code=patient.patient_code,
        hospital_id=hosp.id,
        hospital_name=hosp.name,
        doctor_id=doc.id,
        doctor_name=doc.name,
        doctor_specialization=doc.specialization,
        appointment_date=target_d_str,
        appointment_time=appointment.appointment_time or "10:00 AM",
        target_disease=appointment.target_disease,
        reason=appointment.reason,
        status=appointment.status,
        notes=appointment.notes,
        created_at=format_ist(appointment.created_at)
    )

@router.get("/my", response_model=List[AppointmentOut])
@router.get("/patient/my-appointments", response_model=List[AppointmentOut])
async def list_my_patient_appointments(
    current_user: User = Depends(require_roles(["PATIENT"])),
    db: AsyncSession = Depends(get_db)
):
    patient_stmt = select(Patient).where(Patient.user_id == current_user.id)
    patient = (await db.execute(patient_stmt)).scalar_one_or_none()
    if not patient:
        return []

    stmt = (
        select(Appointment, Doctor, Hospital)
        .join(Doctor, Appointment.doctor_id == Doctor.id)
        .join(Hospital, Appointment.hospital_id == Hospital.id)
        .where(Appointment.patient_id == patient.id)
        .order_by(desc(Appointment.created_at))
    )
    res = await db.execute(stmt)

    output = []
    for apt, doc, hosp in res.all():
        rec_id = None
        if apt.status == "COMPLETED":
            rec_stmt = (
                select(MedicalRecord.id)
                .where(MedicalRecord.patient_id == patient.id, MedicalRecord.doctor_id == doc.id)
                .order_by(desc(MedicalRecord.created_at))
            )
            rec_id = (await db.execute(rec_stmt)).scalars().first()

        apt_d_str = str(apt.appointment_date).split(" ")[0].split("T")[0]

        output.append(AppointmentOut(
            id=apt.id,
            appointment_code=apt.appointment_code,
            patient_id=patient.id,
            patient_name=patient.name,
            patient_code=patient.patient_code,
            hospital_id=hosp.id,
            hospital_name=hosp.name,
            doctor_id=doc.id,
            doctor_name=doc.name,
            doctor_specialization=doc.specialization,
            appointment_date=apt_d_str,
            appointment_time=apt.appointment_time or "10:00 AM",
            target_disease=apt.target_disease,
            reason=apt.reason,
            status=apt.status,
            notes=apt.notes,
            record_id=rec_id,
            created_at=format_ist(apt.created_at)
        ))
    return output

@router.get("/doctor", response_model=List[AppointmentOut])
@router.get("/doctor/scheduled", response_model=List[AppointmentOut])
async def list_doctor_scheduled_appointments(
    current_user: User = Depends(require_roles(["DOCTOR"])),
    db: AsyncSession = Depends(get_db)
):
    doc_stmt = select(Doctor).where(Doctor.user_id == current_user.id)
    doctor = (await db.execute(doc_stmt)).scalar_one_or_none()
    if not doctor:
        return []

    stmt = (
        select(Appointment, Patient, Hospital)
        .join(Patient, Appointment.patient_id == Patient.id)
        .join(Hospital, Appointment.hospital_id == Hospital.id)
        .where(Appointment.doctor_id == doctor.id)
        .order_by(desc(Appointment.created_at))
    )
    res = await db.execute(stmt)

    output = []
    for apt, pat, hosp in res.all():
        apt_d_str = str(apt.appointment_date).split(" ")[0].split("T")[0]
        output.append(AppointmentOut(
            id=apt.id,
            appointment_code=apt.appointment_code,
            patient_id=pat.id,
            patient_name=pat.name,
            patient_code=pat.patient_code,
            hospital_id=hosp.id,
            hospital_name=hosp.name,
            doctor_id=doctor.id,
            doctor_name=doctor.name,
            doctor_specialization=doctor.specialization,
            appointment_date=apt_d_str,
            appointment_time=apt.appointment_time or "10:00 AM",
            target_disease=apt.target_disease,
            reason=apt.reason,
            status=apt.status,
            notes=apt.notes,
            created_at=format_ist(apt.created_at)
        ))
    return output

@router.post("/{appointment_id}/accept")
async def accept_appointment(
    appointment_id: str,
    current_user: User = Depends(require_roles(["DOCTOR"])),
    db: AsyncSession = Depends(get_db)
):
    doc_stmt = select(Doctor).where(Doctor.user_id == current_user.id)
    doctor = (await db.execute(doc_stmt)).scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    apt_stmt = select(Appointment).where(
        Appointment.id == appointment_id,
        Appointment.doctor_id == doctor.id
    )
    apt = (await db.execute(apt_stmt)).scalar_one_or_none()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found or unauthorized.")

    apt.status = "ACCEPTED"
    await db.commit()
    return {"message": f"Appointment '{apt.appointment_code}' ACCEPTED.", "appointment_id": apt.id, "status": "ACCEPTED"}

@router.post("/{appointment_id}/reject")
async def reject_appointment(
    appointment_id: str,
    current_user: User = Depends(require_roles(["DOCTOR"])),
    db: AsyncSession = Depends(get_db)
):
    doc_stmt = select(Doctor).where(Doctor.user_id == current_user.id)
    doctor = (await db.execute(doc_stmt)).scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    apt_stmt = select(Appointment).where(
        Appointment.id == appointment_id,
        Appointment.doctor_id == doctor.id
    )
    apt = (await db.execute(apt_stmt)).scalar_one_or_none()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found or unauthorized.")

    apt.status = "REJECTED"
    await db.commit()
    return {"message": f"Appointment '{apt.appointment_code}' REJECTED.", "appointment_id": apt.id, "status": "REJECTED"}

@router.post("/{appointment_id}/cancel")
@router.post("/cancel/{appointment_id}")
async def cancel_patient_appointment(
    appointment_id: str,
    current_user: User = Depends(require_roles(["PATIENT"])),
    db: AsyncSession = Depends(get_db)
):
    patient_stmt = select(Patient).where(Patient.user_id == current_user.id)
    patient = (await db.execute(patient_stmt)).scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found.")

    apt_stmt = select(Appointment).where(
        Appointment.id == appointment_id,
        Appointment.patient_id == patient.id
    )
    apt = (await db.execute(apt_stmt)).scalar_one_or_none()

    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found or unauthorized.")

    if apt.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Cannot cancel an appointment that has already been completed.")

    apt.status = "CANCELLED"
    await db.commit()

    return {"message": f"Appointment '{apt.appointment_code}' cancelled successfully.", "appointment_id": apt.id}

@router.post("/{appointment_id}/complete")
async def complete_appointment_by_id(
    appointment_id: str,
    req: dict,
    current_user: User = Depends(require_roles(["DOCTOR"])),
    db: AsyncSession = Depends(get_db)
):
    from backend.app.api.doctors import get_doctor_entity, run_disease_prediction
    from backend.app.schemas.prediction import PredictionCreate
    doctor = await get_doctor_entity(current_user, db)

    apt_stmt = select(Appointment).where(
        Appointment.id == appointment_id,
        Appointment.doctor_id == doctor.id
    )
    apt = (await db.execute(apt_stmt)).scalar_one_or_none()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found for this doctor.")

    disease_key = req.get("disease_type") or apt.target_disease or "diabetes"
    inputs = req.get("clinical_data", {})

    pred_in = PredictionCreate(
        patient_id=apt.patient_id,
        disease_key=disease_key,
        inputs=inputs,
        appointment_id=apt.id
    )

    pred_out = await run_disease_prediction(req=pred_in, current_user=current_user, db=db)
    
    apt.status = "COMPLETED"
    await db.commit()

    return {
        "message": f"Appointment '{apt.appointment_code}' marked as COMPLETED.",
        "record": {
            "id": pred_out.record_id,
            "prediction_result": pred_out.result,
            "risk_level": pred_out.risk_level
        }
    }


@router.get("/detail/{apt_query}")
async def get_appointment_full_detail(
    apt_query: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    apt_query_clean = apt_query.strip()
    stmt = (
        select(Appointment, Patient, Doctor, Hospital)
        .join(Patient, Appointment.patient_id == Patient.id)
        .outerjoin(Doctor, Appointment.doctor_id == Doctor.id)
        .outerjoin(Hospital, Appointment.hospital_id == Hospital.id)
        .where(or_(Appointment.id == apt_query_clean, Appointment.appointment_code.ilike(apt_query_clean)))
    )
    res = (await db.execute(stmt)).first()
    if not res:
        raise HTTPException(status_code=404, detail=f"Appointment '{apt_query}' not found.")

    apt, pat, doc, hosp = res

    hp_stmt = select(PatientHealthProfile).where(PatientHealthProfile.patient_id == pat.id)
    hp = (await db.execute(hp_stmt)).scalar_one_or_none()

    rep_stmt = select(MedicalReport).where(MedicalReport.patient_id == pat.id).order_by(desc(MedicalReport.created_at))
    reports = (await db.execute(rep_stmt)).scalars().all()

    apt_d_str = str(apt.appointment_date).split(" ")[0].split("T")[0]

    return {
        "appointment": AppointmentOut(
            id=apt.id,
            appointment_code=apt.appointment_code,
            patient_id=pat.id,
            patient_name=pat.name,
            patient_code=pat.patient_code,
            hospital_id=hosp.id if hosp else "HOSP-000",
            hospital_name=hosp.name if hosp else "General Hospital",
            doctor_id=doc.id if doc else "DOC-000",
            doctor_name=doc.name if doc else "Attending Doctor",
            doctor_specialization=doc.specialization if doc else "Specialist",
            appointment_date=apt_d_str,
            appointment_time=apt.appointment_time or "10:00 AM",
            target_disease=apt.target_disease,
            reason=apt.reason,
            status=apt.status,
            notes=apt.notes,
            created_at=format_ist(apt.created_at)
        ),
        "patient": {
            "id": pat.id,
            "patient_code": pat.patient_code,
            "name": pat.name,
            "dob": str(pat.dob) if pat.dob else "N/A",
            "gender": pat.gender,
            "phone": pat.phone,
            "email": pat.email,
            "address": pat.address
        },
        "health_profile": hp,
        "reports": [
            {
                "id": r.id,
                "file_name": r.file_name,
                "file_type": r.file_type,
                "report_date": str(r.report_date),
                "description": r.description
            }
            for r in reports
        ]
    }

