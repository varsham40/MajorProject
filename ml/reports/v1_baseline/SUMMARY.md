# Phase 1 -- V1 Voting Ensemble Stratified 5-Fold CV Baseline Summary

| Disease Domain | CV Accuracy (mean +/- std) | Precision | Recall | F1 Score | ROC-AUC | PR-AUC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Diabetes** | 0.7736 +/- 0.0192 | 0.7101 +/- 0.0454 | 0.5981 +/- 0.04 | 0.6478 +/- 0.0292 | **0.829 +/- 0.0249** | 0.72 +/- 0.0513 |
| **Heart Disease** | 0.9841 +/- 0.0049 | 0.9852 +/- 0.0121 | 0.9825 +/- 0.0187 | 0.9836 +/- 0.0053 | **0.9988 +/- 0.0008** | 0.9988 +/- 0.0009 |
| **Kidney Disease** | 1.0 +/- 0.0 | 1.0 +/- 0.0 | 1.0 +/- 0.0 | 1.0 +/- 0.0 | **1.0 +/- 0.0** | 1.0 +/- 0.0 |
| **Liver Disease** | 0.7382 +/- 0.0227 | 0.7584 +/- 0.0203 | 0.9309 +/- 0.0122 | 0.8356 +/- 0.0136 | **0.7302 +/- 0.0152** | 0.8806 +/- 0.0062 |
| **Thyroid Disease** | 0.9894 +/- 0.0043 | 0.9633 +/- 0.0175 | 0.897 +/- 0.0544 | 0.928 +/- 0.0304 | **0.9986 +/- 0.0004** | 0.9786 +/- 0.0064 |

---
- **Leakage Prevention**: All preprocessing (imputation, scaling, encoding) refit inside each Stratified K-Fold split.
- **Held-Out Test Set**: 20% carved out prior to CV and held untouched for Phase 5 final evaluation.
