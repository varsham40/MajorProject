# Data Audit Report: Liver Disease (liver_disease)

- **Dataset File**: `datasets/Kaggle/indian_liver_patient.csv`
- **Total Rows**: `583`
- **Total Features**: `10` (Numeric: 9, Categorical: 1)
- **Duplicate Rows**: `13` (2.23%)
- **Duplicate Feature Combinations**: `13` (2.23%)

---

## 1. Class Distribution
- **Positive Class (Disease = 1)**: `71.36%` (416 samples)
- **Negative Class (Normal = 0)**: `28.64%` (167 samples)
- **Imbalance Status**: `MODERATELY BALANCED`

---

## 2. Missing Value Analysis
| Feature Name | Type | Missing Count | Missing % |
| :--- | :--- | ---: | ---: |
| `Age` | Numeric | 0 | 0.00% |
| `Gender` | Categorical | 0 | 0.00% |
| `Total_Bilirubin` | Numeric | 0 | 0.00% |
| `Direct_Bilirubin` | Numeric | 0 | 0.00% |
| `Alkaline_Phosphotase` | Numeric | 0 | 0.00% |
| `Alamine_Aminotransferase` | Numeric | 0 | 0.00% |
| `Aspartate_Aminotransferase` | Numeric | 0 | 0.00% |
| `Total_Protiens` | Numeric | 0 | 0.00% |
| `Albumin` | Numeric | 0 | 0.00% |
| `Albumin_and_Globulin_Ratio` | Numeric | 4 | 0.69% |

---

## 3. Outliers & Correlation / Leakage Check
| Feature Name | Outlier Count (IQR) | Pearson Corr with Target | Mutual Information |
| :--- | ---: | ---: | ---: |
| `Age` | 0 | 0.1374 | 0.0650 |
| `Total_Bilirubin` | 84 | 0.2202 | 0.0582 |
| `Direct_Bilirubin` | 81 | 0.2460 | 0.0519 |
| `Alkaline_Phosphotase` | 69 | 0.1849 | 0.0346 |
| `Alamine_Aminotransferase` | 73 | 0.1634 | 0.0565 |
| `Aspartate_Aminotransferase` | 66 | 0.1519 | 0.0603 |
| `Total_Protiens` | 8 | -0.0350 | 0.0000 |
| `Albumin` | 0 | -0.1614 | 0.0301 |
| `Albumin_and_Globulin_Ratio` | 10 | -0.1621 | 0.0169 |
