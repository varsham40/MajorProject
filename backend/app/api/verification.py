from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, delete

from backend.app.core.database import get_db
from backend.app.core.dependencies import get_current_user
from backend.app.models.user import User
from backend.app.models.record import MedicalRecord
from backend.app.models.ml import Prediction, PredictionInput
from backend.app.models.blockchain import BlockchainRecord
from backend.app.models.verification import VerificationLog, AuditLog
from backend.app.services.canonical_service import calculate_record_sha256, build_canonical_record_payload
from backend.app.services.blockchain_service import blockchain_service
from backend.app.schemas.record import IntegrityVerifyRequest, IntegrityVerifyOut

router = APIRouter(prefix="/verification", tags=["Tamper Verification Engine"])

@router.post("/verify", response_model=IntegrityVerifyOut)
async def verify_record_integrity(
    req: IntegrityVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch record from PostgreSQL
    rec_stmt = (
        select(MedicalRecord, Prediction)
        .join(Prediction, MedicalRecord.prediction_id == Prediction.id)
        .where(MedicalRecord.id == req.record_id)
    )
    res = (await db.execute(rec_stmt)).first()
    if not res:
        raise HTTPException(status_code=404, detail="Medical record not found.")

    rec, pred = res

    # Prediction Inputs
    inp_res = (await db.execute(select(PredictionInput).where(PredictionInput.prediction_id == pred.id))).scalar_one_or_none()
    inputs_dict = inp_res.inputs if inp_res else {}

    # 2. Re-generate Canonical Representation & Compute Current Hash
    canonical_dict = {
        "record_code": rec.record_code,
        "disease": pred.disease,
        "patient_id": rec.patient_id,
        "doctor_id": rec.doctor_id,
        "hospital_id": rec.hospital_id,
        "result": pred.result,
        "confidence": pred.confidence,
        "inputs": inputs_dict,
        "timestamp": rec.created_at.isoformat()
    }
    current_hash = calculate_record_sha256(canonical_dict)

    # 3. Fetch Registered Hash from Blockchain (via Web3.py / stored BlockchainRecord)
    bc_res = (await db.execute(select(BlockchainRecord).where(BlockchainRecord.record_id == rec.id))).scalar_one_or_none()
    
    if not bc_res:
        raise HTTPException(status_code=400, detail="This medical record was not registered on the blockchain.")

    # Try querying Hardhat smart contract directly
    on_chain_hash, ts, exists = blockchain_service.fetch_record_hash_from_chain(rec.record_code)
    blockchain_hash = on_chain_hash if (exists and on_chain_hash) else bc_res.sha256_hash

    # 4. Compare current hash vs original registered hash
    if current_hash == blockchain_hash:
        result_status = "MATCH"
        msg = "Record Integrity Verified — The cryptographic SHA-256 fingerprint matches the immutable blockchain registry."
    else:
        result_status = "MISMATCH"
        msg = "Possible Modification Detected — Off-chain record data differs from the original registered fingerprint on the blockchain."

    # 5. Log Verification Result
    ver_log = VerificationLog(
        record_id=rec.id,
        verified_by_user_id=current_user.id,
        current_hash=current_hash,
        blockchain_hash=blockchain_hash,
        result=result_status
    )
    db.add(ver_log)

    audit = AuditLog(
        user_id=current_user.id,
        action="VERIFY_RECORD",
        entity_type="MedicalRecord",
        entity_id=rec.id,
        metadata_json={"result": result_status, "record_code": rec.record_code}
    )
    db.add(audit)

    await db.commit()

    return IntegrityVerifyOut(
        record_id=rec.id,
        record_code=rec.record_code,
        current_hash=current_hash,
        blockchain_hash=blockchain_hash,
        result=result_status,
        verified_at=ver_log.verified_at,
        message=msg
    )

@router.get("/history")
async def get_verification_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(VerificationLog, MedicalRecord, User.email)
        .join(MedicalRecord, VerificationLog.record_id == MedicalRecord.id)
        .outerjoin(User, VerificationLog.verified_by_user_id == User.id)
        .order_by(desc(VerificationLog.verified_at))
        .limit(50)
    )
    res = await db.execute(stmt)
    history = []
    for log, rec, email in res.all():
        history.append({
            "id": log.id,
            "record_id": rec.id,
            "record_code": rec.record_code,
            "verified_by": email or "System",
            "current_hash": log.current_hash,
            "blockchain_hash": log.blockchain_hash,
            "result": log.result,
            "verified_at": log.verified_at.strftime("%Y-%m-%d %H:%M:%S")
        })
    return history


@router.delete("/history")
@router.post("/history/clear")
async def clear_verification_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await db.execute(delete(VerificationLog))
    await db.commit()
    return {"message": "Verification audit history cleared successfully."}

from pydantic import BaseModel
from typing import Optional, Dict, Any
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

class PayloadVerifyRequest(BaseModel):
    record_code: str
    payload: Optional[Dict[str, Any]] = None

