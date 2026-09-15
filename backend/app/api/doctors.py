from pydantic import BaseModel
import os
import yaml
import random
import string
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_, func

from backend.app.core.database import get_db
from backend.app.core.security import get_password_hash
from backend.app.core.dependencies import get_current_user, require_roles
from backend.app.models.user import User
from backend.app.models.healthcare import Patient, PatientHealthProfile, Doctor, Hospital, PatientDoctorRelationship, MedicalReport, Appointment, DoctorAvailability
from backend.app.models.ml import AIModel, Prediction, PredictionInput, PredictionAnalysis, SHAPExplanation, SHAPFeature, PredictionReport
from backend.app.models.record import MedicalRecord
from backend.app.models.sharing import AccessToken, RecordShare
from backend.app.models.notification import NotificationDismissal
from backend.app.models.blockchain import BlockchainRecord
from backend.app.services.analytics_service import get_doctor_dashboard_analytics
from backend.app.services.ml_service import run_prediction_inference
from backend.app.services.shap_service import compute_shap_explanations
from backend.app.services.canonical_service import calculate_record_sha256
from backend.app.services.blockchain_service import blockchain_service
from backend.app.services.token_service import validate_token_sharing_conditions
from backend.app.schemas.patient import PatientCreate, PatientOut
from backend.app.schemas.prediction import PredictionCreate, PredictionOut, SHAPExplanationOut, SHAPFeatureOut
from backend.app.schemas.record import RecordShareCreate, TokenRedeemRequest, FullRecordViewOut

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

router = APIRouter(prefix="/doctors", tags=["Doctor Operations"])

@router.get("")
@router.get("/")
async def list_available_doctors(
    db: AsyncSession = Depends(get_db)
):
    """List all available doctors for patient appointment scheduling."""
    stmt = select(Doctor, Hospital, User).outerjoin(Hospital, Doctor.hospital_id == Hospital.id).outerjoin(User, Doctor.user_id == User.id)
    res = await db.execute(stmt)
    doctors_list = []
    for doc, hosp, u in res.all():
        doctors_list.append({
            "id": doc.id,
            "full_name": doc.name,
            "name": doc.name,
            "email": u.email if u else "",
            "specialty": doc.specialization or "General Physician",
            "department": doc.specialization or "General Medicine",
            "hospital_name": hosp.name if hosp else "Main Hospital",
            "is_available": True
        })
    return doctors_list


PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
CONFIG_PATH = os.path.join(PROJECT_ROOT, "ml", "config", "disease_features.yaml")

async def get_doctor_entity(user: User, db: AsyncSession) -> Doctor:
    stmt = select(Doctor).where(Doctor.user_id == user.id)
    doc = (await db.execute(stmt)).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")
    return doc

@router.get("/overview")
async def get_doctor_overview(
    current_user: User = Depends(require_roles(["DOCTOR"])),
    db: AsyncSession = Depends(get_db)
):
    doctor = await get_doctor_entity(current_user, db)
    return await get_doctor_dashboard_analytics(db, doctor.id)

@router.get("/patients")
async def list_doctor_patients(
    current_user: User = Depends(require_roles(["DOCTOR"])),
    db: AsyncSession = Depends(get_db)
):
    doctor = await get_doctor_entity(current_user, db)
    
    # 1. Treated Patient IDs (MedicalRecord, Relationship, or COMPLETED Appointment)
    rel_stmt = select(PatientDoctorRelationship.patient_id).where(PatientDoctorRelationship.doctor_id == doctor.id)
    treated_rel_ids = set((await db.execute(rel_stmt)).scalars().all())

    rec_stmt = select(MedicalRecord.patient_id).where(MedicalRecord.doctor_id == doctor.id)
    treated_rec_ids = set((await db.execute(rec_stmt)).scalars().all())

    comp_apt_stmt = select(Appointment.patient_id).where(
        Appointment.doctor_id == doctor.id,
        Appointment.status == "COMPLETED"
    )
    treated_apt_ids = set((await db.execute(comp_apt_stmt)).scalars().all())

    treated_patient_ids = treated_rel_ids | treated_rec_ids | treated_apt_ids

    # 2. Appointment Patient IDs
    apt_all_stmt = select(Appointment.patient_id).where(Appointment.doctor_id == doctor.id)
    apt_patient_ids = set((await db.execute(apt_all_stmt)).scalars().all())

    # 3. Shared Patient IDs (RecordShare or AccessToken)
    shared_rec_stmt = (
        select(MedicalRecord.patient_id)
        .join(RecordShare, RecordShare.record_id == MedicalRecord.id)
        .where(RecordShare.to_doctor_id == doctor.id)
    )
    shared_rec_ids = set((await db.execute(shared_rec_stmt)).scalars().all())

    token_stmt = select(AccessToken.patient_id).where(
        or_(AccessToken.doctor_id == doctor.id, AccessToken.hospital_id == doctor.hospital_id)
    )
    token_patient_ids = set((await db.execute(token_stmt)).scalars().all())

    shared_patient_ids = shared_rec_ids | token_patient_ids

    # All authorized patients for this doctor
    authorized_patient_ids = treated_patient_ids | apt_patient_ids | shared_patient_ids

    if not authorized_patient_ids:
        return []

    stmt = select(Patient).where(Patient.id.in_(authorized_patient_ids)).order_by(desc(Patient.created_at))
    patients = (await db.execute(stmt)).scalars().all()

    patients_list = []
    seen_ids = set()
    for p in patients:
        if p.id in seen_ids:
            continue
        seen_ids.add(p.id)

        # Fetch latest Appointment for this patient and doctor
        latest_apt_stmt = (
            select(Appointment)
            .where(Appointment.patient_id == p.id, Appointment.doctor_id == doctor.id)
            .order_by(desc(Appointment.created_at))
        )
        latest_apt = (await db.execute(latest_apt_stmt)).scalars().first()

        # Fetch treatment indicator (MedicalRecords created directly by THIS doctor)
        mr_count = (await db.execute(select(func.count(MedicalRecord.id)).where(MedicalRecord.patient_id == p.id, MedicalRecord.doctor_id == doctor.id))).scalar() or 0
        rel_count = (await db.execute(select(func.count(PatientDoctorRelationship.id)).where(PatientDoctorRelationship.patient_id == p.id, PatientDoctorRelationship.doctor_id == doctor.id))).scalar() or 0

        # Fetch shared record & token access indicators
        share_count = (await db.execute(
            select(func.count(RecordShare.id))
            .join(MedicalRecord, RecordShare.record_id == MedicalRecord.id)
            .where(RecordShare.to_doctor_id == doctor.id, MedicalRecord.patient_id == p.id)
        )).scalar() or 0

        tok_count = (await db.execute(
            select(func.count(AccessToken.id))
            .where(AccessToken.patient_id == p.id, or_(AccessToken.doctor_id == doctor.id, AccessToken.hospital_id == doctor.hospital_id))
        )).scalar() or 0

        if mr_count > 0:
            source_label = "Treated by me"
        elif share_count > 0 or tok_count > 0:
            source_label = "Shared Access"
        elif latest_apt:
            if latest_apt.status == "REJECTED":
                source_label = "Rejected by me"
            elif latest_apt.status == "ACCEPTED":
                source_label = "Accepted"
            elif latest_apt.status == "SCHEDULED":
                source_label = "Scheduled"
            elif latest_apt.status == "COMPLETED":
                source_label = "Treated by me"
            else:
                source_label = "Scheduled"
        elif rel_count > 0:
            source_label = "Treated by me"
        else:
            source_label = "Shared Access"

        patients_list.append({
            "id": p.id,
            "patient_code": p.patient_code or f"PAT-{p.id[:4]}",
            "name": p.name or "Patient",
            "dob": str(p.dob) if p.dob else "N/A",
            "gender": p.gender or "Unknown",
            "phone": p.phone or "",
            "email": p.email or "",
            "source": source_label
        })
    return patients_list

