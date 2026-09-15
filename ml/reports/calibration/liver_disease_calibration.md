# Phase 6 Probability Calibration — Liver Disease
**Generated:** 2026-09-15 11:39:26

## Calibration Performance Metrics
- **Uncalibrated Brier Score:** 0.1767
- **Sigmoid (Platt) Brier Score:** 0.1751
- **Isotonic Brier Score:** 0.1707
- **Winning Calibration Method:** **isotonic**
- **Final Calibrated Brier Score:** **0.1707**
- **Brier Score Improvement:** `0.0060` (3.40% reduction in probability error)

### Operational Risk Threshold Verification
- **Low Risk:** `< 40.0%` probability
- **Moderate Risk:** `40.0% - 70.0%` probability
- **High Risk:** `> 70.0%` probability

Calibrated V2 model successfully updated in `e:\1_Final_MicroProject\Majorproject_Varsha\ml\artifacts\liver_disease\v2.0.0\model_bundle.joblib`.