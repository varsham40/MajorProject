# Phase 5 Final Model Selection — Liver Disease
**Generated:** 2026-09-15 11:35:23

## Cross-Validation Strategy Comparison

| Strategy / Candidate | CV Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| Best Tuned LightGBM | 0.7447 +/- 0.0341 | 0.7970 +/- 0.0363 | 0.8649 +/- 0.0089 | 0.8291 +/- 0.0203 | 0.7435 +/- 0.0275 |
| Best Tuned XGBoost | 0.7190 +/- 0.0282 | 0.7573 +/- 0.0279 | 0.8949 +/- 0.0131 | 0.8200 +/- 0.0160 | 0.7433 +/- 0.0250 |
| V1 Equal Voting Ensemble | 0.7447 +/- 0.0168 | 0.7564 +/- 0.0165 | 0.9489 +/- 0.0074 | 0.8416 +/- 0.0089 | 0.7330 +/- 0.0126 |
| Weighted Voting Ensemble | 0.7318 +/- 0.0440 | 0.7692 +/- 0.0372 | 0.8948 +/- 0.0215 | 0.8269 +/- 0.0270 | 0.7530 +/- 0.0222 |
| Stacking Ensemble ⭐ **Winner** | 0.7318 +/- 0.0237 | 0.7431 +/- 0.0137 | 0.9550 +/- 0.0268 | 0.8356 +/- 0.0160 | 0.7503 +/- 0.0267 |

## Final Winner: **Stacking Ensemble**

### Held-Out 20% Test Set Verification Results
- **Test Accuracy:** 0.7179 (71.79%)
- **Test Precision:** 0.7315
- **Test Recall:** 0.9518
- **Test F1 Score:** 0.8272
- **Test ROC-AUC:** 0.7707

V2 Model Artifact saved to `e:\1_Final_MicroProject\Majorproject_Varsha\ml\artifacts\liver_disease\v2.0.0\model_bundle.joblib`.