# Disabled / Removed endpoint
@router.post("/patients/new")
async def create_new_patient():
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Endpoint /doctors/patients/new has been disabled and removed.")

@router.get("/patients/{patient_id}")
async def get_doctor_patient_detail(
    patient_id: str,
    current_user: User= Depends(require_roles(["DOCTOR"])),
    db: AsyncSession = Depends(get_db)
):
    doctor = await get_doctor_entity(current_user, db)

    # 1. Query Patient by ID or Patient Code
    stmt = select(Patient).where(Patient.id == patient_id)
    patient = (await db.execute(stmt)).scalar_one_or_none()
    if not patient:
        stmt_code = select(Patient).where(Patient.patient_code == patient_id)
        patient = (await db.execute(stmt_code)).scalar_one_or_none()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found.")

    # Authorization Check
    rel_stmt = select(PatientDoctorRelationship.patient_id).where(PatientDoctorRelationship.doctor_id == doctor.id)
    treated_rel_ids = set((await db.execute(rel_stmt)).scalars().all())

    rec_stmt = select(MedicalRecord.patient_id).where(MedicalRecord.doctor_id == doctor.id)
    treated_rec_ids = set((await db.execute(rec_stmt)).scalars().all())

    apt_stmt = select(Appointment.patient_id).where(Appointment.doctor_id == doctor.id)
    treated_apt_ids = set((await db.execute(apt_stmt)).scalars().all())

    shared_rec_stmt = (
        select(MedicalRecord.patient_id)
        .join(RecordShare, RecordShare.record_id == MedicalRecord.id)
        .where(RecordShare.to_doctor_id == doctor.id)
    )
    shared_rec_ids = set((await db.execute(shared_rec_stmt)).scalars().all())

    token_stmt = select(AccessToken.patient_id).where(
        or_(AccessToken.doctor_id == doctor.id, AccessToken.hospital_id == doctor.hospital_id)
    )
    token_patient_ids = set((await db.execute(token_stmt)).scalars().all())

    authorized_patient_ids = treated_rel_ids | treated_rec_ids | treated_apt_ids | shared_rec_ids | token_patient_ids

    if patient.id not in authorized_patient_ids:
        raise HTTPException(status_code=433, detail="Access Denied: You are not authorized to view this patient's records.")

    # 2. Query Patient Health Profile (Vitals & Background)
    hp_stmt = select(PatientHealthProfile).where(PatientHealthProfile.patient_id == patient.id)
    hp = (await db.execute(hp_stmt)).scalar_one_or_none()

    # 3. Query Patient's Diagnostic Records
    rec_stmt = (
        select(MedicalRecord, Prediction, Doctor, Hospital)
        .join(Prediction, MedicalRecord.prediction_id == Prediction.id)
        .outerjoin(Doctor, MedicalRecord.doctor_id == Doctor.id)
        .outerjoin(Hospital, MedicalRecord.hospital_id == Hospital.id)
        .where(MedicalRecord.patient_id == patient.id)
        .order_by(desc(MedicalRecord.created_at))
    )
    rec_res = await db.execute(rec_stmt)

    # Check redeemed shares for this doctor
    share_rec_stmt = select(RecordShare.record_id).where(RecordShare.to_doctor_id == doctor.id)
    unlocked_share_rec_ids = set((await db.execute(share_rec_stmt)).scalars().all())

    # Check active tokens for this doctor/hospital
    tok_stmt = select(AccessToken).where(
        or_(AccessToken.doctor_id == doctor.id, AccessToken.hospital_id == doctor.hospital_id),
        AccessToken.status == "ACTIVE"
    )
    active_tokens = (await db.execute(tok_stmt)).scalars().all()
    token_map = {}
    for tok in active_tokens:
        if tok.record_id and tok.record_id != "ALL":
            token_map[tok.record_id] = tok.token_code
        else:
            token_map[f"PAT_{tok.patient_id}"] = tok.token_code

    records = []
    for rec, pred, doc, hosp in rec_res.all():
        is_own = (rec.doctor_id == doctor.id)
        is_shared_unlocked = (rec.id in unlocked_share_rec_ids)

        if is_own or is_shared_unlocked:
            is_locked = False
            tok_code = None
        else:
            tok_code = token_map.get(rec.id) or token_map.get(f"PAT_{rec.patient_id}")
            is_locked = True if tok_code is not None else False

        relation_label = "Treated" if is_own else "Shared"

        records.append({
            "record_id": rec.id,
            "record_code": rec.record_code,
            "disease": pred.disease if pred else "Health Diagnostic",
            "result": pred.result if pred else "Pending",
            "confidence": pred.confidence if pred else 0.0,
            "risk_level": pred.risk_level if pred else "Low",
            "doctor_name": doc.name if doc else "Attending Doctor",
            "hospital_name": hosp.name if hosp else "General Hospital",
            "date": format_ist(rec.created_at) if rec.created_at else "Recent",
            "is_locked": is_locked,
            "token_code": tok_code,
            "relation": relation_label
        })

    return {
        "patient": {
            "id": patient.id,
            "patient_code": patient.patient_code,
            "name": patient.name,
            "dob": str(patient.dob) if patient.dob else "N/A",
            "gender": patient.gender,
            "phone": patient.phone,
            "email": patient.email,
            "address": patient.address,
            "created_at": format_ist(patient.created_at) if patient.created_at else "N/A"
        },
        "health_profile": hp,
        "records": records
    }

