# Phase 4 Class-Imbalance Handling — Diabetes
**Minority Class Ratio:** 34.90%
**Generated:** 2026-09-15 11:31:18

| Strategy | CV Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| Baseline (No Resampling) | 0.7639 +/- 0.0270 | 0.7000 +/- 0.0608 | 0.5750 +/- 0.0378 | 0.6296 +/- 0.0347 | 0.8114 +/- 0.0276 |
| class_weight='balanced' | 0.7606 +/- 0.0297 | 0.6605 +/- 0.0644 | 0.6684 +/- 0.0322 | 0.6616 +/- 0.0253 | 0.8143 +/- 0.0277 |
| SMOTE | 0.7671 +/- 0.0262 | 0.6711 +/- 0.0541 | 0.6635 +/- 0.0137 | 0.6660 +/- 0.0251 | 0.8122 +/- 0.0242 |
| SMOTETomek | 0.7639 +/- 0.0198 | 0.6631 +/- 0.0404 | 0.6636 +/- 0.0233 | 0.6624 +/- 0.0204 | 0.8134 +/- 0.0300 |

### Winning Strategy Selected: **SMOTE**
**Justification:** Chosen based on joint maximization of F1 score and ROC-AUC inside cross-validation folds, preventing bias toward the majority class.