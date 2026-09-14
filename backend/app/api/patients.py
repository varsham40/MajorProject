from pydantic import BaseModel
import os
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.core.dependencies import get_current_user, require_roles
from backend.app.models.user import User
from backend.app.models.healthcare import Patient, PatientHealthProfile, Doctor, Hospital, MedicalReport, PatientDoctorRelationship, Appointment
from backend.app.models.ml import Prediction, PredictionInput, PredictionAnalysis, SHAPExplanation, SHAPFeature, PredictionReport
from backend.app.models.record import MedicalRecord
from backend.app.models.sharing import AccessToken, RecordShare
from backend.app.models.notification import NotificationDismissal
from backend.app.models.blockchain import BlockchainRecord
from backend.app.services.analytics_service import get_patient_dashboard_analytics
from backend.app.services.token_service import generate_random_token_code
from backend.app.services.canonical_service import calculate_record_sha256
from backend.app.services.blockchain_service import blockchain_service
from backend.app.schemas.record import FullRecordViewOut, AccessTokenCreate, AccessTokenOut

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

router = APIRouter(prefix="/patients", tags=["Patient Navigation"])

async def get_patient_entity(user: User, db: AsyncSession) -> Patient:
    stmt = select(Patient).where(Patient.user_id == user.id)
    patient = (await db.execute(stmt)).scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found.")
    return patient

@router.get("/me/dashboard")
async def get_my_dashboard(
    current_user: User = Depends(require_roles(["PATIENT"])),
    db: AsyncSession = Depends(get_db)
):
    patient = await get_patient_entity(current_user, db)
    analytics = await get_patient_dashboard_analytics(db, patient.id)
    return analytics

@router.get("/me/health")
async def get_my_health_profile(
    current_user: User = Depends(require_roles(["PATIENT"])),
    db: AsyncSession = Depends(get_db)
):
    patient = await get_patient_entity(current_user, db)
    stmt = select(PatientHealthProfile).where(PatientHealthProfile.patient_id == patient.id)
    hp = (await db.execute(stmt)).scalar_one_or_none()
    return {
        "patient": {
            "name": patient.name,
            "patient_code": patient.patient_code,
            "dob": str(patient.dob),
            "gender": patient.gender,
            "phone": patient.phone,
            "email": patient.email,
            "address": patient.address
        },
        "health_profile": hp
    }

@router.get("/me/records")
async def get_my_medical_records(
    current_user: User = Depends(require_roles(["PATIENT"])),
    db: AsyncSession = Depends(get_db)
):
    patient = await get_patient_entity(current_user, db)
    stmt = (
        select(MedicalRecord, Prediction, Doctor, Hospital)
        .outerjoin(Prediction, MedicalRecord.prediction_id == Prediction.id)
        .outerjoin(Doctor, MedicalRecord.doctor_id == Doctor.id)
        .outerjoin(Hospital, MedicalRecord.hospital_id == Hospital.id)
        .where(MedicalRecord.patient_id == patient.id)
        .order_by(desc(MedicalRecord.created_at))
    )
    res = await db.execute(stmt)
    records = []
    for rec, pred, doc, hosp in res.all():
        records.append({
            "record_id": rec.id,
            "record_code": rec.record_code,
            "disease": pred.disease if pred else "General Diagnostic Consultation",
            "result": pred.result if pred else "Normal",
            "confidence": pred.confidence if pred else 95.0,
            "risk_level": pred.risk_level if pred else "LOW",
            "doctor_name": doc.name if doc else "Attending Physician",
            "hospital_name": hosp.name if hosp else "General Hospital",
            "date": format_ist(rec.created_at)
        })
    return records