@router.get("/analysis/form-spec/{disease_key}")
async def get_disease_form_spec(disease_key: str):
    if not os.path.exists(CONFIG_PATH):
        raise HTTPException(status_code=500, detail="Disease configuration file missing.")
    
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        cfg_data = yaml.safe_load(f)

    disease_key = disease_key.lower().replace(" ", "_")
    if disease_key not in cfg_data:
        raise HTTPException(status_code=404, detail=f"Unsupported disease: {disease_key}")

    d_cfg = cfg_data[disease_key]
    return {
        "disease_key": disease_key,
        "disease_name": d_cfg["disease_name"],
        "features": d_cfg["features"]
    }

@router.post("/analysis/predict", response_model=PredictionOut)
async def run_disease_prediction(
    req: PredictionCreate,
    current_user: User = Depends(require_roles(["DOCTOR"])),
    db: AsyncSession = Depends(get_db)
):
    doctor = await get_doctor_entity(current_user, db)

    # 1. Run ML Inference
    result_label, confidence, risk_level, processed_inputs = run_prediction_inference(req.disease_key, req.inputs)

    # 2. Compute SHAP explanations & AI Analysis
    base_val, shap_features, ai_analysis_text = compute_shap_explanations(req.disease_key, req.inputs)

    # Get model ID
    m_stmt = select(AIModel).where(AIModel.disease.ilike(f"%{req.disease_key}%"))
    ai_model = (await db.execute(m_stmt)).scalars().first()
    model_id = ai_model.id if ai_model else None

    # 3. Store Prediction
    prediction = Prediction(
        patient_id=req.patient_id,
        doctor_id=doctor.id,
        model_id=model_id,
        disease=req.disease_key.replace("_", " ").title(),
        result=result_label,
        confidence=confidence,
        risk_level=risk_level
    )
    db.add(prediction)
    await db.flush()

    # Inputs snapshot
    p_input = PredictionInput(prediction_id=prediction.id, inputs=processed_inputs)
    db.add(p_input)

    # AI Analysis text
    p_analysis = PredictionAnalysis(prediction_id=prediction.id, ai_analysis_text=ai_analysis_text)
    db.add(p_analysis)

    # SHAP Explanation
    shap_exp = SHAPExplanation(prediction_id=prediction.id, base_value=base_val)
    db.add(shap_exp)
    await db.flush()

    for sf in shap_features:
        f_entry = SHAPFeature(
            shap_explanation_id=shap_exp.id,
            feature_name=sf["feature_name"],
            patient_value=str(sf["patient_value"]),
            shap_value=sf["shap_value"],
            effect=sf["effect"]
        )
        db.add(f_entry)

    # Link Reports Used
    if req.report_ids:
        for r_id in req.report_ids:
            db.add(PredictionReport(prediction_id=prediction.id, report_id=r_id))

    # 4. Generate Off-chain Medical Record
    rec_code = f"REC-{''.join(random.choices(string.digits, k=5))}"
    hosp_id = doctor.hospital_id or (await db.execute(select(Hospital.id))).scalars().first()

    medical_record = MedicalRecord(
        record_code=rec_code,
        patient_id=req.patient_id,
        doctor_id=doctor.id,
        hospital_id=hosp_id,
        prediction_id=prediction.id
    )
    db.add(medical_record)
    await db.flush()

    # Establish doctor-patient relationship
    rel_stmt = select(PatientDoctorRelationship).where(
        PatientDoctorRelationship.patient_id == req.patient_id,
        PatientDoctorRelationship.doctor_id == doctor.id
    )
    if not (await db.execute(rel_stmt)).scalar_one_or_none():
        db.add(PatientDoctorRelationship(patient_id=req.patient_id, doctor_id=doctor.id))

    # Mark Appointment as COMPLETED if appointment_id or appointment_code was provided
    if req.appointment_id or req.appointment_code:
        apt_query = req.appointment_id or req.appointment_code
        apt_stmt = select(Appointment).where(
            or_(Appointment.id == apt_query, Appointment.appointment_code.ilike(str(apt_query).strip()))
        )
        apt_obj = (await db.execute(apt_stmt)).scalar_one_or_none()
        if apt_obj:
            apt_obj.status = "COMPLETED"

    # Record owned by attending doctor directly; RecordShare not needed for own patients.

    # 5. Compute SHA-256 Fingerprint & Register on Blockchain (Hardhat via Web3.py)
    canonical_dict = {
        "record_code": rec_code,
        "disease": prediction.disease,
        "patient_id": req.patient_id,
        "doctor_id": doctor.id,
        "hospital_id": hosp_id,
        "result": result_label,
        "confidence": confidence,
        "inputs": processed_inputs,
        "timestamp": medical_record.created_at.isoformat()
    }
    sha256_hash = calculate_record_sha256(canonical_dict)

    bc_receipt = blockchain_service.register_record_on_chain(rec_code, sha256_hash)

    blockchain_rec = BlockchainRecord(
        record_id=medical_record.id,
        sha256_hash=sha256_hash,
        tx_hash=bc_receipt["tx_hash"],
        block_number=bc_receipt["block_number"],
        contract_address=bc_receipt["contract_address"],
        network=bc_receipt.get("network", "hardhat")
    )
    db.add(blockchain_rec)

    await db.commit()

    shap_out_features = [
        SHAPFeatureOut(
            feature_name=f["feature_name"],
            patient_value=str(f["patient_value"]),
            shap_value=f["shap_value"],
            effect=f["effect"]
        ) for f in shap_features
    ]

    return PredictionOut(
        prediction_id=prediction.id,
        record_id=medical_record.id,
        record_code=medical_record.record_code,
        disease=prediction.disease,
        result=prediction.result,
        confidence=prediction.confidence,
        risk_level=prediction.risk_level,
        ai_analysis_text=ai_analysis_text,
        shap_explanation=SHAPExplanationOut(base_value=base_val, features=shap_out_features),
        inputs=processed_inputs,
        created_at=prediction.created_at
    )

