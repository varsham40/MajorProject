# AI HealthSecure — Implementation Documentation for Antigravity

**Purpose of this document:** This is a build specification for Antigravity to implement AI HealthSecure end-to-end — an explainable AI + blockchain-based healthcare platform for disease prediction, medical record management, consent-based sharing, and integrity verification. It translates the master project requirements into a concrete tech stack, repository structure, database schema, phased build plan, and acceptance criteria so the system can be built correctly from scratch.

**Core principle (do not deviate):** `Predict → Explain → Record → Secure → Authorize → Share → Verify`

**Mandatory rule across the entire application:** No static or hardcoded chart/KPI values anywhere in the final application. Every number, chart, and table must be computed from real database rows, real prediction results, and real model-training metrics.

---

## 1. Tech Stack

### Frontend
| Component | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Data fetching / caching | TanStack Query (React Query) |
| Client state (auth/role) | Zustand |
| Routing | React Router v6 (role-guarded routes) |
| Forms & validation | React Hook Form + Zod |
| Charts | Recharts |
| Icons | lucide-react |

### Backend
| Component | Choice |
|---|---|
| Framework | FastAPI (Python 3.11+) |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Validation | Pydantic v2 |
| Auth | JWT (access + refresh) via `python-jose`, password hashing via `passlib[bcrypt]` |
| Config/secrets | `pydantic-settings` + `.env` |
| Server | Uvicorn (Gunicorn workers in production-like runs) |
| Background jobs (optional but recommended) | Celery + Redis, for non-blocking blockchain registration |

### Database
- **PostgreSQL 15+**, with JSONB columns for variable-shape data (`prediction_inputs`, `shap_features`, `model_features`) so disease-specific fields don't require schema changes per disease.

### AI / ML
| Component | Choice |
|---|---|
| Model training | scikit-learn (XGBoost/LightGBM as drop-in upgrade if accuracy requires it) |
| Explainability | SHAP (`TreeExplainer` for tree-based models) |
| Data handling | pandas, numpy |
| Model persistence | joblib, one artifact bundle per disease (model + preprocessing pipeline + metadata) |

### Blockchain
| Component | Choice |
|---|---|
| Smart contract | Solidity ^0.8.x |
| Local network | Hardhat |
| Python↔chain bridge | Web3.py |
| Contract testing | Hardhat + Mocha/Chai/ethers.js |

### Testing
- Backend: pytest, pytest-asyncio, httpx
- Frontend: Vitest, React Testing Library
- Contracts: Hardhat test suite

### Local Dev / Infra
- Docker Compose to run PostgreSQL, Hardhat node, FastAPI, and React together with one command.
- `.env.example` files per service — no secrets hardcoded anywhere.

---

## 2. Repository Structure

```
ai-healthsecure/
├── datasets/                      # <-- your raw datasets go here (provided by you)
│   ├── diabetes/
│   ├── heart_disease/
│   ├── kidney_disease/
│   ├── liver_disease/
│   └── thyroid_disease/
├── ml/
│   ├── training/
│   │   ├── train_diabetes.py
│   │   ├── train_heart.py
│   │   ├── train_kidney.py
│   │   ├── train_liver.py
│   │   ├── train_thyroid.py
│   │   ├── common/
│   │   │   ├── preprocessing.py
│   │   │   ├── evaluation.py
│   │   │   └── registry_writer.py   # writes model metadata into ai_models table
│   ├── artifacts/                   # trained model + pipeline bundles (joblib), gitignored
│   └── config/
│       └── disease_features.yaml    # feature name/order/type/unit/validation per disease
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/                   # config, security, dependencies
│   │   ├── auth/
│   │   ├── models/                 # SQLAlchemy models
│   │   ├── schemas/                 # Pydantic schemas
│   │   ├── api/
│   │   │   ├── patients/
│   │   │   ├── doctors/
│   │   │   ├── hospitals/
│   │   │   ├── admin/
│   │   │   ├── predictions/
│   │   │   ├── shap/
│   │   │   ├── records/
│   │   │   ├── sharing/
│   │   │   ├── blockchain/
│   │   │   └── verification/
│   │   ├── services/
│   │   │   ├── prediction_service.py
│   │   │   ├── shap_service.py
│   │   │   ├── record_service.py
│   │   │   ├── sharing_service.py
│   │   │   ├── blockchain_service.py
│   │   │   ├── verification_service.py
│   │   │   └── analytics_service.py
│   │   └── db/                     # session, base, migrations entrypoint
│   ├── alembic/
│   ├── tests/
│   └── requirements.txt
├── blockchain/
│   ├── contracts/
│   │   └── RecordRegistry.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   ├── hardhat.config.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                    # routing, role guards
│   │   ├── features/
│   │   │   ├── patient/
│   │   │   ├── doctor/
│   │   │   ├── hospital/
│   │   │   └── admin/
│   │   ├── components/             # shared UI (tables, forms, charts, badges)
│   │   ├── services/                # API client layer
│   │   ├── store/                   # zustand stores
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── .env.example
└── docs/
    ├── architecture.md
    ├── er-diagram.md
    ├── api-reference.md
    └── shap-methodology.md
```