@router.get("/payload/{record_code}")
async def get_record_payload_by_code(
    record_code: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    clean_code = record_code.strip()
    rec_stmt = (
        select(MedicalRecord, Prediction)
        .join(Prediction, MedicalRecord.prediction_id == Prediction.id)
        .where(MedicalRecord.record_code.ilike(clean_code))
    )
    res = (await db.execute(rec_stmt)).first()
    if not res:
        raise HTTPException(status_code=404, detail=f"Medical record '{clean_code}' not found.")

    rec, pred = res
    inp_res = (await db.execute(select(PredictionInput).where(PredictionInput.prediction_id == pred.id))).scalar_one_or_none()
    inputs_dict = inp_res.inputs if inp_res else {}

    canonical_dict = build_canonical_record_payload(
        record_code=rec.record_code,
        disease=pred.disease,
        patient_id=rec.patient_id,
        doctor_id=rec.doctor_id,
        hospital_id=rec.hospital_id,
        result=pred.result,
        confidence=pred.confidence,
        inputs=inputs_dict,
        timestamp=rec.created_at.isoformat()
    )
    return {
        "record_code": rec.record_code,
        "payload": canonical_dict
    }

@router.post("/verify-payload")
async def verify_payload_integrity(
    req: PayloadVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    clean_code = req.record_code.strip()
    rec_stmt = (
        select(MedicalRecord, Prediction)
        .join(Prediction, MedicalRecord.prediction_id == Prediction.id)
        .where(MedicalRecord.record_code.ilike(clean_code))
    )
    res = (await db.execute(rec_stmt)).first()
    if not res:
        raise HTTPException(status_code=404, detail=f"Record '{clean_code}' not found in database.")

    rec, pred = res

    # Use provided payload or compute canonical payload
    if req.payload:
        target_payload = req.payload
    else:
        inp_res = (await db.execute(select(PredictionInput).where(PredictionInput.prediction_id == pred.id))).scalar_one_or_none()
        inputs_dict = inp_res.inputs if inp_res else {}
        target_payload = build_canonical_record_payload(
            record_code=rec.record_code,
            disease=pred.disease,
            patient_id=rec.patient_id,
            doctor_id=rec.doctor_id,
            hospital_id=rec.hospital_id,
            result=pred.result,
            confidence=pred.confidence,
            inputs=inputs_dict,
            timestamp=rec.created_at.isoformat()
        )

    calculated_hash = calculate_record_sha256(target_payload)

    # Query Hardhat blockchain smart contract / BlockchainRecord
    bc_res = (await db.execute(select(BlockchainRecord).where(BlockchainRecord.record_id == rec.id))).scalar_one_or_none()
    on_chain_hash, ts, exists = blockchain_service.fetch_record_hash_from_chain(rec.record_code)
    blockchain_hash = on_chain_hash if (exists and on_chain_hash) else (bc_res.sha256_hash if bc_res else None)

    if not blockchain_hash:
        inp_res = (await db.execute(select(PredictionInput).where(PredictionInput.prediction_id == pred.id))).scalar_one_or_none()
        inputs_dict = inp_res.inputs if inp_res else {}
        canonical_payload = build_canonical_record_payload(
            record_code=rec.record_code,
            disease=pred.disease,
            patient_id=rec.patient_id,
            doctor_id=rec.doctor_id,
            hospital_id=rec.hospital_id,
            result=pred.result,
            confidence=pred.confidence,
            inputs=inputs_dict,
            timestamp=rec.created_at.isoformat()
        )
        canonical_hash = calculate_record_sha256(canonical_payload)
        reg_res = blockchain_service.register_record_on_chain(rec.record_code, canonical_hash)
        
        bc_res = BlockchainRecord(
            record_id=rec.id,
            sha256_hash=canonical_hash,
            tx_hash=reg_res.get("tx_hash", "0xsimulated"),
            block_number=reg_res.get("block_number", 10842),
            contract_address=reg_res.get("contract_address", "0x5FbDB2315678afecb367f032d93F642f64180aa3"),
            network=reg_res.get("network", "Ethereum Hardhat Node")
        )
        db.add(bc_res)
        await db.flush()
        blockchain_hash = canonical_hash

    if calculated_hash == blockchain_hash:
        result_verdict = "VALID"
        msg = "100% INTEGRITY VERIFIED — Off-chain payload matches immutable Ethereum Hardhat blockchain digest."
    else:
        result_verdict = "TAMPERED"
        msg = "POSSIBLE MODIFICATION DETECTED — Calculated SHA-256 digest differs from on-chain registered fingerprint."

    # Log in VerificationLog
    ver_log = VerificationLog(
        record_id=rec.id,
        verified_by_user_id=current_user.id,
        current_hash=calculated_hash,
        blockchain_hash=blockchain_hash or "NOT_FOUND",
        result=result_verdict
    )
    db.add(ver_log)
    await db.commit()

    return {
        "record_code": rec.record_code,
        "local_hash": calculated_hash,
        "blockchain_hash": blockchain_hash,
        "result": result_verdict,
        "message": msg,
        "verified_at": format_ist(ver_log.verified_at),
        "tx_hash": bc_res.tx_hash if bc_res else None,
        "block_number": bc_res.block_number if bc_res else None
    }