@router.post("/sharing/send")
async def share_record_with_doctor(
    req: RecordShareCreate,
    current_user: User = Depends(require_roles(["DOCTOR"])),
    db: AsyncSession = Depends(get_db)
):
    doctor = await get_doctor_entity(current_user, db)

    # Validate 6 mandatory AND conditions
    is_valid, msg, token = await validate_token_sharing_conditions(
        db=db,
        token_code=req.token_code,
        patient_id=req.patient_id,
        from_doctor_id=doctor.id,
        from_hospital_id=doctor.hospital_id,
        record_id=req.record_id
    )

    if not is_valid:
        raise HTTPException(status_code=403, detail=f"Record Sharing Blocked: {msg}")

    # Insert RecordShare entry
    share = RecordShare(
        record_id=req.record_id,
        token_id=token.id,
        from_doctor_id=doctor.id,
        from_hospital_id=doctor.hospital_id,
        to_doctor_id=req.to_doctor_id,
        to_hospital_id=req.to_hospital_id
    )
    db.add(share)
    await db.commit()

    return {
        "message": "Record shared successfully with recipient doctor & hospital.",
        "share_id": share.id,
        "token_code": req.token_code
    }

@router.get("/notifications")
async def get_doctor_notifications(
    current_user: User = Depends(require_roles(["DOCTOR"])),
    db: AsyncSession = Depends(get_db)
):
    doctor = await get_doctor_entity(current_user, db)

    dismissed_stmt = select(NotificationDismissal.notification_id).where(NotificationDismissal.user_id == current_user.id)
    dismissed_ids = set((await db.execute(dismissed_stmt)).scalars().all())

    notifications = []

    # Doctor Notification Type 1: Patient Appointment Requests
    apt_stmt = (
        select(Appointment, Patient)
        .join(Patient, Appointment.patient_id == Patient.id)
        .where(Appointment.doctor_id == doctor.id, Appointment.status == "SCHEDULED")
        .order_by(desc(Appointment.created_at))
    )
    apt_res = await db.execute(apt_stmt)

    for apt, pat in apt_res.all():
        notif_id = f"apt_req_{apt.id}"
        if notif_id in dismissed_ids:
            continue
        notifications.append({
            "id": notif_id,
            "type": "APPOINTMENT_REQUEST",
            "category": "Appointment Request",
            "title": "Patient Appointment Request",
            "patient_name": pat.name if pat else "Patient",
            "patient_code": pat.patient_code if pat else "PAT-0000",
            "appointment_date": apt.appointment_date,
            "slot_time": apt.appointment_time or "Scheduled Time",
            "target_disease": apt.reason or apt.target_disease or "General Consultation",
            "created_at": format_ist(apt.created_at) if apt.created_at else "Recent",
            "raw_created_at": apt.created_at or datetime.min,
            "is_redeemed": False
        })

    # Doctor Notification Type 2: Patient Report sharing access tokens
    tok_stmt = (
        select(AccessToken, Patient, Hospital)
        .join(Patient, AccessToken.patient_id == Patient.id)
        .outerjoin(Hospital, AccessToken.hospital_id == Hospital.id)
        .where(
            or_(AccessToken.doctor_id == doctor.id, AccessToken.hospital_id == doctor.hospital_id),
            AccessToken.status == "ACTIVE"
        )
        .order_by(desc(AccessToken.created_at))
    )
    tok_res = await db.execute(tok_stmt)

    redeemed_stmt = select(RecordShare.token_id).where(RecordShare.to_doctor_id == doctor.id)
    redeemed_token_ids = set((await db.execute(redeemed_stmt)).scalars().all())

    for tok, pat, hosp in tok_res.all():
        notif_id = f"tok_share_{tok.id}"
        if notif_id in dismissed_ids:
            continue

        rec_code = "REC-REPORT"
        disease_name = "Diagnostic Report"
        orig_doc_name = "Attending Physician"
        orig_hosp_name = hosp.name if hosp else "External Hospital"

        if tok.record_id and tok.record_id != "ALL":
            rec_stmt = (
                select(MedicalRecord, Prediction, Doctor, Hospital)
                .outerjoin(Prediction, MedicalRecord.prediction_id == Prediction.id)
                .outerjoin(Doctor, MedicalRecord.doctor_id == Doctor.id)
                .outerjoin(Hospital, MedicalRecord.hospital_id == Hospital.id)
                .where(MedicalRecord.id == tok.record_id)
            )
            rec_res = (await db.execute(rec_stmt)).first()
            if rec_res:
                m_rec, pred, o_doc, o_hosp = rec_res
                rec_code = m_rec.record_code
                disease_name = pred.disease if pred else "Health Diagnostic"
                if o_doc:
                    orig_doc_name = o_doc.name
                if o_hosp:
                    orig_hosp_name = o_hosp.name
        else:
            rec_code = "ALL-REPORTS"
            disease_name = "Comprehensive Patient Records"

        is_redeemed = (tok.id in redeemed_token_ids)

        notifications.append({
            "id": notif_id,
            "type": "REPORT_TOKEN_SHARE",
            "category": "Report Shared",
            "title": "Patient Report Access Token",
            "token_code": tok.token_code,
            "patient_name": pat.name if pat else "Patient",
            "patient_code": pat.patient_code if pat else "PAT-0000",
            "disease": disease_name,
            "record_code": rec_code,
            "origin_doctor_name": orig_doc_name,
            "origin_hospital_name": orig_hosp_name,
            "created_at": format_ist(tok.created_at) if tok.created_at else "Recent",
            "raw_created_at": tok.created_at or datetime.min,
            "is_redeemed": is_redeemed,
            "status": tok.status
        })

    notifications.sort(key=lambda x: x.get("raw_created_at") or datetime.min, reverse=True)
    return notifications

