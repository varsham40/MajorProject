# Phase 7 SHAP Explainability Verification — Thyroid Disease
**Generated:** 2026-09-15 11:41:52

## SHAP Explanation Engine Details
- **Model Version:** `v2.0.0`
- **Explainer Type:** `shap.KernelExplainer` with 50 background reference samples

## Patient SHAP Explanation Validation (3 Test Cases)
### Patient #1
- **Primary Risk Driver:** `TSH` (SHAP Value: `+-0.0834`)
- **Positive Risk Factors:** on thyroxine (+0.010), thyroid surgery (+0.004)
- **Protective / Negative Factors:** TSH (-0.083), FTI (-0.002), TT4 (-0.002)

### Patient #2
- **Primary Risk Driver:** `TSH` (SHAP Value: `+-0.0832`)
- **Positive Risk Factors:** on thyroxine (+0.009), thyroid surgery (+0.005), T4U (+0.000)
- **Protective / Negative Factors:** TSH (-0.083), FTI (-0.002), age (-0.002)

### Patient #3
- **Primary Risk Driver:** `TSH` (SHAP Value: `+-0.0831`)
- **Positive Risk Factors:** on thyroxine (+0.009), thyroid surgery (+0.004), sex (+0.000)
- **Protective / Negative Factors:** TSH (-0.083), FTI (-0.002), TT4 (-0.002)
