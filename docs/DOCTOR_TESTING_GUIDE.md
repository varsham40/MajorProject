# AI HealthSecure — Doctor's Clinical Testing Guide (V2.0.0 ML Models)

Welcome! This guide provides **pre-formatted clinical patient test cases** for all 5 disease detection modules in **AI HealthSecure**. As a doctor or evaluator, you can enter these exact clinical parameters into the UI (`http://localhost:3000`) to test and verify prediction results, calibrated risk confidence scores, and SHAP explainability.

---

## Quick Setup & How to Test in UI

1. Open your browser and navigate to **`http://localhost:3000`**.
2. Log in using your Doctor credentials (or register a Doctor account).
3. Select any disease module from the navigation bar or dashboard (e.g. **Diabetes**, **Heart Disease**, **Kidney Disease**, **Liver Disease**, **Thyroid Disease**).
4. Enter the clinical parameters provided below for **Case A (High Risk)** or **Case B (Low Risk / Normal)**.
5. Click **"Predict Risk" / "Analyze Patient"**.
6. Verify that the displayed prediction label, risk tier, confidence percentage, and SHAP key contributors match the expected output.

---

## 1. Diabetes Early Detection

### Case 1A: High Risk Patient (Diabetes Positive)

#### Clinical Input Parameters to Enter in UI:
| UI Field Name | Field Parameter Value to Type |
|---|---|
| **Pregnancies** | `6` |
| **Glucose Level (mg/dL)** | `168` |
| **Blood Pressure (mmHg)** | `88` |
| **Skin Thickness (mm)** | `35` |
| **Insulin Level (mu U/ml)** | `190` |
| **Body Mass Index (BMI)** | `35.4` |
| **Diabetes Pedigree Function** | `0.78` |
| **Age (years)** | `52` |

#### Expected UI Prediction Output:
* **Diagnosis Label:** `High Risk of Diabetes`
* **Risk Level Tier:** `High`
* **Calibrated Confidence Score:** `77.3% – 84.0%`
* **Primary SHAP Risk Drivers:** `Glucose Level (168 mg/dL)` (High positive impact), `BMI (35.4 kg/m²)` (High positive impact), `Age (52 years)` (Moderate positive impact).

---

### Case 1B: Low Risk Patient (Normal / Healthy)

#### Clinical Input Parameters to Enter in UI:
| UI Field Name | Field Parameter Value to Type |
|---|---|
| **Pregnancies** | `1` |
| **Glucose Level (mg/dL)** | `85` |
| **Blood Pressure (mmHg)** | `66` |
| **Skin Thickness (mm)** | `20` |
| **Insulin Level (mu U/ml)** | `70` |
| **Body Mass Index (BMI)** | `21.5` |
| **Diabetes Pedigree Function** | `0.18` |
| **Age (years)** | `24` |

#### Expected UI Prediction Output:
* **Diagnosis Label:** `Low Risk / Normal (Diabetes)`
* **Risk Level Tier:** `Low`
* **Calibrated Confidence Score:** `< 15.0%`
* **Primary Protective Factors:** `Normal Glucose (85 mg/dL)`, `Normal BMI (21.5)`, `Young Age (24)`.

---

## 2. Heart Disease Detection

### Case 2A: High Risk Patient (Cardiovascular Disease)

#### Clinical Input Parameters to Enter in UI:
| UI Field Name | Field Parameter Value to Type |
|---|---|
| **Age (years)** | `63` |
| **Sex** | `1` (Male) |
| **Chest Pain Type (cp)** | `3` (Asymptomatic / Severe) |
| **Resting Blood Pressure (trestbps)** | `160` mmHg |
| **Serum Cholestoral (chol)** | `286` mg/dL |
| **Fasting Blood Sugar > 120 mg/dL (fbs)** | `1` (True) |
| **Resting ECG Results (restecg)** | `2` (ST-T wave abnormality) |
| **Maximum Heart Rate (thalach)** | `108` bpm |
| **Exercise Induced Angina (exang)** | `1` (Yes) |
| **ST Depression (oldpeak)** | `2.5` mm |
| **Slope of Peak Exercise ST (slope)** | `1` (Flat) |
| **Major Vessels Colored (ca)** | `2` |
| **Thalassemia (thal)** | `3` (Reversible defect) |

#### Expected UI Prediction Output:
* **Diagnosis Label:** `High Risk of Heart Disease`
* **Risk Level Tier:** `High`
* **Calibrated Confidence Score:** `92.0% – 98.5%`
* **Primary SHAP Risk Drivers:** `Exercise Angina (exang=1)`, `ST Depression (oldpeak=2.5)`, `Major Vessels (ca=2)`, `High Cholesterol (286 mg/dL)`.

---

### Case 2B: Low Risk Patient (Healthy Cardiac Function)