@router.post("/notifications/{notification_id}/dismiss")
async def dismiss_doctor_notification(
    notification_id: str,
    current_user: User = Depends(require_roles(["DOCTOR"])),
    db: AsyncSession = Depends(get_db)
):
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

@router.post("/tokens/redeem", response_model=FullRecordViewOut)
async def redeem_patient_access_token(
    req: TokenRedeemRequest,
    current_user: User = Depends(require_roles(["DOCTOR", "HOSPITAL"])),
    db: AsyncSession = Depends(get_db)
):
    token_code_clean = req.token_code.strip()
    stmt = select(AccessToken).where(AccessToken.token_code.ilike(token_code_clean))
    token = (await db.execute(stmt)).scalar_one_or_none()

    if not token:
        raise HTTPException(status_code=404, detail=f"Access Denied: Patient Access Token '{token_code_clean}' does not exist.")

    # 1. Active Status Check
    if token.status != "ACTIVE":
        raise HTTPException(status_code=403, detail=f"Access Denied: Token status is '{token.status}'.")

    # 2. Expiration Check
    if token.expires_at < datetime.utcnow():
        token.status = "EXPIRED"
        await db.commit()
        raise HTTPException(
            status_code=403,
            detail=f"Access Denied: Token '{token.token_code}' expired on {token.expires_at.strftime('%Y-%m-%d %H:%M UTC')}. Request a new token from the patient."
        )

    # 3. Doctor & Hospital Identity Check (Strict Policy Scoping)
    current_doctor = None
    current_hospital = None

    if current_user.role == "DOCTOR":
        doc_stmt = select(Doctor, Hospital).join(Hospital, Doctor.hospital_id == Hospital.id).where(Doctor.user_id == current_user.id)
        doc_res = (await db.execute(doc_stmt)).first()
        if not doc_res:
            raise HTTPException(status_code=403, detail="Access Denied: Doctor profile not found.")
        
        current_doctor, current_hospital = doc_res

        # Check Doctor Matching
        if token.doctor_id and str(token.doctor_id) != str(current_doctor.id):
            intended_doc = (await db.execute(select(Doctor).where(Doctor.id == token.doctor_id))).scalar_one_or_none()
            intended_hosp = (await db.execute(select(Hospital).where(Hospital.id == token.hospital_id))).scalar_one_or_none()
            intended_doc_name = intended_doc.name if intended_doc else "Authorized Physician"
            intended_hosp_name = intended_hosp.name if intended_hosp else "Authorized Hospital"
            raise HTTPException(
                status_code=403,
                detail=f"Access Denied (Cryptographic Policy Enforcement) — This Access Token was bound specifically by the patient to Dr. {intended_doc_name} at {intended_hosp_name}. You are logged in as Dr. {current_doctor.name} ({current_hospital.name}) and are NOT authorized to redeem this report."
            )

        # Check Hospital Matching
        if token.hospital_id and str(token.hospital_id) != str(current_doctor.hospital_id):
            intended_hosp = (await db.execute(select(Hospital).where(Hospital.id == token.hospital_id))).scalar_one_or_none()
            intended_hosp_name = intended_hosp.name if intended_hosp else "Authorized Hospital"
            raise HTTPException(
                status_code=403,
                detail=f"Access Denied — This Access Token is restricted specifically to {intended_hosp_name}."
            )

    elif current_user.role == "HOSPITAL":
        hosp_stmt = select(Hospital).where(Hospital.user_id == current_user.id)
        current_hospital = (await db.execute(hosp_stmt)).scalar_one_or_none()
        if not current_hospital:
            raise HTTPException(status_code=403, detail="Access Denied: Hospital profile not found.")

        if token.hospital_id and str(token.hospital_id) != str(current_hospital.id):
            intended_hosp = (await db.execute(select(Hospital).where(Hospital.id == token.hospital_id))).scalar_one_or_none()
            intended_hosp_name = intended_hosp.name if intended_hosp else "Authorized Hospital"
            raise HTTPException(
                status_code=403,
                detail=f"Access Denied — This token is bound to {intended_hosp_name}. Your organization is not authorized."
            )

    # 4. Determine authorized records
    authorized_record_ids = []
    if token.record_id and token.record_id != "ALL":
        rec_check = (await db.execute(select(MedicalRecord.id).where(MedicalRecord.id == token.record_id))).scalar_one_or_none()
        if rec_check:
            authorized_record_ids.append(rec_check)
    else:
        rec_stmt = select(MedicalRecord.id).where(MedicalRecord.patient_id == token.patient_id).order_by(desc(MedicalRecord.created_at))
        authorized_record_ids = list((await db.execute(rec_stmt)).scalars().all())

    if not authorized_record_ids:
        raise HTTPException(status_code=404, detail="No authorized medical analysis report found for this access token.")

    target_record_id = authorized_record_ids[0]

    # 5. Automatically & permanently save record access for the redeeming doctor in PostgreSQL
    if current_user.role == "DOCTOR" and current_doctor:
        for rec_id in authorized_record_ids:
            # Check if RecordShare entry already exists
            share_stmt = select(RecordShare).where(
                RecordShare.record_id == rec_id,
                RecordShare.to_doctor_id == current_doctor.id
            )
            existing_share = (await db.execute(share_stmt)).scalar_one_or_none()

            rec_orig = (await db.execute(select(MedicalRecord).where(MedicalRecord.id == rec_id))).scalar_one_or_none()
            if rec_orig and rec_orig.doctor_id != current_doctor.id:
                if not existing_share:
                    from_doc_id = rec_orig.doctor_id if rec_orig.doctor_id else current_doctor.id
                    from_hosp_id = rec_orig.hospital_id if rec_orig.hospital_id else current_doctor.hospital_id

                    new_share = RecordShare(
                        record_id=rec_id,
                        token_id=token.id,
                        from_doctor_id=from_doc_id,
                        from_hospital_id=from_hosp_id,
                        to_doctor_id=current_doctor.id,
                        to_hospital_id=current_doctor.hospital_id
                    )
                    db.add(new_share)

        await db.commit()

    from backend.app.api.patients import get_full_record_details
    return await get_full_record_details(record_id=target_record_id, current_user=current_user, db=db)

