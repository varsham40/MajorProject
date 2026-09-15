# Phase 7 SHAP Explainability Verification — Kidney Disease
**Generated:** 2026-09-15 11:41:43

## SHAP Explanation Engine Details
- **Model Version:** `v2.0.0`
- **Explainer Type:** `shap.KernelExplainer` with 50 background reference samples

## Patient SHAP Explanation Validation (3 Test Cases)
### Patient #1
- **Primary Risk Driver:** `al` (SHAP Value: `+0.1359`)
- **Positive Risk Factors:** al (+0.136), bu (+0.098), pot (+0.042)
- **Protective / Negative Factors:** None

### Patient #2
- **Primary Risk Driver:** `bu` (SHAP Value: `+0.1482`)
- **Positive Risk Factors:** bu (+0.148), hemo (+0.089), rbc (+0.049)
- **Protective / Negative Factors:** None

### Patient #3
- **Primary Risk Driver:** `bu` (SHAP Value: `+0.1358`)
- **Positive Risk Factors:** bu (+0.136), hemo (+0.083), pcc (+0.051)
- **Protective / Negative Factors:** None
