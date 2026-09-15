# Phase 6 Probability Calibration — Kidney Disease
**Generated:** 2026-09-15 11:38:34

## Calibration Performance Metrics
- **Uncalibrated Brier Score:** 0.0034
- **Sigmoid (Platt) Brier Score:** 0.0023
- **Isotonic Brier Score:** 0.0007
- **Winning Calibration Method:** **isotonic**
- **Final Calibrated Brier Score:** **0.0007**
- **Brier Score Improvement:** `0.0027` (80.33% reduction in probability error)

### Operational Risk Threshold Verification
- **Low Risk:** `< 40.0%` probability
- **Moderate Risk:** `40.0% - 70.0%` probability
- **High Risk:** `> 70.0%` probability

Calibrated V2 model successfully updated in `e:\1_Final_MicroProject\Majorproject_Varsha\ml\artifacts\kidney_disease\v2.0.0\model_bundle.joblib`.