@router.get("/records")
async def get_doctor_records(
    current_user: User = Depends(require_roles(["DOCTOR"])),
    db: AsyncSession = Depends(get_db)
):
    doctor = await get_doctor_entity(current_user, db)

    # 1. Section 1: Records of patients treated directly by this doctor
    own_stmt = (
        select(MedicalRecord, Prediction, Patient, Hospital)
        .outerjoin(Prediction, MedicalRecord.prediction_id == Prediction.id)
        .outerjoin(Patient, MedicalRecord.patient_id == Patient.id)
        .outerjoin(Hospital, MedicalRecord.hospital_id == Hospital.id)
        .where(MedicalRecord.doctor_id == doctor.id)
        .order_by(desc(MedicalRecord.created_at))
    )
    own_res = await db.execute(own_stmt)
    treated_records = []
    seen_own_ids = set()
    for rec, pred, pat, hosp in own_res.all():
        seen_own_ids.add(rec.id)
        treated_records.append({
            "record_id": rec.id,
            "record_code": rec.record_code,
            "patient_name": pat.name if pat else "Unknown Patient",
            "patient_code": pat.patient_code if pat else "PAT-0000",
            "disease": pred.disease if pred else "Health Diagnostic",
            "result": pred.result if pred else "Pending",
            "confidence": pred.confidence if pred else 0.0,
            "risk_level": pred.risk_level if pred else "Low",
            "date": format_ist(rec.created_at) if rec.created_at else "Recent",
            "source": "Treated Patient",
            "hospital_name": hosp.name if hosp else "My Hospital"
        })

    # 2. Section 2: Shared records accessed strictly via patient sharing token from external patients
    rec_stmt = (
        select(RecordShare, MedicalRecord, Prediction, Patient, Doctor, Hospital)
        .join(MedicalRecord, RecordShare.record_id == MedicalRecord.id)
        .outerjoin(Prediction, MedicalRecord.prediction_id == Prediction.id)
        .outerjoin(Patient, MedicalRecord.patient_id == Patient.id)
        .outerjoin(Doctor, RecordShare.from_doctor_id == Doctor.id)
        .outerjoin(Hospital, RecordShare.from_hospital_id == Hospital.id)
        .where(
            RecordShare.to_doctor_id == doctor.id,
            MedicalRecord.doctor_id != doctor.id
        )
        .order_by(desc(RecordShare.shared_at))
    )
    rec_res = await db.execute(rec_stmt)
    shared_records = []
    seen_shared_ids = set()
    for share, rec, pred, pat, f_doc, f_hosp in rec_res.all():
        if rec.id not in seen_own_ids and rec.id not in seen_shared_ids:
            seen_shared_ids.add(rec.id)

            if f_doc and f_doc.id != doctor.id:
                src_label = f"Shared by Dr. {f_doc.name} ({f_hosp.name if f_hosp else 'External Hospital'})"
            else:
                src_label = "Token-Accessed Record"

            shared_records.append({
                "record_id": rec.id,
                "record_code": rec.record_code,
                "patient_name": pat.name if pat else "External Patient",
                "patient_code": pat.patient_code if pat else "PAT-0000",
                "disease": pred.disease if pred else "Health Diagnostic",
                "result": pred.result if pred else "Pending",
                "confidence": pred.confidence if pred else 0.0,
                "risk_level": pred.risk_level if pred else "Low",
                "date": format_ist(share.shared_at) if share.shared_at else "Recent",
                "source": src_label,
                "hospital_name": f_hosp.name if f_hosp else "External Hospital",
                "is_locked": False,
                "token_code": None
            })

    # Also include AccessTokens bound to this doctor or hospital
    token_stmt = (
        select(AccessToken, Patient, Hospital)
        .join(Patient, AccessToken.patient_id == Patient.id)
        .outerjoin(Hospital, AccessToken.hospital_id == Hospital.id)
        .where(
            or_(AccessToken.doctor_id == doctor.id, AccessToken.hospital_id == doctor.hospital_id),
            AccessToken.status == "ACTIVE"
        )
        .order_by(desc(AccessToken.created_at))
    )
    token_res = await db.execute(token_stmt)
    for tok, pat, hosp in token_res.all():
        if tok.record_id:
            m_recs_stmt = select(MedicalRecord, Prediction).outerjoin(Prediction, MedicalRecord.prediction_id == Prediction.id).where(MedicalRecord.id == tok.record_id)
        else:
            m_recs_stmt = select(MedicalRecord, Prediction).outerjoin(Prediction, MedicalRecord.prediction_id == Prediction.id).where(MedicalRecord.patient_id == tok.patient_id).order_by(desc(MedicalRecord.created_at))
        
        m_recs = (await db.execute(m_recs_stmt)).all()
        for rec, pred in m_recs:
            if rec.id not in seen_own_ids and rec.id not in seen_shared_ids and rec.doctor_id != doctor.id:
                seen_shared_ids.add(rec.id)
                shared_records.append({
                    "record_id": rec.id,
                    "record_code": rec.record_code,
                    "patient_name": pat.name if pat else "External Patient",
                    "patient_code": pat.patient_code if pat else "PAT-0000",
                    "disease": pred.disease if pred else "Health Diagnostic",
                    "result": pred.result if pred else "Pending",
                    "confidence": pred.confidence if pred else 0.0,
                    "risk_level": pred.risk_level if pred else "Low",
                    "date": format_ist(tok.created_at) if tok.created_at else "Recent",
                    "source": f"Token Access ({tok.token_code})",
                    "hospital_name": hosp.name if hosp else "External Hospital",
                    "is_locked": True,
                    "token_code": tok.token_code
                })

    return {
        "treated_records": treated_records,
        "shared_records": shared_records,
        "all_records": treated_records + shared_records
    }

