# Phase 5 Final Model Selection Summary Across All 5 Diseases
**Generated:** 2026-09-15 11:32:06

| Disease | Winning Strategy | Held-Out Test Accuracy | Held-Out Test F1 | Held-Out Test ROC-AUC | Artifact Path |
|---|---|---|---|---|---|
| Diabetes | **V1 Equal Voting Ensemble** | 72.08% | 0.5825 | 0.8170 | `ml/artifacts/diabetes/v2.0.0/model_bundle.joblib` |
| Heart Disease | **Stacking Ensemble** | 97.07% | 0.9709 | 1.0000 | `ml/artifacts/heart_disease/v2.0.0/model_bundle.joblib` |
| Kidney Disease | **V1 Equal Voting Ensemble** | 100.00% | 1.0000 | 1.0000 | `ml/artifacts/kidney_disease/v2.0.0/model_bundle.joblib` |
| Liver Disease | **Stacking Ensemble** | 71.79% | 0.8272 | 0.7707 | `ml/artifacts/liver_disease/v2.0.0/model_bundle.joblib` |
| Thyroid Disease | **Stacking Ensemble** | 99.74% | 0.9831 | 0.9997 | `ml/artifacts/thyroid_disease/v2.0.0/model_bundle.joblib` |