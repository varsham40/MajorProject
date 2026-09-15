# Phase 5 Final Model Selection — Kidney Disease
**Generated:** 2026-09-15 11:34:10

## Cross-Validation Strategy Comparison

| Strategy / Candidate | CV Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| Best Tuned LightGBM | 0.9956 +/- 0.0089 | 0.9931 +/- 0.0138 | 1.0000 +/- 0.0000 | 0.9965 +/- 0.0070 | 1.0000 +/- 0.0000 |
| Best Tuned XGBoost | 0.9778 +/- 0.0243 | 0.9788 +/- 0.0173 | 0.9857 +/- 0.0286 | 0.9821 +/- 0.0199 | 0.9992 +/- 0.0017 |
| V1 Equal Voting Ensemble ⭐ **Winner** | 1.0000 +/- 0.0000 | 1.0000 +/- 0.0000 | 1.0000 +/- 0.0000 | 1.0000 +/- 0.0000 | 1.0000 +/- 0.0000 |
| Weighted Voting Ensemble | 0.9956 +/- 0.0089 | 0.9931 +/- 0.0138 | 1.0000 +/- 0.0000 | 0.9965 +/- 0.0070 | 1.0000 +/- 0.0000 |
| Stacking Ensemble | 0.9956 +/- 0.0089 | 0.9931 +/- 0.0138 | 1.0000 +/- 0.0000 | 0.9965 +/- 0.0070 | 1.0000 +/- 0.0000 |

## Final Winner: **V1 Equal Voting Ensemble**

### Held-Out 20% Test Set Verification Results
- **Test Accuracy:** 1.0000 (100.00%)
- **Test Precision:** 1.0000
- **Test Recall:** 1.0000
- **Test F1 Score:** 1.0000
- **Test ROC-AUC:** 1.0000

V2 Model Artifact saved to `e:\1_Final_MicroProject\Majorproject_Varsha\ml\artifacts\kidney_disease\v2.0.0\model_bundle.joblib`.