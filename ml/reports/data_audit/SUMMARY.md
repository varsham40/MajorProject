# Phase 0 Data Audit Summary Report — AI HealthSecure

This report summarizes dataset quality, row counts, duplicate counts, class balance ratios, and target leakage flags across all 5 disease domains prior to ML model training.

| Disease Domain | Dataset Path | Total Rows | Duplicates | Positive Class % | Negative Class % | Imbalance Level |
| :--- | :--- | ---: | ---: | ---: | ---: | :--- |
| **Diabetes** (`diabetes`) | `768` | `0` | 34.9% | 65.1% | Balanced |
| **Heart Disease** (`heart_disease`) | `1025` | `723` | 48.68% | 51.32% | Balanced |
| **Kidney Disease** (`kidney_disease`) | `280` | `0` | 62.14% | 37.86% | Balanced |
| **Liver Disease** (`liver_disease`) | `583` | `13` | 71.36% | 28.64% | Balanced |
| **Thyroid Disease** (`thyroid_disease`) | `3771` | `63` | 7.72% | 92.28% | Heavy (<25%) |

---

## Key Data Audit Findings:
1. **Kidney Disease Dataset**:
   - Contains high correlation clinical markers (`hemo`, `sc`, `pcv` with $|r| > 0.65$).
   - Severe renal anemia (`hemo < 9.0`) and elevated creatinine are near-deterministic symptoms of Stage 4/5 CKD.
   - Stratified 5-Fold Cross Validation in Phase 1 will validate whether $100\%$ accuracy holds cleanly across unseen folds without leakage.
2. **Thyroid Disease Dataset**:
   - Heavily imbalanced ($93.4\%$ Normal vs $6.6\%$ Disease). Requires SMOTE/SMOTEENN evaluation in Phase 4.
3. **Diabetes & Liver Datasets**:
   - Moderately imbalanced (~35% positive for Diabetes, ~28% positive for Liver).
