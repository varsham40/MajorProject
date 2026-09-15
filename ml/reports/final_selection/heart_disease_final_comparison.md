# Phase 5 Final Model Selection — Heart Disease
**Generated:** 2026-09-15 11:33:37

## Cross-Validation Strategy Comparison

| Strategy / Candidate | CV Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| Best Tuned LightGBM | 0.9854 +/- 0.0126 | 0.9876 +/- 0.0157 | 0.9825 +/- 0.0169 | 0.9849 +/- 0.0129 | 0.9997 +/- 0.0005 |
| Best Tuned XGBoost | 0.9878 +/- 0.0039 | 0.9951 +/- 0.0098 | 0.9800 +/- 0.0127 | 0.9874 +/- 0.0040 | 0.9998 +/- 0.0002 |
| V1 Equal Voting Ensemble | 0.9841 +/- 0.0049 | 0.9852 +/- 0.0121 | 0.9825 +/- 0.0187 | 0.9836 +/- 0.0053 | 0.9986 +/- 0.0011 |
| Weighted Voting Ensemble | 0.9902 +/- 0.0062 | 0.9951 +/- 0.0098 | 0.9850 +/- 0.0146 | 0.9899 +/- 0.0065 | 0.9998 +/- 0.0003 |
| Stacking Ensemble ⭐ **Winner** | 0.9902 +/- 0.0062 | 0.9951 +/- 0.0098 | 0.9850 +/- 0.0146 | 0.9899 +/- 0.0065 | 0.9998 +/- 0.0004 |

## Final Winner: **Stacking Ensemble**

### Held-Out 20% Test Set Verification Results
- **Test Accuracy:** 0.9707 (97.07%)
- **Test Precision:** 0.9434
- **Test Recall:** 1.0000
- **Test F1 Score:** 0.9709
- **Test ROC-AUC:** 1.0000

V2 Model Artifact saved to `e:\1_Final_MicroProject\Majorproject_Varsha\ml\artifacts\heart_disease\v2.0.0\model_bundle.joblib`.