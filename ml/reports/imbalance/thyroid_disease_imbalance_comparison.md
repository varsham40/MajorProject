# Phase 4 Class-Imbalance Handling — Thyroid Disease
**Minority Class Ratio:** 7.72%
**Generated:** 2026-09-15 11:31:30

| Strategy | CV Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| Baseline (No Resampling) | 0.9937 +/- 0.0037 | 0.9410 +/- 0.0452 | 0.9830 +/- 0.0208 | 0.9606 +/- 0.0218 | 0.9991 +/- 0.0008 |
| class_weight='balanced' | 0.9914 +/- 0.0052 | 0.9128 +/- 0.0568 | 0.9872 +/- 0.0170 | 0.9473 +/- 0.0296 | 0.9993 +/- 0.0007 |
| SMOTE | 0.9927 +/- 0.0039 | 0.9302 +/- 0.0490 | 0.9830 +/- 0.0208 | 0.9547 +/- 0.0223 | 0.9992 +/- 0.0009 |
| SMOTETomek | 0.9934 +/- 0.0038 | 0.9369 +/- 0.0444 | 0.9830 +/- 0.0208 | 0.9586 +/- 0.0225 | 0.9990 +/- 0.0011 |

### Winning Strategy Selected: **Baseline (No Resampling)**
**Justification:** Chosen based on joint maximization of F1 score and ROC-AUC inside cross-validation folds, preventing bias toward the majority class.