@router.get("/records/{record_id}", response_model=FullRecordViewOut)
async def get_doctor_record_detail(
    record_id: str,
    current_user: User = Depends(require_roles(["DOCTOR"])),
    db: AsyncSession = Depends(get_db)
):
    """Allow a doctor to view full clinical details of any record (own or shared)."""
    from backend.app.api.patients import get_full_record_details
    return await get_full_record_details(record_id=record_id, current_user=current_user, db=db)


class DoctorProfileUpdate(BaseModel):
    name: Optional[str] = None
    specialization: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None

@router.get("/me")
@router.get("/profile/me")
async def get_doctor_profile_me(
    current_user: User = Depends(require_roles(["DOCTOR"])),
    db: AsyncSession = Depends(get_db)
):
    doctor = await get_doctor_entity(current_user, db)
    hospital = (await db.execute(select(Hospital).where(Hospital.id == doctor.hospital_id))).scalar_one_or_none()

    return {
        "id": doctor.id,
        "name": doctor.name,
        "email": current_user.email,
        "specialization": doctor.specialization,
        "department": doctor.department or "General Medicine",
        "license_number": doctor.license_number or "N/A",
        "phone": doctor.phone or "",
        "bio": doctor.bio or "",
        "doctor_code": doctor.doctor_code,
        "hospital_id": doctor.hospital_id,
        "hospital_name": hospital.name if hospital else "Independent Diagnostic Node",
        "must_change_password": current_user.must_change_password
    }

@router.put("/profile/me")
async def update_doctor_profile_me(
    req: DoctorProfileUpdate,
    current_user: User = Depends(require_roles(["DOCTOR"])),
    db: AsyncSession = Depends(get_db)
):
    doctor = await get_doctor_entity(current_user, db)

    if req.name and req.name.strip():
        doctor.name = req.name.strip()
    if req.specialization and req.specialization.strip():
        doctor.specialization = req.specialization.strip()
    if req.department and req.department.strip():
        doctor.department = req.department.strip()
    if req.phone is not None:
        doctor.phone = req.phone.strip()
    if req.bio is not None:
        doctor.bio = req.bio.strip()

    await db.commit()
    return {"message": "Profile updated successfully."}


DEFAULT_DAY_SLOTS = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
    "06:00 PM", "07:00 PM", "08:00 PM"
]

