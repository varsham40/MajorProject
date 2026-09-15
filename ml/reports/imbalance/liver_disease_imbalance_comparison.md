# Phase 4 Class-Imbalance Handling — Liver Disease
**Minority Class Ratio:** 28.64%
**Generated:** 2026-09-15 11:31:22

| Strategy | CV Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| Baseline (No Resampling) | 0.7276 +/- 0.0430 | 0.7724 +/- 0.0354 | 0.8801 +/- 0.0430 | 0.8219 +/- 0.0283 | 0.7434 +/- 0.0275 |
| class_weight='balanced' | 0.6803 +/- 0.0233 | 0.8073 +/- 0.0163 | 0.7270 +/- 0.0392 | 0.7643 +/- 0.0209 | 0.7378 +/- 0.0221 |
| SMOTE | 0.6867 +/- 0.0341 | 0.7939 +/- 0.0185 | 0.7597 +/- 0.0620 | 0.7748 +/- 0.0327 | 0.7335 +/- 0.0257 |
| SMOTETomek | 0.6674 +/- 0.0362 | 0.7776 +/- 0.0295 | 0.7507 +/- 0.0553 | 0.7625 +/- 0.0316 | 0.7210 +/- 0.0366 |

### Winning Strategy Selected: **Baseline (No Resampling)**
**Justification:** Chosen based on joint maximization of F1 score and ROC-AUC inside cross-validation folds, preventing bias toward the majority class.