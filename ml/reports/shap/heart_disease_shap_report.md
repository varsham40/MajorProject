# Phase 7 SHAP Explainability Verification — Heart Disease
**Generated:** 2026-09-15 11:41:36

## SHAP Explanation Engine Details
- **Model Version:** `v2.0.0`
- **Explainer Type:** `shap.KernelExplainer` with 50 background reference samples

## Patient SHAP Explanation Validation (3 Test Cases)
### Patient #1
- **Primary Risk Driver:** `cp` (SHAP Value: `+0.1953`)
- **Positive Risk Factors:** cp (+0.195), ca (+0.184), thal (+0.105)
- **Protective / Negative Factors:** slope (-0.026), age (-0.022), restecg (-0.018)

### Patient #2
- **Primary Risk Driver:** `oldpeak` (SHAP Value: `+0.1926`)
- **Positive Risk Factors:** oldpeak (+0.193), cp (+0.138), thal (+0.102)
- **Protective / Negative Factors:** ca (-0.069), age (-0.029)

### Patient #3
- **Primary Risk Driver:** `oldpeak` (SHAP Value: `+0.1512`)
- **Positive Risk Factors:** oldpeak (+0.151), cp (+0.110), exang (+0.099)
- **Protective / Negative Factors:** ca (-0.056), age (-0.026)