#### Clinical Input Parameters to Enter in UI:
| UI Field Name | Field Parameter Value to Type |
|---|---|
| **Age (years)** | `41` |
| **Sex** | `0` (Female) |
| **Chest Pain Type (cp)** | `0` (Typical Angina / Normal) |
| **Resting Blood Pressure (trestbps)** | `118` mmHg |
| **Serum Cholestoral (chol)** | `195` mg/dL |
| **Fasting Blood Sugar > 120 mg/dL (fbs)** | `0` (False) |
| **Resting ECG Results (restecg)** | `0` (Normal) |
| **Maximum Heart Rate (thalach)** | `172` bpm |
| **Exercise Induced Angina (exang)** | `0` (No) |
| **ST Depression (oldpeak)** | `0.0` mm |
| **Slope of Peak Exercise ST (slope)** | `2` (Upsloping) |
| **Major Vessels Colored (ca)** | `0` |
| **Thalassemia (thal)** | `1` (Normal) |

#### Expected UI Prediction Output:
* **Diagnosis Label:** `Low Risk / Normal (Heart Disease)`
* **Risk Level Tier:** `Low`
* **Calibrated Confidence Score:** `2.6% – 5.0%`
* **Primary Protective Factors:** `No Exercise Angina`, `High Exercise Max Heart Rate (172 bpm)`, `Zero ST Depression`.

---

## 3. Chronic Kidney Disease (CKD) Detection

### Case 3A: High Risk Patient (CKD Stage 3/4)

#### Clinical Input Parameters to Enter in UI:
| UI Field Name | Field Parameter Value to Type |
|---|---|
| **Age (years)** | `58` |
| **Blood Pressure (bp)** | `90` mmHg |
| **Specific Gravity (sg)** | `1.010` |
| **Albumin (al)** | `3` |
| **Sugar (su)** | `1` |
| **Red Blood Cells (rbc)** | `abnormal` |
| **Pus Cell (pc)** | `abnormal` |
| **Pus Cell Clumps (pcc)** | `present` |
| **Bacteria (ba)** | `notpresent` |
| **Blood Glucose Random (bgr)** | `240` mg/dL |
| **Blood Urea (bu)** | `75` mg/dL |
| **Serum Creatinine (sc)** | `4.2` mg/dL |
| **Sodium (sod)** | `128` mEq/L |
| **Potassium (pot)** | `5.2` mEq/L |
| **Hemoglobin (hemo)** | `8.4` gms |
| **Packed Cell Volume (pcv)** | `26` % |
| **White Blood Cell Count (wc)** | `11200` |
| **Red Blood Cell Count (rc)** | `3.1` |
| **Hypertension (htn)** | `yes` |
| **Diabetes Mellitus (dm)** | `yes` |
| **Coronary Artery Disease (cad)** | `no` |
| **Appetite (appet)** | `poor` |
| **Pedal Edema (pe)** | `yes` |
| **Anemia (ane)** | `yes` |

#### Expected UI Prediction Output:
* **Diagnosis Label:** `High Risk of Kidney Disease`
* **Risk Level Tier:** `High`
* **Calibrated Confidence Score:** `84.5% – 99.9%`
* **Primary SHAP Risk Drivers:** `Low Hemoglobin (8.4 gms)`, `Elevated Serum Creatinine (4.2 mg/dL)`, `Low Specific Gravity (1.010)`, `Albuminuria (al=3)`.

---

### Case 3B: Low Risk Patient (Healthy Renal Function)

#### Clinical Input Parameters to Enter in UI:
| UI Field Name | Field Parameter Value to Type |
|---|---|
| **Age (years)** | `34` |
| **Blood Pressure (bp)** | `70` mmHg |
| **Specific Gravity (sg)** | `1.025` |
| **Albumin (al)** | `0` |
| **Sugar (su)** | `0` |
| **Red Blood Cells (rbc)** | `normal` |
| **Pus Cell (pc)** | `normal` |
| **Pus Cell Clumps (pcc)** | `notpresent` |
| **Bacteria (ba)** | `notpresent` |
| **Blood Glucose Random (bgr)** | `95` mg/dL |
| **Blood Urea (bu)** | `22` mg/dL |
| **Serum Creatinine (sc)** | `0.8` mg/dL |
| **Sodium (sod)** | `142` mEq/L |
| **Potassium (pot)** | `4.2` mEq/L |
| **Hemoglobin (hemo)** | `15.8` gms |
| **Packed Cell Volume (pcv)** | `48` % |
| **White Blood Cell Count (wc)** | `6400` |
| **Red Blood Cell Count (rc)** | `5.2` |
| **Hypertension (htn)** | `no` |
| **Diabetes Mellitus (dm)** | `no` |
| **Coronary Artery Disease (cad)** | `no` |
| **Appetite (appet)** | `good` |
| **Pedal Edema (pe)** | `no` |
| **Anemia (ane)** | `no` |

