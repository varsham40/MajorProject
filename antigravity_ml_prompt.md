# Prompt for Antigravity — AI HealthSecure ML Pipeline Upgrade

Copy everything below into Antigravity as your task prompt.

---

## Context

I have an existing major project called **AI HealthSecure** — a multi-disease early detection platform predicting 5 diseases (Diabetes, Heart Disease, Chronic Kidney Disease, Liver Disease, Thyroid Disease) using a Multi-Model Soft Voting Ensemble (Random Forest, XGBoost/GradientBoosting, MLP, Logistic Regression, SVM), with SHAP explainability and blockchain record integrity.

Current training pipeline: `ml/training/train_all.py`
Current inference service: `backend/app/services/ml_service.py`
Current artifacts: `ml/artifacts/{disease_key}/v1.0.0/model_bundle.joblib`

Current baseline results (single 80/20 split — to be replaced, not trusted as final):

| Disease | Accuracy | ROC-AUC |
|---|---|---|
| Diabetes | 74.03% | 0.8156 |
| Heart | 97.07% | 0.9894 |
| Kidney | 100.00% | 1.0000 |
| Liver | 72.65% | 0.8086 |
| Thyroid | 98.94% | 0.9986 |

I do NOT want a full research-grade overhaul (no TabPFN, no nested CV, no exhaustive Optuna sweeps across every model). I want a **scoped, defensible, time-boxed upgrade** that produces strong evidence of rigor without burning excessive compute or time. Follow the phase plan below exactly, in order. Do not skip Phase 0.

---

## Non-negotiable ground rules

1. **No data leakage.** All preprocessing (imputation, scaling, encoding) must be fit ONLY on the training fold/split, never on the full dataset before splitting.
2. **Any resampling (SMOTE etc.) happens inside the training fold only**, never before CV splitting.
3. **Do not delete or overwrite the existing V1 Voting Ensemble code.** Keep it intact as the benchmark. Build V2 alongside it.
4. **Every result must be reproducible** — set and log random seeds everywhere (numpy, sklearn, xgboost, lightgbm, catboost, train/test split, CV splitter).
5. **Log everything** (metrics, chosen hyperparameters, per-fold scores) to a results file per disease, not just printed to console — I need this for my report.
6. **Prefer clear, well-commented code over clever code.** This needs to be explainable in a viva/defense.

---

## Phase 0 — Data Audit (do this first, block on this before anything else)

For each of the 5 datasets, write an audit script that outputs a markdown/JSON report containing:
- Row count, duplicate row count, near-duplicate count
- Missing value % per column
- Class balance (% per class)
- Feature types (numeric vs categorical) and basic distribution stats
- Outlier flags (e.g. IQR-based) per numeric feature
- A leakage check: scan for any column that is suspiciously highly correlated with the target (report correlation/mutual information ranked list) — flag anything above a reasonable threshold for manual review

**Special task: investigate the Kidney Disease 100% accuracy / 1.0 ROC-AUC result specifically.**
- Check for duplicate or near-duplicate rows shared between train and test
- Check for any column that is a near-perfect proxy for the diagnosis label
- Check whether the current train/test split was stratified and whether preprocessing was fit before or after the split
- Report your findings clearly: is the 100% legitimate (e.g., dataset is genuinely linearly/trivially separable) or is it leakage? Do not "fix" the number artificially either way — just report the true, validated result after Phase 1's proper CV.

**Deliverable:** `ml/reports/data_audit/{disease_key}_audit.md` for each disease, plus a summary `ml/reports/data_audit/SUMMARY.md`.

---

## Phase 1 — Re-baseline with Stratified K-Fold CV

Replace the single 80/20 split evaluation with **Stratified 5-Fold Cross-Validation** for the existing V1 Voting Ensemble, for all 5 diseases.

- Preprocessing pipeline must be refit inside each fold (use `sklearn.pipeline.Pipeline` so this happens automatically and correctly)
- Report mean ± std for: Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC
- Also keep a final held-out test set (e.g. carve out 15-20% before CV, untouched during all tuning/model selection, used only once at the very end for the final selected model)

**Deliverable:** `ml/reports/v1_baseline/{disease_key}_cv_results.json` + a combined summary table across all 5 diseases.

---

## Phase 2 — Add modern candidate models + comparison table

Add these candidate models (sklearn-API-compatible, minimal integration effort):
- XGBoost
- LightGBM
- CatBoost

Keep existing baselines: Logistic Regression, SVM, Random Forest, MLP.

For each disease, using the same Stratified 5-Fold CV setup from Phase 1, evaluate every individual model (not ensembles yet) and produce a comparison table:

| Model | CV Accuracy | Precision | Recall | F1 | ROC-AUC | PR-AUC |
|---|---|---|---|---|---|---|

**Deliverable:** `ml/reports/model_comparison/{disease_key}_model_table.md` for each of the 5 diseases.

---

## Phase 3 — Light, scoped hyperparameter tuning

Do NOT tune every model. Tune only: **XGBoost, LightGBM, CatBoost** (the newest, highest-value candidates).

- Use Optuna, but cap it: **25-30 trials per model per disease** (not hundreds)
- Objective = mean CV score (from Stratified K-Fold, not a single split) to avoid overfitting to one split
- Log the best hyperparameters found per disease per model to a JSON file
- Re-run CV with tuned hyperparameters and update the comparison table from Phase 2