@router.get("/{doctor_id}/availability")
async def get_doctor_slot_availability(
    doctor_id: str,
    date: Optional[str] = None,
    date_str: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    target_date = datetime.utcnow().date()
    raw_date = date or date_str
    if raw_date:
        try:
            target_date = datetime.strptime(raw_date.strip().split("T")[0].split(" ")[0], "%Y-%m-%d").date()
        except Exception:
            pass

    # Fetch configured availabilities for target date
    avail_stmt = select(DoctorAvailability).where(
        DoctorAvailability.doctor_id == doctor_id,
        DoctorAvailability.available_date == target_date
    )
    avails = (await db.execute(avail_stmt)).scalars().all()

    if avails:
        configured_slots = {a.time_slot.strip().upper(): (a.time_slot.strip(), a.is_available) for a in avails}
    else:
        # Fallback to doctor's latest saved preferences across any date
        latest_stmt = select(DoctorAvailability).where(
            DoctorAvailability.doctor_id == doctor_id
        ).order_by(DoctorAvailability.created_at.desc())
        latest_avails = (await db.execute(latest_stmt)).scalars().all()

        if latest_avails:
            configured_slots = {a.time_slot.strip().upper(): (a.time_slot.strip(), a.is_available) for a in latest_avails}
        else:
            configured_slots = {slot.strip().upper(): (slot.strip(), True) for slot in DEFAULT_DAY_SLOTS}

    # Fetch active booked appointments on target date
    target_d_str = str(target_date)
    apt_stmt = select(Appointment).where(
        Appointment.doctor_id == doctor_id,
        Appointment.status != "REJECTED"
    )
    all_doc_apts = (await db.execute(apt_stmt)).scalars().all()
    booked_slots = {}
    for a in all_doc_apts:
        if a.appointment_date:
            a_d_str = str(a.appointment_date).split(" ")[0].split("T")[0]
            if a_d_str == target_d_str and a.appointment_time:
                booked_slots[a.appointment_time.strip().upper()] = a.appointment_time.strip()

    now_local = datetime.now()
    current_date = now_local.date()
    current_time = now_local.time()

    is_past_date = (target_date < current_date)
    is_today = (target_date == current_date)

    # Collect all unique slots
    all_slots_dict = {}
    for s in DEFAULT_DAY_SLOTS:
        all_slots_dict[s.strip().upper()] = s.strip()
    for s_upper, (s_orig, _) in configured_slots.items():
        if s_upper not in all_slots_dict:
            all_slots_dict[s_upper] = s_orig
    for s_upper, s_orig in booked_slots.items():
        if s_upper not in all_slots_dict:
            all_slots_dict[s_upper] = s_orig

    def get_slot_sort_key(slot_str):
        try:
            return datetime.strptime(slot_str.strip(), "%I:%M %p").time()
        except Exception:
            try:
                return datetime.strptime(slot_str.strip(), "%H:%M").time()
            except Exception:
                return datetime.min.time()

    sorted_slots = sorted(all_slots_dict.values(), key=get_slot_sort_key)

    slot_results = []
    for slot in sorted_slots:
        slot_upper = slot.strip().upper()

        slot_time_obj = None
        try:
            slot_time_obj = datetime.strptime(slot.strip(), "%I:%M %p").time()
        except Exception:
            try:
                slot_time_obj = datetime.strptime(slot.strip(), "%H:%M").time()
            except Exception:
                pass

        if is_past_date or (is_today and slot_time_obj and slot_time_obj <= current_time):
            status_label = "PASSED"
        elif slot_upper in booked_slots:
            status_label = "BOOKED"
        elif slot_upper in configured_slots:
            status_label = "AVAILABLE" if configured_slots[slot_upper][1] else "NOT_AVAILABLE"
        else:
            status_label = "AVAILABLE"

        slot_results.append({
            "slot": slot,
            "status": status_label,
            "is_selectable": (status_label == "AVAILABLE")
        })

    return {
        "doctor_id": doctor_id,
        "available_date": str(target_date),
        "slots": slot_results
    }

class SaveAvailabilityRequest(BaseModel):
    available_date: str
    time_slots: List[str]
    apply_all_days: Optional[bool] = True

@router.post("/{doctor_id}/availability")
async def save_doctor_slot_availability(
    doctor_id: str,
    req: SaveAvailabilityRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        target_date = datetime.strptime(req.available_date, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")

    start_dt = datetime.combine(target_date, datetime.min.time())
    end_dt = datetime.combine(target_date, datetime.max.time())

    apt_stmt = select(Appointment).where(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_date >= start_dt,
        Appointment.appointment_date <= end_dt,
        Appointment.status != "REJECTED"
    )
    booked_apts = (await db.execute(apt_stmt)).scalars().all()
    booked_slots = {a.appointment_time.strip().upper(): a.appointment_time.strip() for a in booked_apts if a.appointment_time}

    if req.apply_all_days:
        del_stmt = select(DoctorAvailability).where(DoctorAvailability.doctor_id == doctor_id)
    else:
        del_stmt = select(DoctorAvailability).where(
            DoctorAvailability.doctor_id == doctor_id,
            DoctorAvailability.available_date == target_date
        )

    existing_records = (await db.execute(del_stmt)).scalars().all()
    for rec in existing_records:
        await db.delete(rec)
    await db.flush()

    all_candidate_slots = []
    seen_upper = set()
    for slot in DEFAULT_DAY_SLOTS + req.time_slots + list(booked_slots.values()):
        s_clean = slot.strip()
        s_upper = s_clean.upper()
        if s_upper not in seen_upper:
            seen_upper.add(s_upper)
            all_candidate_slots.append(s_clean)

    req_slots_upper = {s.strip().upper() for s in req.time_slots}

    for slot in all_candidate_slots:
        slot_upper = slot.strip().upper()
        if slot_upper in booked_slots:
            is_avail = True
        else:
            is_avail = (slot_upper in req_slots_upper)

        new_avail = DoctorAvailability(
            doctor_id=doctor_id,
            available_date=target_date,
            time_slot=slot,
            is_available=is_avail
        )
        db.add(new_avail)

    await db.commit()
    return {"message": f"Slot availability saved successfully for {target_date} (Applied to all days: {req.apply_all_days})."}