---

## 3. Database Schema (PostgreSQL)

Group tables exactly as follows; use UUIDs for primary keys where records cross service boundaries (patients, doctors, hospitals, records, tokens).

**Auth**
- `users (id, email, password_hash, role, is_active, created_at)`

**Healthcare entities**
- `hospitals (id, name, address, ...)`
- `doctors (id, user_id, hospital_id, name, specialization, ...)`
- `patients (id, user_id, name, dob, gender, phone, email, address, patient_code)`
- `patient_doctor_relationships (id, patient_id, doctor_id, first_treated_at)`
- `patient_health_profiles (id, patient_id, height, weight, bmi, blood_pressure, medical_history, allergies, existing_conditions, updated_at)`

**Documents**
- `medical_reports (id, patient_id, uploaded_by, file_name, file_path, file_type, file_size, report_date, description, created_at)`

**AI / ML**
- `ai_models (id, disease, algorithm, version, feature_count, preprocessing_version, training_date, accuracy, precision, recall, f1_score, roc_auc, status, artifact_path)`
- `model_features (id, model_id, feature_name, feature_order, data_type, unit, validation_rules JSONB)`
- `model_training_runs (id, model_id, dataset_name, dataset_version, training_samples, testing_samples, accuracy, precision, recall, f1_score, roc_auc, training_duration, status, created_at)`
- `model_analysis_results (id, model_id, confusion_matrix JSONB, roc_curve JSONB, feature_importance JSONB, created_at)`
- `predictions (id, patient_id, doctor_id, model_id, disease, result, confidence, risk_level, created_at)`
- `prediction_inputs (id, prediction_id, inputs JSONB)` — exact values used, immutable historical snapshot
- `prediction_analysis (id, prediction_id, ai_analysis_text)`
- `shap_explanations (id, prediction_id, base_value, created_at)`
- `shap_features (id, shap_explanation_id, feature_name, patient_value, shap_value, effect)`
- `prediction_reports (id, prediction_id, report_id)` — link table: reports actually used in this checkup

**Records**
- `medical_records (id, record_code, patient_id, doctor_id, hospital_id, prediction_id, created_at)`

**Consent & sharing**
- `access_tokens (id, token_code, patient_id, hospital_id, doctor_id, expires_at, status, created_at)`
- `record_shares (id, record_id, token_id, from_doctor_id, from_hospital_id, to_doctor_id, to_hospital_id, shared_at)`

**Blockchain**
- `blockchain_records (id, record_id, sha256_hash, tx_hash, block_number, contract_address, network, registered_at)`

**Verification**
- `verification_logs (id, record_id, verified_by_user_id, current_hash, blockchain_hash, result, verified_at)`

**Auditing**
- `audit_logs (id, user_id, action, entity_type, entity_id, metadata JSONB, created_at)`

Relationships must mirror Section 40 of the master spec (User → Patient/Doctor/Hospital/Admin; Hospital → Doctors; Patient → Health Profile/Reports/Predictions/Records/Tokens; Prediction → Inputs/Reports/Analysis/SHAP; Medical Record → Prediction/Blockchain/Sharing/Verification).

---

## 4. ML Pipeline & Training (per disease: Diabetes, Heart, Kidney, Liver, Thyroid)

Since only raw datasets are available, include the full training pipeline as part of the build — do not stub this out.

1. **Ingest** — load each dataset from `datasets/<disease>/`.
2. **Clean & validate** — handle missing values, type coercion, outlier checks; log dataset stats.
3. **Define feature contract** — for each disease, write a `disease_features.yaml` entry with: feature name, order, data type, unit, and validation rule. This file is the single source of truth consumed by both the training script and the frontend form generator, so the "exact feature order used in training" is guaranteed to match inference.
4. **Split** — train/test split (stratified where classification is imbalanced).
5. **Preprocess** — build an `sklearn.Pipeline` (imputer + scaler/encoder) fit only on the training split.
6. **Train** — scikit-learn classifier per disease (start with RandomForest or GradientBoosting; swap to XGBoost/LightGBM if accuracy is insufficient).
7. **Evaluate** — accuracy, precision, recall, F1, ROC-AUC, confusion matrix, ROC curve — store all of it, not just accuracy.
8. **Explain** — fit a SHAP explainer against the trained model on the test set as a sanity check that explanations are generated correctly before deployment.
9. **Persist** — save `{model, preprocessing_pipeline}` together via joblib into `ml/artifacts/<disease>/v<version>/`.
10. **Register** — write a row into `ai_models`, `model_features`, `model_training_runs`, and `model_analysis_results` so the Admin Model Registry and Model Analysis pages have real data on day one — this satisfies the "no fake Train Model button" rule directly (training happens as a documented offline/CLI step, and the UI displays real history).

At inference time, the backend `prediction_service.py` loads the artifact bundle for the selected disease, applies the same preprocessing pipeline, predicts, computes SHAP values, and returns disease + confidence + risk + explanation together — never separately.

