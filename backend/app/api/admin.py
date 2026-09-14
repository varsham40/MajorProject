from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_, and_

from backend.app.core.database import get_db
from backend.app.core.dependencies import require_roles
from backend.app.models.user import User
from backend.app.models.healthcare import Hospital, Doctor, Patient
from backend.app.models.ml import AIModel, ModelTrainingRun, ModelAnalysisResult
from backend.app.models.blockchain import BlockchainRecord
from backend.app.models.verification import VerificationLog, AuditLog
from backend.app.services.analytics_service import get_admin_dashboard_analytics

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@router.get("/analytics")
async def get_admin_analytics(
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    return await get_admin_dashboard_analytics(db)

@router.get("/users")
async def list_all_users(
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).order_by(desc(User.created_at))
    users = (await db.execute(stmt)).scalars().all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for u in users
    ]

@router.get("/directory/patients")
async def get_directory_patients(
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Patient, User)
        .join(User, Patient.user_id == User.id)
        .order_by(desc(Patient.created_at))
    )
    res = await db.execute(stmt)
    patients_list = []
    for pat, usr in res.all():
        patients_list.append({
            "id": pat.id,
            "patient_code": pat.patient_code,
            "name": pat.name,
            "email": usr.email,
            "phone": pat.phone or "N/A",
            "gender": pat.gender,
            "dob": str(pat.dob),
            "address": pat.address or "N/A",
            "is_active": usr.is_active,
            "created_at": pat.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return patients_list

@router.get("/directory/hospitals-doctors")
async def get_directory_hospitals_doctors(
    current_user: User = Depends(require_roles(["ADMIN", "DOCTOR", "HOSPITAL"])),
    db: AsyncSession = Depends(get_db)
):
    h_stmt = select(Hospital, User).join(User, Hospital.user_id == User.id).order_by(Hospital.name)
    h_res = await db.execute(h_stmt)
    
    result = []
    for hosp, h_usr in h_res.all():
        d_stmt = select(Doctor, User).join(User, Doctor.user_id == User.id).where(Doctor.hospital_id == hosp.id).order_by(Doctor.name)
        d_res = await db.execute(d_stmt)
        
        docs_list = []
        for doc, d_usr in d_res.all():
            docs_list.append({
                "id": doc.id,
                "doctor_code": doc.doctor_code,
                "name": doc.name,
                "specialization": doc.specialization,
                "email": d_usr.email,
                "is_active": d_usr.is_active,
                "created_at": doc.created_at.strftime("%Y-%m-%d %H:%M")
            })
        
        result.append({
            "hospital_id": hosp.id,
            "hospital_name": hosp.name,
            "hospital_code": hosp.code,
            "address": hosp.address,
            "email": h_usr.email,
            "total_doctors": len(docs_list),
            "doctors": docs_list
        })
        
    return result

@router.post("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: str,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.id == user_id)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_active = not user.is_active
    await db.commit()
    return {"message": f"User status updated to {'active' if user.is_active else 'disabled'}.", "is_active": user.is_active}

@router.get("/model-registry")
async def get_model_registry(
    current_user: User = Depends(require_roles(["ADMIN", "DOCTOR"])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AIModel).order_by(AIModel.disease)
    models = (await db.execute(stmt)).scalars().all()
    return models

@router.get("/model-training")
async def get_model_training_history(
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ModelTrainingRun, AIModel.disease).join(AIModel, ModelTrainingRun.model_id == AIModel.id).order_by(desc(ModelTrainingRun.created_at))
    res = await db.execute(stmt)
    runs = []
    for run, disease in res.all():
        runs.append({
            "id": run.id,
            "disease": disease,
            "dataset_name": run.dataset_name,
            "dataset_version": run.dataset_version,
            "training_samples": run.training_samples,
            "testing_samples": run.testing_samples,
            "accuracy": run.accuracy,
            "precision": run.precision,
            "recall": run.recall,
            "f1_score": run.f1_score,
            "roc_auc": run.roc_auc,
            "training_duration": run.training_duration,
            "status": run.status,
            "created_at": run.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return runs

DISEASE_KEY_MAP = {
    "diabetes": ("diabetes", "Diabetes"),
    "heart_disease": ("heart_disease", "Heart Disease"),
    "heart": ("heart_disease", "Heart Disease"),
    "kidney_disease": ("kidney_disease", "Kidney Disease"),
    "kidney": ("kidney_disease", "Kidney Disease"),
    "liver_disease": ("liver_disease", "Liver Disease"),
    "liver": ("liver_disease", "Liver Disease"),
    "thyroid_disease": ("thyroid_disease", "Thyroid Disease"),
    "thyroid": ("thyroid_disease", "Thyroid Disease")
}

@router.get("/model-analysis/{disease_key}")
async def get_model_analysis(
    disease_key: str,
    current_user: User = Depends(require_roles(["ADMIN", "DOCTOR"])),
    db: AsyncSession = Depends(get_db)
):
    import json
    import os
    from datetime import datetime
    from backend.app.core.config import settings

    key_clean = disease_key.lower().strip().replace(" ", "_")
    norm_key, norm_name = DISEASE_KEY_MAP.get(key_clean, (key_clean, disease_key.title()))

    stmt = (
        select(ModelAnalysisResult, AIModel)
        .join(AIModel, ModelAnalysisResult.model_id == AIModel.id)
        .where(or_(AIModel.disease == norm_name, AIModel.disease.ilike(f"%{norm_key.replace('_', '%')}%")))
    )
    res = (await db.execute(stmt)).first()

    if not res:
        # Check if trained artifact metadata exists on disk
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        meta_path = os.path.join(project_root, "ml", "artifacts", norm_key, "v1.0.0", "metadata.json")
        if not os.path.exists(meta_path):
            meta_path = os.path.join(project_root, "ml", "artifacts", norm_key, "v1.0", "metadata.json")

        if not os.path.exists(meta_path):
            # Auto-trigger model training pipeline using dataset
            try:
                from ml.training.train_all import load_config, preprocess_and_train
                config = load_config()
                if norm_key in config:
                    preprocess_and_train(norm_key, config[norm_key], algorithm_name="RandomForestClassifier")
            except Exception as tr_err:
                print(f"[Auto Training Error]: {tr_err}")

        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8") as f:
                meta_dict = json.load(f)

            m_stmt = select(AIModel).where(AIModel.disease == norm_name)
            ai_m = (await db.execute(m_stmt)).scalars().first()
            if not ai_m:
                ai_m = AIModel(
                    disease=norm_name,
                    algorithm=meta_dict.get("algorithm", "RandomForestClassifier"),
                    version=meta_dict.get("version", "v1.0.0"),
                    feature_count=meta_dict.get("feature_count", 10),
                    preprocessing_version="v1.0",
                    training_date=datetime.utcnow(),
                    accuracy=meta_dict["metrics"]["accuracy"],
                    precision=meta_dict["metrics"]["precision"],
                    recall=meta_dict["metrics"]["recall"],
                    f1_score=meta_dict["metrics"]["f1_score"],
                    roc_auc=meta_dict["metrics"]["roc_auc"],
                    status="ACTIVE",
                    artifact_path=os.path.join("ml", "artifacts", norm_key, meta_dict.get("version", "v1.0.0"), "model_bundle.joblib")
                )
                db.add(ai_m)
                await db.flush()

            ana_stmt = select(ModelAnalysisResult).where(ModelAnalysisResult.model_id == ai_m.id)
            ana_res = (await db.execute(ana_stmt)).scalars().first()
            if not ana_res:
                ana_res = ModelAnalysisResult(
                    model_id=ai_m.id,
                    confusion_matrix=meta_dict["confusion_matrix"],
                    roc_curve=meta_dict["roc_curve"],
                    feature_importance=meta_dict["feature_importance"]
                )
                db.add(ana_res)
            else:
                ana_res.confusion_matrix = meta_dict["confusion_matrix"]
                ana_res.roc_curve = meta_dict["roc_curve"]
                ana_res.feature_importance = meta_dict["feature_importance"]

            await db.commit()
            res = (ana_res, ai_m)

    if not res:
        raise HTTPException(status_code=404, detail=f"Analysis results for '{disease_key}' not found.")

    analysis, model = res
    return {
        "disease": model.disease,
        "algorithm": model.algorithm,
        "version": model.version,
        "metrics": {
            "accuracy": model.accuracy,
            "precision": model.precision,
            "recall": model.recall,
            "f1_score": model.f1_score,
            "roc_auc": model.roc_auc
        },
        "confusion_matrix": analysis.confusion_matrix,
        "roc_curve": analysis.roc_curve,
        "feature_importance": analysis.feature_importance
    }

@router.get("/blockchain")
async def get_blockchain_ledger(
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(BlockchainRecord).order_by(desc(BlockchainRecord.registered_at))
    recs = (await db.execute(stmt)).scalars().all()
    return recs

@router.post("/models/train")
async def trigger_model_training(
    disease_key: str = Form(...),
    algorithm: Optional[str] = Form("RandomForestClassifier"),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    from backend.app.core.config import settings
    from ml.training.train_all import load_config, preprocess_and_train
    import os
    import time
    from datetime import datetime

    config = load_config()
    clean_key = disease_key.lower().strip().replace(" ", "_")
    if clean_key not in config:
        raise HTTPException(status_code=400, detail=f"Invalid disease '{disease_key}'. Available: {list(config.keys())}")

    disease_cfg = config[clean_key]

    custom_csv_path = None
    if file and file.filename:
        custom_filename = f"custom_{clean_key}_{int(time.time())}_{file.filename}"
        custom_csv_path = os.path.join(settings.UPLOAD_DIR, custom_filename)
        content = await file.read()
        with open(custom_csv_path, "wb") as f:
            f.write(content)

    try:
        bundle = preprocess_and_train(clean_key, disease_cfg, custom_csv_path=custom_csv_path, algorithm_name=algorithm)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Training pipeline execution failed: {str(e)}")

    metrics = bundle["metrics"]
    disease_name = disease_cfg["disease_name"]

    stmt = select(AIModel).where(AIModel.disease == disease_name)
    ai_m = (await db.execute(stmt)).scalars().first()

    if not ai_m:
        ai_m = AIModel(
            disease=disease_name,
            algorithm=algorithm,
            version=bundle["version"],
            feature_count=len(bundle["feature_names"]),
            preprocessing_version="v1.0",
            training_date=datetime.utcnow(),
            accuracy=metrics["accuracy"],
            precision=metrics["precision"],
            recall=metrics["recall"],
            f1_score=metrics["f1_score"],
            roc_auc=metrics["roc_auc"],
            status="ACTIVE",
            artifact_path=os.path.join("ml", "artifacts", clean_key, bundle["version"], "model_bundle.joblib")
        )
        db.add(ai_m)
        await db.flush()
    else:
        ai_m.algorithm = algorithm
        ai_m.accuracy = metrics["accuracy"]
        ai_m.precision = metrics["precision"]
        ai_m.recall = metrics["recall"]
        ai_m.f1_score = metrics["f1_score"]
        ai_m.roc_auc = metrics["roc_auc"]
        ai_m.training_date = datetime.utcnow()
        await db.flush()

    training_run = ModelTrainingRun(
        model_id=ai_m.id,
        dataset_name=bundle["dataset_name"],
        dataset_version="v1.0",
        training_samples=metrics["training_samples"],
        testing_samples=metrics["testing_samples"],
        accuracy=metrics["accuracy"],
        precision=metrics["precision"],
        recall=metrics["recall"],
        f1_score=metrics["f1_score"],
        roc_auc=metrics["roc_auc"],
        training_duration=metrics["duration"],
        status="COMPLETED"
    )
    db.add(training_run)

    ana_stmt = select(ModelAnalysisResult).where(ModelAnalysisResult.model_id == ai_m.id)
    analysis_res = (await db.execute(ana_stmt)).scalars().first()
    if analysis_res:
        analysis_res.confusion_matrix = bundle["confusion_matrix"]
        analysis_res.roc_curve = bundle["roc_curve"]
        analysis_res.feature_importance = bundle["feature_importance"]
    else:
        db.add(ModelAnalysisResult(
            model_id=ai_m.id,
            confusion_matrix=bundle["confusion_matrix"],
            roc_curve=bundle["roc_curve"],
            feature_importance=bundle["feature_importance"]
        ))

    await db.commit()

    artifacts_dir = os.path.join("ml", "artifacts", clean_key, bundle["version"])
    return {
        "message": f"Successfully trained model for {disease_name}!",
        "disease": disease_name,
        "disease_key": clean_key,
        "algorithm": algorithm,
        "metrics": metrics,
        "dataset_name": bundle["dataset_name"],
        "artifacts_saved": {
            "model_pkl": os.path.join(artifacts_dir, "model.pkl"),
            "scaler_pkl": os.path.join(artifacts_dir, "scaler.pkl"),
            "shap_pkl": os.path.join(artifacts_dir, "shap_explainer.pkl"),
            "joblib_bundle": os.path.join(artifacts_dir, "model_bundle.joblib")
        }
    }
