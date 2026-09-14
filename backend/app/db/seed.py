import os
import json
import yaml
import asyncio
import urllib.parse
from datetime import datetime, date, timedelta
from sqlalchemy import select, text

from backend.app.core.config import settings
from backend.app.core.database import engine, Base, async_session_maker
from backend.app.core.security import get_password_hash
from backend.app.models.user import User
from backend.app.models.healthcare import Hospital, Doctor, Patient, PatientHealthProfile, PatientDoctorRelationship, MedicalReport
from backend.app.models.ml import AIModel, ModelFeature, ModelTrainingRun, ModelAnalysisResult, Prediction, PredictionInput, PredictionAnalysis, SHAPExplanation, SHAPFeature
from backend.app.models.record import MedicalRecord
from backend.app.models.sharing import AccessToken
from backend.app.models.blockchain import BlockchainRecord
from backend.app.services.canonical_service import calculate_record_sha256

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
CONFIG_PATH = os.path.join(PROJECT_ROOT, "ml", "config", "disease_features.yaml")
ARTIFACTS_DIR = os.path.join(PROJECT_ROOT, "ml", "artifacts")

async def ensure_postgresql_db_exists():
    if "postgresql" in settings.DATABASE_URL:
        try:
            import asyncpg
            url = urllib.parse.urlparse(settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgres://"))
            user = url.username or "postgres"
            password = url.password or "admin"
            host = url.hostname or "localhost"
            port = url.port or 5432
            dbname = url.path.lstrip("/") or "ai_healthsecure"

            conn = await asyncpg.connect(user=user, password=password, host=host, port=port, database="postgres")
            exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname=$1", dbname)
            if not exists:
                await conn.execute(f'CREATE DATABASE "{dbname}"')
                print(f"[PostgreSQL] Created database '{dbname}' in pgAdmin!")
            else:
                print(f"[PostgreSQL] Database '{dbname}' exists in pgAdmin.")
            await conn.close()
        except Exception as e:
            print(f"[PostgreSQL Check Warning]: {e}")

async def seed_database(force_reset: bool = False):
    await ensure_postgresql_db_exists()
    await engine.dispose()
    
    # 1. Ensure tables exist
    async with engine.begin() as conn:
        if force_reset:
            print("[Database] Force Reset Enabled — Dropping & Recreating Schema...")
            if "postgresql" in settings.DATABASE_URL:
                await conn.execute(text("DROP SCHEMA public CASCADE;"))
                await conn.execute(text("CREATE SCHEMA public;"))
            else:
                await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    # 2. Check if database is already populated
    async with async_session_maker() as db:
        if not force_reset:
            try:
                user_count_res = await db.execute(select(User.id))
                existing_users = user_count_res.scalars().all()
                if len(existing_users) > 0:
                    print(f"[Database] Preserving existing database state ({len(existing_users)} registered users retained).")
                    return
            except Exception as e:
                print(f"[Database Init Note]: {e}")

        print("Seeding Users and Healthcare Entities...")

        # 1. Admin Users
        admin_1 = User(email="admin@healthsecure.org", password_hash=get_password_hash("Admin123!"), role="ADMIN", is_active=True)
        admin_2 = User(email="admin@healthsecure.com", password_hash=get_password_hash("Admin@123"), role="ADMIN", is_active=True)
        db.add_all([admin_1, admin_2])

        # 2. Hospital Users & Entities
        hosp_metro_u = User(email="metro@hospital.org", password_hash=get_password_hash("Hospital123!"), role="HOSPITAL")
        hosp_a_u = User(email="city@hospital.org", password_hash=get_password_hash("Hospital123!"), role="HOSPITAL")
        db.add_all([hosp_metro_u, hosp_a_u])
        await db.flush()

        hosp_metro = Hospital(user_id=hosp_metro_u.id, name="Metro General Hospital", address="500 Central Park, Metro City", code="HOSP-1000")
        hosp_a = Hospital(user_id=hosp_a_u.id, name="City General Hospital", address="100 Healthcare Ave, City Center", code="HOSP-1001")
        db.add_all([hosp_metro, hosp_a])
        await db.flush()

        # 3. Doctor Users & Entities
        doc_smith_u = User(email="dr.smith@hospital.org", password_hash=get_password_hash("Doctor123!"), role="DOCTOR")
        doc_rahul_u = User(email="dr.rahul@healthsecure.com", password_hash=get_password_hash("Doc@123"), role="DOCTOR")
        doc_mehta_u = User(email="dr.mehta@healthsecure.com", password_hash=get_password_hash("Doc@123"), role="DOCTOR")
        db.add_all([doc_smith_u, doc_rahul_u, doc_mehta_u])
        await db.flush()

        doc_smith = Doctor(user_id=doc_smith_u.id, hospital_id=hosp_metro.id, name="Dr. John Smith", specialization="Cardiologist & Internal Medicine", doctor_code="DOC-500")
        doc_rahul = Doctor(user_id=doc_rahul_u.id, hospital_id=hosp_a.id, name="Dr. Rahul Sharma", specialization="Endocrinologist & Diabetologist", doctor_code="DOC-501")
        doc_mehta = Doctor(user_id=doc_mehta_u.id, hospital_id=hosp_metro.id, name="Dr. Ananya Mehta", specialization="Nephrologist", doctor_code="DOC-502")
        db.add_all([doc_smith, doc_rahul, doc_mehta])
        await db.flush()

        # 4. Patient Users & Entities
        pat_john_u = User(email="john.doe@gmail.com", password_hash=get_password_hash("Patient123!"), role="PATIENT")
        pat_riya_u = User(email="riya.patel@healthsecure.com", password_hash=get_password_hash("Patient@123"), role="PATIENT")
        pat_amit_u = User(email="amit.kumar@healthsecure.com", password_hash=get_password_hash("Patient@123"), role="PATIENT")
        db.add_all([pat_john_u, pat_riya_u, pat_amit_u])
        await db.flush()

        pat_john = Patient(
            user_id=pat_john_u.id, name="John Doe", dob=date(1988, 3, 20), gender="Male",
            phone="+1-555-0199", email="john.doe@gmail.com", address="742 Evergreen Terrace, Metro City", patient_code="PAT-1000"
        )
        pat_riya = Patient(
            user_id=pat_riya_u.id, name="Riya Patel", dob=date(1991, 5, 14), gender="Female",
            phone="+91-9876543210", email="riya.patel@healthsecure.com", address="Flat 402, Sunshine Towers, City", patient_code="PAT-1025"
        )
        pat_amit = Patient(
            user_id=pat_amit_u.id, name="Amit Kumar", dob=date(1984, 8, 22), gender="Male",
            phone="+91-9876543211", email="amit.kumar@healthsecure.com", address="12 Garden Vista, City", patient_code="PAT-1026"
        )
        db.add_all([pat_john, pat_riya, pat_amit])
        await db.flush()

        # Health Profiles
        db.add(PatientHealthProfile(
            patient_id=pat_john.id, height=175.0, weight=78.0, bmi=25.5, blood_pressure="128/82",
            medical_history="Routine wellness checkups, mild hypertension.", allergies="Pollen", existing_conditions="Pre-diabetes"
        ))
        db.add(PatientHealthProfile(
            patient_id=pat_riya.id, height=165.0, weight=68.0, bmi=25.0, blood_pressure="130/85",
            medical_history="Family history of type 2 diabetes.", allergies="Penicillin", existing_conditions="Mild Hypertension"
        ))
        db.add(PatientHealthProfile(
            patient_id=pat_amit.id, height=178.0, weight=82.0, bmi=25.9, blood_pressure="125/80",
            medical_history="Annual physicals.", allergies="None", existing_conditions="None"
        ))

        # Doctor-Patient Relationships
        db.add_all([
            PatientDoctorRelationship(patient_id=pat_john.id, doctor_id=doc_smith.id),
            PatientDoctorRelationship(patient_id=pat_john.id, doctor_id=doc_rahul.id),
            PatientDoctorRelationship(patient_id=pat_riya.id, doctor_id=doc_rahul.id),
            PatientDoctorRelationship(patient_id=pat_amit.id, doctor_id=doc_mehta.id)
        ])

        # 5. Seed Trained ML Models into AI Model Registry
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                cfg_data = yaml.safe_load(f)

            for disease_key, disease_cfg in cfg_data.items():
                meta_file = os.path.join(ARTIFACTS_DIR, disease_key, "v1.0.0", "metadata.json")
                if not os.path.exists(meta_file):
                    continue
                
                with open(meta_file, "r", encoding="utf-8") as mf:
                    meta = json.load(mf)

                metrics = meta.get("metrics", {})
                ai_m = AIModel(
                    disease=meta["disease"],
                    algorithm=meta["algorithm"],
                    version=meta["version"],
                    feature_count=meta["feature_count"],
                    preprocessing_version=meta["preprocessing_version"],
                    training_date=datetime.fromisoformat(meta["training_date"]),
                    accuracy=metrics.get("accuracy"),
                    precision=metrics.get("precision"),
                    recall=metrics.get("recall"),
                    f1_score=metrics.get("f1_score"),
                    roc_auc=metrics.get("roc_auc"),
                    status="ACTIVE",
                    artifact_path=meta["artifact_path"]
                )
                db.add(ai_m)
                await db.flush()

                # Model Features
                for idx, feat_info in enumerate(disease_cfg["features"]):
                    db.add(ModelFeature(
                        model_id=ai_m.id,
                        feature_name=feat_info["name"],
                        feature_order=idx + 1,
                        data_type=feat_info["type"],
                        unit=feat_info.get("unit"),
                        validation_rules=feat_info
                    ))

                # Model Training Run
                db.add(ModelTrainingRun(
                    model_id=ai_m.id,
                    dataset_name=os.path.basename(disease_cfg["dataset_path"]),
                    dataset_version="v1.0",
                    training_samples=metrics.get("training_samples", 500),
                    testing_samples=metrics.get("testing_samples", 150),
                    accuracy=metrics.get("accuracy"),
                    precision=metrics.get("precision"),
                    recall=metrics.get("recall"),
                    f1_score=metrics.get("f1_score"),
                    roc_auc=metrics.get("roc_auc"),
                    training_duration=metrics.get("duration", 0.2),
                    status="COMPLETED"
                ))

                # Model Analysis Result
                db.add(ModelAnalysisResult(
                    model_id=ai_m.id,
                    confusion_matrix=meta.get("confusion_matrix", []),
                    roc_curve=meta.get("roc_curve", {}),
                    feature_importance=meta.get("feature_importance", {})
                ))

        # Fetch models for prediction seeding
        diabetes_model = (await db.execute(select(AIModel).where(AIModel.disease == "Diabetes"))).scalars().first()
        heart_model = (await db.execute(select(AIModel).where(AIModel.disease == "Heart Disease"))).scalars().first()

        # 6. Seed Demo Predictions & Medical Records for John Doe
        pred_john = Prediction(
            patient_id=pat_john.id,
            doctor_id=doc_smith.id,
            model_id=heart_model.id if heart_model else None,
            disease="Heart Disease",
            result="Moderate Risk of Cardiovascular Disease",
            confidence=82.5,
            risk_level="Moderate"
        )
        db.add(pred_john)
        await db.flush()

        john_inputs = {"age": 52, "sex": 1, "cp": 2, "trestbps": 138.0, "chol": 245.0, "fbs": 0, "restecg": 1, "thalach": 150.0, "exang": 0, "oldpeak": 1.2, "slope": 1, "ca": 0, "thal": 2}
        db.add(PredictionInput(prediction_id=pred_john.id, inputs=john_inputs))
        db.add(PredictionAnalysis(
            prediction_id=pred_john.id,
            ai_analysis_text="Artificial Intelligence Clinical Evaluation for Cardiovascular Risk:\n• Primary contributors: Serum Cholesterol (245.0 mg/dL), Resting BP (138.0 mmHg), ST Depression (1.2).\n• SHAP Base Expected Risk Value: 28.4%."
        ))

        shap_exp_j = SHAPExplanation(prediction_id=pred_john.id, base_value=0.284)
        db.add(shap_exp_j)
        await db.flush()

        db.add_all([
            SHAPFeature(shap_explanation_id=shap_exp_j.id, feature_name="chol", patient_value="245.0 mg/dL", shap_value=0.35, effect="Increased Risk"),
            SHAPFeature(shap_explanation_id=shap_exp_j.id, feature_name="trestbps", patient_value="138.0 mmHg", shap_value=0.18, effect="Increased Risk"),
            SHAPFeature(shap_explanation_id=shap_exp_j.id, feature_name="thalach", patient_value="150.0 bpm", shap_value=-0.12, effect="Decreased Risk")
        ])

        rec_john = MedicalRecord(
            record_code="REC-00100",
            patient_id=pat_john.id,
            doctor_id=doc_smith.id,
            hospital_id=hosp_metro.id,
            prediction_id=pred_john.id
        )
        db.add(rec_john)
        await db.flush()

        canonical_john = {
            "record_code": rec_john.record_code,
            "disease": pred_john.disease,
            "patient_id": pat_john.id,
            "doctor_id": doc_smith.id,
            "hospital_id": hosp_metro.id,
            "result": pred_john.result,
            "confidence": pred_john.confidence,
            "inputs": john_inputs,
            "timestamp": rec_john.created_at.isoformat()
        }
        hash_john = calculate_record_sha256(canonical_john)

        db.add(BlockchainRecord(
            record_id=rec_john.id,
            sha256_hash=hash_john,
            tx_hash=f"0x9a8b7c{hash_john[:32]}",
            block_number=1000,
            contract_address="0x5FbDB2315678afecb367f032d93F642f64180aa3",
            network="hardhat"
        ))

        db.add(AccessToken(
            token_code="PAT-1000-DEMO",
            patient_id=pat_john.id,
            hospital_id=hosp_metro.id,
            doctor_id=doc_smith.id,
            expires_at=datetime.utcnow() + timedelta(hours=48),
            status="ACTIVE"
        ))

        # 7. Seed Demo Predictions & Medical Records for Riya Patel
        pred_riya = Prediction(
            patient_id=pat_riya.id,
            doctor_id=doc_rahul.id,
            model_id=diabetes_model.id if diabetes_model else None,
            disease="Diabetes",
            result="High Risk of Diabetes",
            confidence=87.4,
            risk_level="High"
        )
        db.add(pred_riya)
        await db.flush()

        riya_inputs = {"Pregnancies": 6, "Glucose": 168.0, "BloodPressure": 72.0, "SkinThickness": 35.0, "Insulin": 0.0, "BMI": 33.6, "DiabetesPedigreeFunction": 0.627, "Age": 50}
        db.add(PredictionInput(prediction_id=pred_riya.id, inputs=riya_inputs))
        db.add(PredictionAnalysis(
            prediction_id=pred_riya.id,
            ai_analysis_text="Artificial Intelligence Clinical Analysis for Diabetes:\n• Primary contributors: Glucose (168.0 mg/dL), BMI (33.6 kg/m²), Age (50).\n• SHAP Base Expected Risk Value: 34.8%."
        ))

        shap_exp_r = SHAPExplanation(prediction_id=pred_riya.id, base_value=0.348)
        db.add(shap_exp_r)
        await db.flush()

        db.add_all([
            SHAPFeature(shap_explanation_id=shap_exp_r.id, feature_name="Glucose", patient_value="168.0 mg/dL", shap_value=0.42, effect="Increased Risk"),
            SHAPFeature(shap_explanation_id=shap_exp_r.id, feature_name="BMI", patient_value="33.6 kg/m²", shap_value=0.21, effect="Increased Risk"),
            SHAPFeature(shap_explanation_id=shap_exp_r.id, feature_name="Age", patient_value="50 years", shap_value=0.08, effect="Moderate Effect")
        ])

        rec_riya = MedicalRecord(
            record_code="REC-00125",
            patient_id=pat_riya.id,
            doctor_id=doc_rahul.id,
            hospital_id=hosp_a.id,
            prediction_id=pred_riya.id
        )
        db.add(rec_riya)
        await db.flush()

        canonical_riya = {
            "record_code": rec_riya.record_code,
            "disease": pred_riya.disease,
            "patient_id": pat_riya.id,
            "doctor_id": doc_rahul.id,
            "hospital_id": hosp_a.id,
            "result": pred_riya.result,
            "confidence": pred_riya.confidence,
            "inputs": riya_inputs,
            "timestamp": rec_riya.created_at.isoformat()
        }
        hash_riya = calculate_record_sha256(canonical_riya)

        db.add(BlockchainRecord(
            record_id=rec_riya.id,
            sha256_hash=hash_riya,
            tx_hash=f"0x8f4k92mx{hash_riya[:32]}",
            block_number=1001,
            contract_address="0x5FbDB2315678afecb367f032d93F642f64180aa3",
            network="hardhat"
        ))

        db.add(AccessToken(
            token_code="PAT-8F4K-92MX",
            patient_id=pat_riya.id,
            hospital_id=hosp_a.id,
            doctor_id=doc_rahul.id,
            expires_at=datetime.utcnow() + timedelta(hours=24),
            status="ACTIVE"
        ))

        await db.commit()
        print("Database Seeded Successfully with Full Sample Records & PostgreSQL Support!")

if __name__ == "__main__":
    asyncio.run(seed_database(force_reset=True))