**Deliverable:** `ml/reports/tuning/{disease_key}_best_params.json` + updated comparison tables.

---

## Phase 4 — Conditional class-imbalance handling

First check Phase 0's class balance numbers. **Only apply imbalance handling to datasets that are actually meaningfully imbalanced** (do not blanket-apply to all 5).

For flagged datasets, compare (inside CV folds only):
- Baseline (no resampling)
- `class_weight='balanced'`
- SMOTE
- SMOTETomek (only if SMOTE alone underperforms)

Pick the winner by F1 and ROC-AUC, not accuracy (accuracy is misleading under imbalance). Justify the choice in the report.

**Deliverable:** `ml/reports/imbalance/{disease_key}_imbalance_comparison.md` (only for flagged diseases).

---

## Phase 5 — Ensemble comparison (final model selection per disease)

For each disease, using CV, compare exactly these four candidates:
1. Best single tuned model from Phase 2/3
2. Current V1 equal-weight Voting Ensemble (existing code, untouched)
3. Weighted Voting Ensemble — weights derived from validation performance (not equal 20% each)
4. Stacking Ensemble — base learners = top 3-4 models from Phase 2, meta-learner = Logistic Regression, using out-of-fold predictions to avoid leakage

Select the winner **independently per disease** based on ROC-AUC + F1 jointly (not accuracy alone). It is expected and fine if the winning strategy differs across diseases — document this explicitly as evidence the framework is disease-adaptive, not one-size-fits-all.

Evaluate the final selected model per disease on the held-out test set from Phase 1 (used only once, here).

**Deliverable:** `ml/reports/final_selection/{disease_key}_final_comparison.md` + `ml/artifacts/{disease_key}/v2.0.0/model_bundle.joblib` for the winning strategy per disease. Keep v1.0.0 artifacts untouched.

---

## Phase 6 — Probability calibration

Apply `CalibratedClassifierCV` (try both Platt/sigmoid and isotonic, pick better via Brier score on validation folds) to each disease's final selected model from Phase 5.

Keep the existing risk thresholds (<40% Low, 40-70% Moderate, >70% High) unless Phase 0/5 data clearly shows they're miscalibrated for a specific disease — don't redesign thresholds speculatively.

Report Brier score before/after calibration per disease.

**Deliverable:** Update `ml/artifacts/{disease_key}/v2.0.0/model_bundle.joblib` to include the calibrated model. Log Brier scores to `ml/reports/calibration/{disease_key}_calibration.md`.

---

## Phase 7 — SHAP wiring for the new winning models

Update `backend/app/services/ml_service.py` (or create a v2 service alongside it) so SHAP explainability works correctly for whichever model type won per disease:
- Tree-based winners (RF, XGBoost, LightGBM, CatBoost, tree-based stacking base) → `TreeExplainer`
- Linear/SVM/MLP/Voting/Stacking-with-non-tree-meta → `KernelExplainer` with a small background sample (for speed — cap background sample size, e.g. 50-100 rows)

Confirm per-patient SHAP output still includes: predicted disease, probability, risk level, top positive contributors, top negative contributors, feature values, SHAP values, and a human-readable explanation string. Also regenerate the global SHAP summary plot for the Admin dashboard using the new v2.0.0 models.

**Deliverable:** Working SHAP output validated against 3-5 sample patients per disease, before/after comparison of explanations from v1 vs v2 models included in the report.

---

## Phase 8 — Final documentation artifact

Generate a single consolidated markdown report: `ml/reports/FINAL_ML_REPORT.md` containing:
1. Executive summary of the framework (use this framing, adapt as needed): *"The system evaluates multiple machine-learning models per disease, validates them with stratified cross-validation, tests class-imbalance and ensemble strategies where appropriate, and selects the best-performing validated model independently for each disease, followed by SHAP-based explainability."*
2. Data audit summary (Phase 0), explicitly addressing the Kidney 100% result
3. V1 baseline CV results (Phase 1)
4. Individual model comparison tables per disease (Phase 2/3)
5. Imbalance handling decisions, where applicable (Phase 4)
6. Final model selected per disease with justification (Phase 5)
7. Calibration results (Phase 6)
8. Final performance table: V1 vs V2 per disease, using consistent metrics (Accuracy, F1, ROC-AUC, PR-AUC, Brier score)
9. A short "Future Work" section explicitly noting TabPFN, nested CV, and full threshold optimization were considered but scoped out for this project stage, with one sentence justification each

---

## Execution instructions for Antigravity

- Work through phases strictly in order; do not proceed to Phase N+1 until Phase N's deliverables exist and are logged.
- After each phase, print a short summary of what was done and where outputs were saved, so I can review before continuing.
- If a dataset is too small for a given technique to be meaningful (e.g., very small folds), flag it rather than silently proceeding — ask me how to handle it.
- Do not modify or break the existing v1.0.0 artifacts, the current FastAPI endpoints, or the blockchain/SHA-256 record pipeline — this task is scoped to the ML core only.
- If something in this plan conflicts with the actual current codebase structure, stop and tell me the conflict rather than guessing.
