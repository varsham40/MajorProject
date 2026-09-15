# Phase 7 SHAP Explainability Verification — Liver Disease
**Generated:** 2026-09-15 11:41:46

## SHAP Explanation Engine Details
- **Model Version:** `v2.0.0`
- **Explainer Type:** `shap.KernelExplainer` with 50 background reference samples

## Patient SHAP Explanation Validation (3 Test Cases)
### Patient #1
- **Primary Risk Driver:** `Aspartate_Aminotransferase` (SHAP Value: `+0.0346`)
- **Positive Risk Factors:** Aspartate_Aminotransferase (+0.035), Age (+0.018), Total_Protiens (+0.003)
- **Protective / Negative Factors:** Direct_Bilirubin (-0.025), Gender (-0.019), Alamine_Aminotransferase (-0.018)

### Patient #2
- **Primary Risk Driver:** `Alkaline_Phosphotase` (SHAP Value: `+0.0420`)
- **Positive Risk Factors:** Alkaline_Phosphotase (+0.042), Gender (+0.039), Total_Bilirubin (+0.038)
- **Protective / Negative Factors:** None

### Patient #3
- **Primary Risk Driver:** `Direct_Bilirubin` (SHAP Value: `+0.0367`)
- **Positive Risk Factors:** Direct_Bilirubin (+0.037), Gender (+0.036), Total_Bilirubin (+0.034)
- **Protective / Negative Factors:** None
