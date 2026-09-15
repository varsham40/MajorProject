# Phase 5 Final Model Selection — Diabetes
**Generated:** 2026-09-15 11:32:35

## Cross-Validation Strategy Comparison

| Strategy / Candidate | CV Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| Best Tuned LightGBM | 0.7573 +/- 0.0174 | 0.7177 +/- 0.0705 | 0.5190 +/- 0.0492 | 0.5979 +/- 0.0222 | 0.8299 +/- 0.0265 |
| Best Tuned XGBoost | 0.7508 +/- 0.0168 | 0.7935 +/- 0.0586 | 0.3877 +/- 0.0418 | 0.5193 +/- 0.0398 | 0.8354 +/- 0.0280 |
| V1 Equal Voting Ensemble ⭐ **Winner** | 0.7769 +/- 0.0169 | 0.7342 +/- 0.0471 | 0.5702 +/- 0.0332 | 0.6403 +/- 0.0240 | 0.8349 +/- 0.0285 |
| Weighted Voting Ensemble | 0.7606 +/- 0.0198 | 0.7317 +/- 0.0734 | 0.5095 +/- 0.0421 | 0.5971 +/- 0.0268 | 0.8322 +/- 0.0265 |
| Stacking Ensemble | 0.7671 +/- 0.0141 | 0.7176 +/- 0.0557 | 0.5611 +/- 0.0511 | 0.6260 +/- 0.0212 | 0.8321 +/- 0.0260 |

## Final Winner: **V1 Equal Voting Ensemble**

### Held-Out 20% Test Set Verification Results
- **Test Accuracy:** 0.7208 (72.08%)
- **Test Precision:** 0.6122
- **Test Recall:** 0.5556
- **Test F1 Score:** 0.5825
- **Test ROC-AUC:** 0.8170

V2 Model Artifact saved to `e:\1_Final_MicroProject\Majorproject_Varsha\ml\artifacts\diabetes\v2.0.0\model_bundle.joblib`.