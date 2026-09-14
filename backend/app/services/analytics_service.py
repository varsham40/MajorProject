from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from typing import Dict, Any, List

from backend.app.models.user import User
from backend.app.models.healthcare import Patient, Doctor, Hospital, MedicalReport, PatientDoctorRelationship, Appointment
from backend.app.models.ml import Prediction, AIModel, ModelTrainingRun, ModelAnalysisResult
from backend.app.models.record import MedicalRecord
from backend.app.models.sharing import AccessToken, RecordShare
from backend.app.models.blockchain import BlockchainRecord
from backend.app.models.verification import VerificationLog

async def get_patient_dashboard_analytics(db: AsyncSession, patient_id: str) -> Dict[str, Any]:
    # KPIs
    total_records = (await db.execute(select(func.count(MedicalRecord.id)).where(MedicalRecord.patient_id == patient_id))).scalar_one()
    total_predictions = (await db.execute(select(func.count(Prediction.id)).where(Prediction.patient_id == patient_id))).scalar_one()
    uploaded_reports = (await db.execute(select(func.count(MedicalReport.id)).where(MedicalReport.patient_id == patient_id))).scalar_one()
    shared_records = (await db.execute(select(func.count(RecordShare.id)).join(MedicalRecord).where(MedicalRecord.patient_id == patient_id))).scalar_one()
    active_tokens = (await db.execute(select(func.count(AccessToken.id)).where(AccessToken.patient_id == patient_id, AccessToken.status == "ACTIVE"))).scalar_one()

    # Recent checkups (predictions)
    stmt = (
        select(Prediction, Doctor.name, Hospital.name)
        .join(Doctor, Prediction.doctor_id == Doctor.id)
        .outerjoin(Hospital, Doctor.hospital_id == Hospital.id)
        .where(Prediction.patient_id == patient_id)
        .order_by(desc(Prediction.created_at))
        .limit(5)
    )
    res = await db.execute(stmt)
    recent_checkups = []
    for pred, doc_name, hosp_name in res.all():
        recent_checkups.append({
            "id": pred.id,
            "disease": pred.disease,
            "result": pred.result,
            "confidence": pred.confidence,
            "risk_level": pred.risk_level,
            "doctor_name": doc_name,
            "hospital_name": hosp_name or "General Hospital",
            "date": pred.created_at.strftime("%d %b %Y")
        })

    return {
        "kpis": {
            "total_checkups": total_predictions,
            "total_records": total_records,
            "uploaded_reports": uploaded_reports,
            "shared_records": shared_records,
            "active_tokens": active_tokens
        },
        "recent_checkups": recent_checkups
    }

async def get_doctor_dashboard_analytics(db: AsyncSession, doctor_id: str) -> Dict[str, Any]:
    doctor = (await db.execute(select(Doctor).where(Doctor.id == doctor_id))).scalar_one_or_none()
    hosp_id = doctor.hospital_id if doctor else None

    # Authorized patient IDs for this doctor
    rel_pats = select(PatientDoctorRelationship.patient_id).where(PatientDoctorRelationship.doctor_id == doctor_id)
    rec_pats = select(MedicalRecord.patient_id).where(MedicalRecord.doctor_id == doctor_id)
    apt_pats = select(Appointment.patient_id).where(Appointment.doctor_id == doctor_id)
    share_pats = (
        select(MedicalRecord.patient_id)
        .join(RecordShare, RecordShare.record_id == MedicalRecord.id)
        .where(RecordShare.to_doctor_id == doctor_id)
    )
    tok_pats = select(AccessToken.patient_id).where(
        or_(AccessToken.doctor_id == doctor_id, AccessToken.hospital_id == hosp_id)
    )

    doc_patient_ids = set()
    doc_patient_ids.update((await db.execute(rel_pats)).scalars().all())
    doc_patient_ids.update((await db.execute(rec_pats)).scalars().all())
    doc_patient_ids.update((await db.execute(apt_pats)).scalars().all())
    doc_patient_ids.update((await db.execute(share_pats)).scalars().all())
    doc_patient_ids.update((await db.execute(tok_pats)).scalars().all())

    total_patients = len(doc_patient_ids)

    # Collect prediction IDs belonging to or received by this doctor
    own_preds_stmt = select(Prediction.id).where(Prediction.doctor_id == doctor_id)
    own_pred_ids = set((await db.execute(own_preds_stmt)).scalars().all())

    # Count of analyses performed directly by this doctor
    total_analyses = len(own_pred_ids)

    records_created = (await db.execute(select(func.count(MedicalRecord.id)).where(MedicalRecord.doctor_id == doctor_id))).scalar_one()
    records_received = (await db.execute(select(func.count(RecordShare.id)).where(RecordShare.to_doctor_id == doctor_id))).scalar_one()

    # Dynamic disease chart strictly for analyses conducted by this doctor (treatments done)
    if own_pred_ids:
        disease_stmt = (
            select(Prediction.disease, func.count(Prediction.id))
            .where(Prediction.id.in_(own_pred_ids))
            .group_by(Prediction.disease)
        )
        disease_counts = dict((await db.execute(disease_stmt)).all())
    else:
        disease_counts = {}

    disease_chart = [
        {"disease": d, "count": c} for d, c in disease_counts.items()
    ]

    return {
        "kpis": {
            "total_patients": total_patients,
            "total_analyses": total_analyses,
            "records_created": records_created,
            "records_received": records_received
        },
        "disease_chart": disease_chart
    }

async def get_admin_dashboard_analytics(db: AsyncSession) -> Dict[str, Any]:
    total_patients = (await db.execute(select(func.count(Patient.id)))).scalar_one()
    total_doctors = (await db.execute(select(func.count(Doctor.id)))).scalar_one()
    total_hospitals = (await db.execute(select(func.count(Hospital.id)))).scalar_one()
    total_records = (await db.execute(select(func.count(MedicalRecord.id)))).scalar_one()
    total_predictions = (await db.execute(select(func.count(Prediction.id)))).scalar_one()
    total_shares = (await db.execute(select(func.count(RecordShare.id)))).scalar_one()
    blockchain_registered = (await db.execute(select(func.count(BlockchainRecord.id)))).scalar_one()
    verified_logs = (await db.execute(select(func.count(VerificationLog.id)))).scalar_one()
    match_count = (await db.execute(select(func.count(VerificationLog.id)).where(VerificationLog.result == "MATCH"))).scalar_one()
    mismatch_count = (await db.execute(select(func.count(VerificationLog.id)).where(VerificationLog.result == "MISMATCH"))).scalar_one()

    # Models metrics
    models_res = (await db.execute(select(AIModel))).scalars().all()
    model_metrics_chart = []
    for m in models_res:
        model_metrics_chart.append({
            "disease": m.disease,
            "accuracy": round((m.accuracy or 0) * 100, 1),
            "precision": round((m.precision or 0) * 100, 1),
            "recall": round((m.recall or 0) * 100, 1),
            "f1_score": round((m.f1_score or 0) * 100, 1),
            "roc_auc": round((m.roc_auc or 0) * 100, 1)
        })

    return {
        "kpis": {
            "total_patients": total_patients,
            "total_doctors": total_doctors,
            "total_hospitals": total_hospitals,
            "total_records": total_records,
            "total_predictions": total_predictions,
            "total_shares": total_shares,
            "blockchain_registered": blockchain_registered,
            "verified_logs": verified_logs,
            "verification_matches": match_count,
            "verification_failures": mismatch_count
        },
        "model_metrics_chart": model_metrics_chart
    }