@router.get("/me/records/{record_id}", response_model=FullRecordViewOut)
@router.get("/predictions/{record_id}", response_model=FullRecordViewOut)
async def get_full_record_details(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch record
    rec_stmt = (
        select(MedicalRecord, Prediction, Doctor, Hospital, Patient)
        .join(Prediction, MedicalRecord.prediction_id == Prediction.id)
        .join(Doctor, MedicalRecord.doctor_id == Doctor.id)
        .join(Hospital, MedicalRecord.hospital_id == Hospital.id)
        .join(Patient, MedicalRecord.patient_id == Patient.id)
        .where(MedicalRecord.id == record_id)
    )
    res = (await db.execute(rec_stmt)).first()
    if not res:
        raise HTTPException(status_code=404, detail="Medical record not found.")

    rec, pred, doc, hosp, pat = res

    # Prediction Inputs
    inp_res = (await db.execute(select(PredictionInput).where(PredictionInput.prediction_id == pred.id))).scalar_one_or_none()
    inputs_dict = inp_res.inputs if inp_res else {}

    # AI Analysis text
    ana_res = (await db.execute(select(PredictionAnalysis).where(PredictionAnalysis.prediction_id == pred.id))).scalar_one_or_none()
    ai_analysis_text = ana_res.ai_analysis_text if ana_res else "Clinical AI Analysis completed."

    # SHAP details
    shap_res = (await db.execute(select(SHAPExplanation).where(SHAPExplanation.prediction_id == pred.id))).scalar_one_or_none()
    base_val = shap_res.base_value if shap_res else 0.5
    shap_features = []
    if shap_res:
        feat_res = (await db.execute(select(SHAPFeature).where(SHAPFeature.shap_explanation_id == shap_res.id))).scalars().all()
        for f in feat_res:
            shap_features.append({
                "feature_name": f.feature_name,
                "patient_value": f.patient_value,
                "shap_value": f.shap_value,
                "effect": f.effect
            })

    # Reports Used
    pr_stmt = (
        select(MedicalReport)
        .join(PredictionReport, MedicalReport.id == PredictionReport.report_id)
        .where(PredictionReport.prediction_id == pred.id)
    )
    reports_res = (await db.execute(pr_stmt)).scalars().all()
    reports_used = [
        {"id": r.id, "file_name": r.file_name, "file_type": r.file_type, "report_date": str(r.report_date)}
        for r in reports_res
    ]

    # Blockchain Status
    bc_res = (await db.execute(select(BlockchainRecord).where(BlockchainRecord.record_id == rec.id))).scalar_one_or_none()
    bc_details = None
    if bc_res:
        bc_details = {
            "sha256_hash": bc_res.sha256_hash,
            "tx_hash": bc_res.tx_hash,
            "block_number": bc_res.block_number,
            "contract_address": bc_res.contract_address,
            "registered_at": format_ist(bc_res.registered_at)
        }

    return FullRecordViewOut(
        record_id=rec.id,
        record_code=rec.record_code,
        created_at=rec.created_at,
        disease=pred.disease,
        result=pred.result,
        confidence=pred.confidence,
        risk_level=pred.risk_level,
        ai_analysis_text=ai_analysis_text,
        clinical_inputs=inputs_dict,
        shap_base_value=base_val,
        shap_features=shap_features,
        reports_used=reports_used,
        patient_name=pat.name,
        patient_code=pat.patient_code,
        doctor_name=doc.name,
        doctor_specialization=doc.specialization,
        hospital_name=hosp.name,
        hospital_address=hosp.address,
        is_blockchain_registered=bc_res is not None,
        blockchain_details=bc_details
    )

@router.get("/me/reports")
async def get_my_reports(
    current_user: User = Depends(require_roles(["PATIENT"])),
    db: AsyncSession = Depends(get_db)
):
    patient = await get_patient_entity(current_user, db)
    stmt = select(MedicalReport).where(MedicalReport.patient_id == patient.id).order_by(desc(MedicalReport.created_at))
    reports = (await db.execute(stmt)).scalars().all()
    return reports

@router.post("/me/reports/upload")
async def upload_patient_report(
    description: Optional[str] = Form(None),
    report_date: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(["PATIENT", "DOCTOR"])),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == "PATIENT":
        patient = await get_patient_entity(current_user, db)
        patient_id = patient.id
    else:
        # If doctor uploads for patient, patient_id will be passed in form
        patient_id = Form(...)

    ext = os.path.splitext(file.filename)[1]
    filename = f"report_{int(datetime.utcnow().timestamp())}_{file.filename}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    rep_date = datetime.strptime(report_date, "%Y-%m-%d").date() if report_date else datetime.utcnow().date()

    report = MedicalReport(
        patient_id=patient_id,
        uploaded_by=current_user.id,
        file_name=file.filename,
        file_path=filepath,
        file_type=file.content_type,
        file_size=len(content),
        report_date=rep_date,
        description=description
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report

@router.post("/me/tokens/generate", response_model=AccessTokenOut)
async def generate_access_token(
    req: AccessTokenCreate,
    current_user: User = Depends(require_roles(["PATIENT"])),
    db: AsyncSession = Depends(get_db)
):
    patient = await get_patient_entity(current_user, db)
    token_code = generate_random_token_code()
    expires_at = datetime.utcnow() + timedelta(hours=req.expiry_hours)

    token = AccessToken(
        token_code=token_code,
        patient_id=patient.id,
        hospital_id=req.hospital_id,
        doctor_id=req.doctor_id,
        record_id=req.record_id if req.record_id and req.record_id != "ALL" else None,
        expires_at=expires_at,
        status="ACTIVE"
    )
    db.add(token)
    await db.commit()

    # Compute Cryptographic Token Policy SHA-256 Fingerprint & Register on Blockchain (Hardhat Ledger)
    policy_dict = {
        "token_code": token_code,
        "patient_id": patient.id,
        "hospital_id": req.hospital_id,
        "doctor_id": req.doctor_id,
        "record_id": token.record_id or "ALL",
        "expires_at": expires_at.isoformat()
    }
    policy_sha256 = calculate_record_sha256(policy_dict)
    try:
        blockchain_service.register_record_on_chain(token_code, policy_sha256)
    except Exception as e:
        print(f"[Blockchain Token Policy Registration Warning]: {e}")

    # Query names & record for response
    hosp_name = (await db.execute(select(Hospital.name).where(Hospital.id == req.hospital_id))).scalar_one_or_none()
    doc_name = (await db.execute(select(Doctor.name).where(Doctor.id == req.doctor_id))).scalar_one_or_none()
    
    rec_code = None
    dis_name = None
    if token.record_id:
        rec_info = (await db.execute(
            select(MedicalRecord.record_code, Prediction.disease)
            .join(Prediction, MedicalRecord.prediction_id == Prediction.id)
            .where(MedicalRecord.id == token.record_id)
        )).first()
        if rec_info:
            rec_code, dis_name = rec_info

    exp_utc = token.expires_at.replace(tzinfo=timezone.utc) if token.expires_at.tzinfo is None else token.expires_at
    crt_utc = token.created_at.replace(tzinfo=timezone.utc) if token.created_at.tzinfo is None else token.created_at
    return AccessTokenOut(
        id=token.id,
        token_code=token.token_code,
        patient_id=token.patient_id,
        hospital_id=token.hospital_id,
        hospital_name=hosp_name,
        doctor_id=token.doctor_id,
        doctor_name=doc_name,
        record_id=token.record_id,
        record_code=rec_code,
        disease_name=dis_name,
        expires_at=exp_utc,
        status=token.status,
        created_at=crt_utc
    )

@router.get("/me/tokens", response_model=List[AccessTokenOut])
async def get_my_active_tokens(
    current_user: User = Depends(require_roles(["PATIENT"])),
    db: AsyncSession = Depends(get_db)
):
    patient = await get_patient_entity(current_user, db)
    stmt = (
        select(AccessToken, Hospital.name, Doctor.name)
        .outerjoin(Hospital, AccessToken.hospital_id == Hospital.id)
        .outerjoin(Doctor, AccessToken.doctor_id == Doctor.id)
        .where(AccessToken.patient_id == patient.id)
        .order_by(desc(AccessToken.created_at))
    )
    res = await db.execute(stmt)
    token_list = []
    for tok, hname, dname in res.all():
        rec_code = None
        dis_name = None
        if tok.record_id:
            rec_info = (await db.execute(
                select(MedicalRecord.record_code, Prediction.disease)
                .outerjoin(Prediction, MedicalRecord.prediction_id == Prediction.id)
                .where(MedicalRecord.id == tok.record_id)
            )).first()
            if rec_info:
                rec_code, dis_name = rec_info

        exp_utc = tok.expires_at.replace(tzinfo=timezone.utc) if tok.expires_at.tzinfo is None else tok.expires_at
        crt_utc = tok.created_at.replace(tzinfo=timezone.utc) if tok.created_at.tzinfo is None else tok.created_at
        token_list.append(AccessTokenOut(
            id=tok.id,
            token_code=tok.token_code,
            patient_id=tok.patient_id,
            hospital_id=tok.hospital_id,
            hospital_name=hname or "Authorized Hospital Facility",
            doctor_id=tok.doctor_id,
            doctor_name=dname or "Authorized Specialist Physician",
            record_id=tok.record_id,
            record_code=rec_code,
            disease_name=dis_name or "Medical Analysis Report",
            expires_at=exp_utc,
            status=tok.status,
            created_at=crt_utc
        ))
    return token_list

@router.delete("/me/tokens/{token_id}")
async def delete_access_token(
    token_id: str,
    current_user: User = Depends(require_roles(["PATIENT"])),
    db: AsyncSession = Depends(get_db)
):
    patient = await get_patient_entity(current_user, db)
    stmt = select(AccessToken).where(
        AccessToken.id == token_id,
        AccessToken.patient_id == patient.id
    )
    token = (await db.execute(stmt)).scalar_one_or_none()
    if not token:
        raise HTTPException(status_code=404, detail="Access token not found or access denied.")

    await db.delete(token)
    await db.commit()
    return {"message": "Access token revoked and deleted successfully.", "token_id": token_id}

@router.get("/me/profile")
async def get_patient_profile(
    current_user: User = Depends(require_roles(["PATIENT"])),
    db: AsyncSession = Depends(get_db)
):
    patient = await get_patient_entity(current_user, db)
    
    # Query doctors who treated the patient
    stmt = (
        select(Doctor.name, Doctor.specialization, Hospital.name, func.count(MedicalRecord.id))
        .join(Hospital, Doctor.hospital_id == Hospital.id)
        .join(MedicalRecord, MedicalRecord.doctor_id == Doctor.id)
        .where(MedicalRecord.patient_id == patient.id)
        .group_by(Doctor.id, Doctor.name, Doctor.specialization, Hospital.name)
    )
    doctors_res = (await db.execute(stmt)).all()
    treated_doctors = [
        {
            "doctor_name": dname,
            "specialization": spec,
            "hospital_name": hname,
            "records_count": count
        }
        for dname, spec, hname, count in doctors_res
    ]

    return {
        "patient": patient,
        "treated_doctors": treated_doctors
    }


@router.get("/notifications")
async def get_patient_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "PATIENT":
        return []
    patient = (await db.execute(select(Patient).where(Patient.user_id == current_user.id))).scalar_one_or_none()
    if not patient:
        return []

    dismissed_stmt = select(NotificationDismissal.notification_id).where(NotificationDismissal.user_id == current_user.id)
    dismissed_ids = set((await db.execute(dismissed_stmt)).scalars().all())

    notifications = []

    # Patient Notification Type 1: Doctor Approval / Rejection for their appointment
    apt_stmt = (
        select(Appointment, Doctor, Hospital)
        .join(Doctor, Appointment.doctor_id == Doctor.id)
        .outerjoin(Hospital, Doctor.hospital_id == Hospital.id)
        .where(
            Appointment.patient_id == patient.id,
            Appointment.status.in_(["ACCEPTED", "REJECTED"])
        )
        .order_by(desc(Appointment.created_at))
    )
    apt_res = await db.execute(apt_stmt)

    for apt, doc, hosp in apt_res.all():
        notif_id = f"apt_status_{apt.id}_{apt.status.lower()}"
        if notif_id in dismissed_ids:
            continue

        status_label = "Approved" if apt.status == "ACCEPTED" else "Rejected"
        notifications.append({
            "id": notif_id,
            "type": "APPOINTMENT_STATUS_CHANGE",
            "category": "Appointment Status",
            "title": f"Appointment {status_label}",
            "status": apt.status,
            "doctor_name": doc.name if doc else "Doctor",
            "hospital_name": hosp.name if hosp else "General Hospital",
            "appointment_date": apt.appointment_date,
            "slot_time": apt.appointment_time or "Scheduled Slot",
            "target_disease": apt.target_disease or "General Consultation",
            "message": f"Dr. {doc.name if doc else 'Doctor'} has {status_label.lower()} your appointment request for {apt.appointment_date} ({apt.appointment_time or 'Scheduled Slot'}).",
            "created_at": format_ist(apt.created_at),
            "raw_created_at": apt.created_at or datetime.min
        })

    # Patient Notification Type 2: Acknowledgment saying doctor unlocked their report through access token
    rs_stmt = (
        select(RecordShare, MedicalRecord, Doctor, Hospital)
        .join(MedicalRecord, RecordShare.record_id == MedicalRecord.id)
        .join(Doctor, RecordShare.to_doctor_id == Doctor.id)
        .outerjoin(Hospital, RecordShare.to_hospital_id == Hospital.id)
        .where(
            MedicalRecord.patient_id == patient.id,
            RecordShare.token_id.isnot(None)
        )
        .order_by(desc(RecordShare.shared_at))
    )
    rs_res = await db.execute(rs_stmt)

    for rs, m_rec, to_doc, to_hosp in rs_res.all():
        notif_id = f"tok_unlocked_{rs.id}"
        if notif_id in dismissed_ids:
            continue

        notifications.append({
            "id": notif_id,
            "type": "REPORT_UNLOCKED_ACK",
            "category": "Report Unlocked",
            "title": "Doctor Unlocked Shared Report",
            "doctor_name": to_doc.name if to_doc else "Doctor",
            "hospital_name": to_hosp.name if to_hosp else "General Hospital",
            "record_code": m_rec.record_code,
            "record_id": m_rec.id,
            "message": f"Dr. {to_doc.name if to_doc else 'Doctor'} ({to_hosp.name if to_hosp else 'General Hospital'}) unlocked your report ({m_rec.record_code}) using your access token.",
            "created_at": format_ist(rs.shared_at),
            "raw_created_at": rs.shared_at or datetime.min
        })

    notifications.sort(key=lambda x: x.get("raw_created_at") or datetime.min, reverse=True)
    return notifications

@router.post("/notifications/{notification_id}/dismiss")
async def dismiss_patient_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "PATIENT":
        return {"status": "success", "dismissed_id": notification_id}
    stmt = select(NotificationDismissal).where(
        NotificationDismissal.user_id == current_user.id,
        NotificationDismissal.notification_id == notification_id
    )
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if not existing:
        dismissal = NotificationDismissal(
            user_id=current_user.id,
            notification_id=notification_id
        )
        db.add(dismissal)
        await db.commit()
    return {"status": "success", "dismissed_id": notification_id}


class PatientProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    address: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    blood_pressure: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None
    existing_conditions: Optional[str] = None

@router.put("/me/profile")
@router.put("/me")
async def update_patient_profile(
    req: PatientProfileUpdate,
    current_user: User = Depends(require_roles(["PATIENT"])),
    db: AsyncSession = Depends(get_db)
):
    patient = await get_patient_entity(current_user, db)

    if req.name and req.name.strip():
        current_user.name = req.name.strip()
        patient.name = req.name.strip()
    if req.phone is not None:
        current_user.phone = req.phone.strip()
        patient.phone = req.phone.strip()
    if req.email and req.email.strip() and req.email.strip() != current_user.email:
        existing = (await db.execute(select(User).where(User.email == req.email.strip(), User.id != current_user.id))).scalar_one_or_none()
        if not existing:
            current_user.email = req.email.strip()
            patient.email = req.email.strip()

    if req.gender and req.gender.strip():
        patient.gender = req.gender.strip()
    if req.address is not None:
        patient.address = req.address.strip()
    if req.dob and req.dob.strip():
        try:
            patient.dob = datetime.strptime(req.dob.strip(), "%Y-%m-%d").date()
        except Exception:
            pass

    # Update or Create PatientHealthProfile
    stmt_hp = select(PatientHealthProfile).where(PatientHealthProfile.patient_id == patient.id)
    hp = (await db.execute(stmt_hp)).scalar_one_or_none()
    if not hp:
        hp = PatientHealthProfile(patient_id=patient.id)
        db.add(hp)

    if req.height is not None:
        hp.height = req.height
    if req.weight is not None:
        hp.weight = req.weight
    if hp.height and hp.weight and hp.height > 0:
        h_m = hp.height / 100.0
        hp.bmi = round(hp.weight / (h_m * h_m), 1)

    if req.blood_pressure is not None:
        hp.blood_pressure = req.blood_pressure.strip()
    if req.medical_history is not None:
        hp.medical_history = req.medical_history.strip()
    if req.allergies is not None:
        hp.allergies = req.allergies.strip()
    if req.existing_conditions is not None:
        hp.existing_conditions = req.existing_conditions.strip()

    await db.commit()
    await db.refresh(patient)
    return {"message": "Patient profile and health metrics updated successfully.", "patient_id": patient.id}