#### Expected UI Prediction Output:
* **Diagnosis Label:** `Low Risk / Normal (Kidney Disease)`
* **Risk Level Tier:** `Low`
* **Calibrated Confidence Score:** `< 1.0%`
* **Primary Protective Factors:** `Normal Serum Creatinine (0.8 mg/dL)`, `Optimal Hemoglobin (15.8 gms)`, `Specific Gravity (1.025)`.

---

## 4. Liver Disease Detection

### Case 4A: High Risk Patient (Hepatic Dysfunction)

#### Clinical Input Parameters to Enter in UI:
| UI Field Name | Field Parameter Value to Type |
|---|---|
| **Age (years)** | `55` |
| **Gender** | `Male` |
| **Total Bilirubin (mg/dL)** | `4.8` |
| **Direct Bilirubin (mg/dL)** | `2.1` |
| **Alkaline Phosphatase (IU/L)** | `450` |
| **ALT / SGPT (IU/L)** | `120` |
| **AST / SGOT (IU/L)** | `180` |
| **Total Proteins (g/dL)** | `5.4` |
| **Albumin (g/dL)** | `2.2` |
| **Albumin / Globulin Ratio** | `0.6` |

#### Expected UI Prediction Output:
* **Diagnosis Label:** `Moderate/High Risk of Liver Disease`
* **Risk Level Tier:** `Moderate` / `High`
* **Calibrated Confidence Score:** `69.4% – 82.0%`
* **Primary SHAP Risk Drivers:** `Elevated Alkaline Phosphatase (450 IU/L)`, `Total Bilirubin (4.8 mg/dL)`, `Low Albumin/Globulin Ratio (0.6)`.

---

### Case 4B: Low Risk Patient (Normal Liver Function)

#### Clinical Input Parameters to Enter in UI:
| UI Field Name | Field Parameter Value to Type |
|---|---|
| **Age (years)** | `28` |
| **Gender** | `Female` |
| **Total Bilirubin (mg/dL)** | `0.7` |
| **Direct Bilirubin (mg/dL)** | `0.2` |
| **Alkaline Phosphatase (IU/L)** | `160` |
| **ALT / SGPT (IU/L)** | `22` |
| **AST / SGOT (IU/L)** | `25` |
| **Total Proteins (g/dL)** | `7.2` |
| **Albumin (g/dL)** | `4.1` |
| **Albumin / Globulin Ratio** | `1.3` |

#### Expected UI Prediction Output:
* **Diagnosis Label:** `Low Risk / Normal (Liver Disease)`
* **Risk Level Tier:** `Low`
* **Calibrated Confidence Score:** `< 25.0%`
* **Primary Protective Factors:** `Normal Bilirubin (0.7 mg/dL)`, `Normal Liver Enzymes (ALT 22, AST 25)`, `Healthy Albumin (4.1 g/dL)`.

---

## 5. Thyroid Disease Detection

### Case 5A: High Risk Patient (Hypothyroidism / Thyroid Dysfunction)

#### Clinical Input Parameters to Enter in UI:
| UI Field Label | Type / Unit | Value to Type in UI | Description & Clinical Context |
|---|---|---|---|
| **Age** | years | `58` | Patient Age |
| **Sex (0 = Female, 1 = Male)** | binary | `0` | 0 = Female, 1 = Male |
| **On Thyroxine Medication** | binary | `0` | 0 = No, 1 = Yes |
| **Query On Thyroxine** | binary | `0` | 0 = No, 1 = Yes |
| **On Antithyroid Medication** | binary | `0` | 0 = No, 1 = Yes |
| **Sick** | binary | `0` | 0 = No, 1 = Yes |
| **Pregnant** | binary | `0` | 0 = No, 1 = Yes |
| **Thyroid Surgery History** | binary | `0` | 0 = No, 1 = Yes |
| **I131 Radioiodine Treatment** | binary | `0` | 0 = No, 1 = Yes |
| **Query Hypothyroid** | binary | `1` | 1 = Yes (Clinical suspicion of hypothyroidism) |
| **Query Hyperthyroid** | binary | `0` | 0 = No, 1 = Yes |
| **Lithium Treatment** | binary | `0` | 0 = No, 1 = Yes |
| **Goitre Present** | binary | `0` | 0 = No, 1 = Yes |
| **Tumor Present** | binary | `0` | 0 = No, 1 = Yes |
| **Hypopituitary** | binary | `0` | 0 = No, 1 = Yes |
| **Psychiatric History** | binary | `0` | 0 = No, 1 = Yes |
| **TSH Measured (1/0)** | binary | `1` | 1 = TSH Lab Test Measured |
| **TSH Level** | mIU/L | `28.5` | Severely Elevated TSH (Primary Hypothyroidism) |
| **T3 Measured (1/0)** | binary | `0` | 0 = T3 Not Measured |
| **TT4 Measured (1/0)** | binary | `1` | 1 = TT4 Lab Test Measured |
| **TT4 Level** | nmol/L | `42.0` | Abnormally Low Total T4 |
| **T4U Measured (1/0)** | binary | `1` | 1 = T4U Lab Test Measured |
| **T4U Level** | ratio | `0.85` | Low T4 Resin Uptake Ratio |
| **FTI Measured (1/0)** | binary | `1` | 1 = FTI Lab Test Measured |
| **Free Thyroxine Index (FTI)** | index | `49.0` | Abnormally Low Free Thyroxine Index |

