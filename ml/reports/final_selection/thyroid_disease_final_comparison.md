# Phase 5 Final Model Selection — Thyroid Disease
**Generated:** 2026-09-15 11:37:19

## Cross-Validation Strategy Comparison

| Strategy / Candidate | CV Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| Best Tuned LightGBM | 0.9934 +/- 0.0042 | 0.9436 +/- 0.0432 | 0.9744 +/- 0.0159 | 0.9583 +/- 0.0258 | 0.9989 +/- 0.0007 |
| Best Tuned XGBoost | 0.9947 +/- 0.0046 | 0.9574 +/- 0.0534 | 0.9787 +/- 0.0269 | 0.9667 +/- 0.0280 | 0.9992 +/- 0.0007 |
| V1 Equal Voting Ensemble | 0.9884 +/- 0.0048 | 0.9629 +/- 0.0175 | 0.8842 +/- 0.0625 | 0.9206 +/- 0.0347 | 0.9985 +/- 0.0004 |
| Weighted Voting Ensemble | 0.9960 +/- 0.0034 | 0.9641 +/- 0.0406 | 0.9872 +/- 0.0170 | 0.9749 +/- 0.0210 | 0.9991 +/- 0.0007 |
| Stacking Ensemble ⭐ **Winner** | 0.9964 +/- 0.0019 | 0.9711 +/- 0.0269 | 0.9830 +/- 0.0159 | 0.9767 +/- 0.0121 | 0.9991 +/- 0.0007 |

## Final Winner: **Stacking Ensemble**

### Held-Out 20% Test Set Verification Results
- **Test Accuracy:** 0.9974 (99.74%)
- **Test Precision:** 0.9667
- **Test Recall:** 1.0000
- **Test F1 Score:** 0.9831
- **Test ROC-AUC:** 0.9997

V2 Model Artifact saved to `e:\1_Final_MicroProject\Majorproject_Varsha\ml\artifacts\thyroid_disease\v2.0.0\model_bundle.joblib`.