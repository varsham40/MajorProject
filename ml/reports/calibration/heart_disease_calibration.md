# Phase 6 Probability Calibration — Heart Disease
**Generated:** 2026-09-15 11:38:30

## Calibration Performance Metrics
- **Uncalibrated Brier Score:** 0.0274
- **Sigmoid (Platt) Brier Score:** 0.0308
- **Isotonic Brier Score:** 0.0311
- **Winning Calibration Method:** **sigmoid (Platt)**
- **Final Calibrated Brier Score:** **0.0308**
- **Brier Score Improvement:** `-0.0034` (-12.27% reduction in probability error)

### Operational Risk Threshold Verification
- **Low Risk:** `< 40.0%` probability
- **Moderate Risk:** `40.0% - 70.0%` probability
- **High Risk:** `> 70.0%` probability

Calibrated V2 model successfully updated in `e:\1_Final_MicroProject\Majorproject_Varsha\ml\artifacts\heart_disease\v2.0.0\model_bundle.joblib`.