#### Expected UI Prediction Output:
* **Diagnosis Label:** `High Risk of Thyroid Disease`
* **Risk Level Tier:** `High`
* **Calibrated Confidence Score:** `95.0% – 99.8%` (Model output: ~99.2%)
* **Primary SHAP Risk Drivers:** `Elevated TSH Level (28.5 mIU/L)`, `Low TT4 Level (42.0 nmol/L)`, `Low Free Thyroxine Index (49.0)`.

---

### Case 5B: Low Risk Patient (Euthyroid / Normal)

#### Clinical Input Parameters to Enter in UI:
| UI Field Label | Type / Unit | Value to Type in UI | Description & Clinical Context |
|---|---|---|---|
| **Age** | years | `41` | Patient Age |
| **Sex (0 = Female, 1 = Male)** | binary | `0` | 0 = Female, 1 = Male |
| **On Thyroxine Medication** | binary | `0` | 0 = No, 1 = Yes |
| **Query On Thyroxine** | binary | `0` | 0 = No, 1 = Yes |
| **On Antithyroid Medication** | binary | `0` | 0 = No, 1 = Yes |
| **Sick** | binary | `0` | 0 = No, 1 = Yes |
| **Pregnant** | binary | `0` | 0 = No, 1 = Yes |
| **Thyroid Surgery History** | binary | `0` | 0 = No, 1 = Yes |
| **I131 Radioiodine Treatment** | binary | `0` | 0 = No, 1 = Yes |
| **Query Hypothyroid** | binary | `0` | 0 = No, 1 = Yes |
| **Query Hyperthyroid** | binary | `0` | 0 = No, 1 = Yes |
| **Lithium Treatment** | binary | `0` | 0 = No, 1 = Yes |
| **Goitre Present** | binary | `0` | 0 = No, 1 = Yes |
| **Tumor Present** | binary | `0` | 0 = No, 1 = Yes |
| **Hypopituitary** | binary | `0` | 0 = No, 1 = Yes |
| **Psychiatric History** | binary | `0` | 0 = No, 1 = Yes |
| **TSH Measured (1/0)** | binary | `1` | 1 = TSH Lab Test Measured |
| **TSH Level** | mIU/L | `1.3` | Normal TSH Level (0.4 – 4.0 mIU/L) |
| **T3 Measured (1/0)** | binary | `0` | 0 = T3 Not Measured |
| **TT4 Measured (1/0)** | binary | `1` | 1 = TT4 Lab Test Measured |
| **TT4 Level** | nmol/L | `125.0` | Normal Total T4 Level |
| **T4U Measured (1/0)** | binary | `1` | 1 = T4U Lab Test Measured |
| **T4U Level** | ratio | `1.14` | Normal T4 Resin Uptake Ratio |
| **FTI Measured (1/0)** | binary | `1` | 1 = FTI Lab Test Measured |
| **Free Thyroxine Index (FTI)** | index | `109.0` | Normal Free Thyroxine Index |

#### Expected UI Prediction Output:
* **Diagnosis Label:** `Low Risk / Normal (Thyroid Disease)`
* **Risk Level Tier:** `Low`
* **Calibrated Confidence Score:** `0.3% – 2.0%` (Model output: ~0.3%)
* **Primary Protective Factors:** `Normal TSH Level (1.3 mIU/L)`, `Normal Free Thyroxine Index (109.0)`, `Normal TT4 Level (125.0 nmol/L)`.

---

## Operational Risk Tiers & Clinical Interpretation Guide

* **Low Risk (`< 40.0%` Calibrated Probability):**
  * Clinical interpretation: Standard routine monitoring recommended; no acute intervention required.
* **Moderate Risk (`40.0% – 70.0%` Calibrated Probability):**
  * Clinical interpretation: Borderline/intermediate risk; lifestyle intervention, diet adjustment, and follow-up lab screening advised within 3-6 months.
* **High Risk (`> 70.0%` Calibrated Probability):**
  * Clinical interpretation: High clinical probability of pathology; urgent specialist referral and diagnostic confirmation strongly recommended.
