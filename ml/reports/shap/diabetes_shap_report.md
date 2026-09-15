# Phase 7 SHAP Explainability Verification — Diabetes
**Generated:** 2026-09-15 11:41:28

## SHAP Explanation Engine Details
- **Model Version:** `v2.0.0`
- **Explainer Type:** `shap.KernelExplainer` with 50 background reference samples

## Patient SHAP Explanation Validation (3 Test Cases)
### Patient #1
- **Primary Risk Driver:** `Glucose` (SHAP Value: `+0.1972`)
- **Positive Risk Factors:** Glucose (+0.197), DiabetesPedigreeFunction (+0.064), Age (+0.051)
- **Protective / Negative Factors:** None

### Patient #2
- **Primary Risk Driver:** `Glucose` (SHAP Value: `+-0.1791`)
- **Positive Risk Factors:** Age (+0.001)
- **Protective / Negative Factors:** Glucose (-0.179), BMI (-0.075), Pregnancies (-0.022)

### Patient #3
- **Primary Risk Driver:** `Glucose` (SHAP Value: `+0.4018`)
- **Positive Risk Factors:** Glucose (+0.402), Pregnancies (+0.042), DiabetesPedigreeFunction (+0.035)
- **Protective / Negative Factors:** BMI (-0.115), SkinThickness (-0.004)