---

## 5. Blockchain Flow

1. Medical record finalized in PostgreSQL.
2. Backend builds a **canonical representation** of the record (deterministic field ordering, e.g. sorted-key JSON) — this canonicalization function must be written once and reused identically for both registration and later verification.
3. SHA-256 hash computed from the canonical string.
4. Web3.py sends a transaction to the deployed `RecordRegistry.sol` contract on the local Hardhat network, storing `(recordId, hash, timestamp)`.
5. Transaction receipt (tx hash, block number, contract address) stored in `blockchain_records`.
6. Verification later recomputes the canonical hash from the *current* PostgreSQL record and compares it against the blockchain-registered hash — match/mismatch is logged in `verification_logs`.

Keep the contract minimal: a mapping from record ID to hash + timestamp, an event emitted on registration, and a read function for verification lookups. Private keys stay server-side in backend env vars only, never sent to the frontend.

---

## 6. Phased Build Plan (for Antigravity)

**Phase 0 — Scaffolding**
- Repo structure above, Docker Compose (Postgres + Hardhat node + backend + frontend), `.env.example` files, base CI-less local run instructions.

**Phase 1 — Auth & RBAC**
- `users` table, JWT login/register, role-based route guards on both frontend and backend (backend is source of truth).

**Phase 2 — Healthcare Data Layer**
- Patients, doctors, hospitals, health profiles, medical reports upload, patient-doctor relationships.

**Phase 3 — ML Training Pipeline**
- Build and run the 5 training scripts against `datasets/`, produce artifacts, populate `ai_models` / `model_features` / `model_training_runs` / `model_analysis_results`.

**Phase 4 — Prediction + SHAP**
- Doctor "New Analysis" flow: select patient → select disease → dynamic form from `model_features` → run prediction → SHAP explanation → AI analysis text → generate medical record.

**Phase 5 — Medical Records**
- Full record assembly (reports used, clinical data, prediction, SHAP, doctor/hospital details) and record views for patient/doctor/admin.

**Phase 6 — Blockchain**
- Deploy `RecordRegistry.sol` to Hardhat, wire registration into record creation, store metadata.

**Phase 7 — Consent & Sharing**
- Patient token generation, doctor-side token validation logic (all six AND conditions server-side), record sharing, received-records views with "Received from" traceability.

**Phase 8 — Verification**
- Hospital "Verify Integrity" action, canonical recompute + comparison, verification logs, green/red result states.

**Phase 9 — Admin & Dynamic Analytics**
- User management, model registry/training/analysis views, blockchain admin views, system-wide dynamic KPIs — every chart backed by a real query, none hardcoded.

**Phase 10 — Polish & States**
- Loading/empty/validation/error/success/verification states on every screen (Section 60 of the spec), responsive layout pass, accessibility pass.

**Phase 11 — Testing**
- Unit (preprocessing, SHAP, hashing, token validation), API tests per route group, contract tests, and the full end-to-end scenario in Section 67 of the master spec (Riya Patel walkthrough) as an integration test.

---

## 7. Negative Test Cases to Implement (do not skip)

- Sharing: invalid token, expired token, wrong patient/doctor/hospital match, record not belonging to patient.
- Auth: invalid credentials, unauthorized role access, disabled user.
- Blockchain: registration failure, network unavailable, contract unavailable.
- Verification: hash match, hash mismatch, missing record, missing blockchain record.
- AI: missing required feature, invalid value, unsupported disease, model unavailable.

---

## 8. Acceptance Checklist

- [ ] Patient nav contains exactly: Dashboard, My Health, My Records, Medical Reports, Access & Sharing, Profile — and nothing model/blockchain-technical.
- [ ] Doctor nav: Overview, Patients, New Patient, New Analysis, Record Sharing, Records, Profile.
- [ ] Hospital nav: Dashboard, Authorized Records, Received Records, Shared Records, Verify Record, Verification History, Organization Profile.
- [ ] Admin nav: full system management + Model Registry + Model Training + Model Analysis + Blockchain + Analytics.
- [ ] Disease name always shown first/prominently, never hidden behind "Prediction."
- [ ] Every chart/KPI is computed from live DB/model data — zero hardcoded numbers.
- [ ] Token validation happens server-side, checking all six AND conditions.
- [ ] SHA-256 canonicalization function is identical for registration and verification.
- [ ] Blockchain stores only recordId + hash + timestamp — never the full record.
- [ ] Received records always show "Received from: Hospital / Doctor."
- [ ] All five disease models trained from `datasets/`, registered with real metrics in the Model Registry.

---

## 9. What You Need to Provide

- Datasets in `datasets/<disease>/` (CSV or similar, one folder per disease: diabetes, heart_disease, kidney_disease, liver_disease, thyroid_disease).
- Any hospital/doctor/patient seed data you want pre-loaded for demoing.

Everything else — schema, pipeline, contract, API, and UI — is specified above for Antigravity to implement directly.
