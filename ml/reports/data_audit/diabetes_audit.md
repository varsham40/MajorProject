# Data Audit Report: Diabetes (diabetes)

- **Dataset File**: `datasets/Kaggle/diabetes.csv`
- **Total Rows**: `768`
- **Total Features**: `8` (Numeric: 8, Categorical: 0)
- **Duplicate Rows**: `0` (0.0%)
- **Duplicate Feature Combinations**: `0` (0.0%)

---

## 1. Class Distribution
- **Positive Class (Disease = 1)**: `34.90%` (268 samples)
- **Negative Class (Normal = 0)**: `65.10%` (500 samples)
- **Imbalance Status**: `MODERATELY BALANCED`

---

## 2. Missing Value Analysis
| Feature Name | Type | Missing Count | Missing % |
| :--- | :--- | ---: | ---: |
| `Pregnancies` | Numeric | 0 | 0.00% |
| `Glucose` | Numeric | 0 | 0.00% |
| `BloodPressure` | Numeric | 0 | 0.00% |
| `SkinThickness` | Numeric | 0 | 0.00% |
| `Insulin` | Numeric | 0 | 0.00% |
| `BMI` | Numeric | 0 | 0.00% |
| `DiabetesPedigreeFunction` | Numeric | 0 | 0.00% |
| `Age` | Numeric | 0 | 0.00% |

---

## 3. Outliers & Correlation / Leakage Check
| Feature Name | Outlier Count (IQR) | Pearson Corr with Target | Mutual Information |
| :--- | ---: | ---: | ---: |
| `Pregnancies` | 4 | 0.2219 | 0.0610 |
| `Glucose` | 5 | 0.4666 | 0.1146 |
| `BloodPressure` | 45 | 0.0651 | 0.0000 |
| `SkinThickness` | 1 | 0.0748 | 0.0047 |
| `Insulin` | 34 | 0.1305 | 0.0119 |
| `BMI` | 19 | 0.2927 | 0.0801 |
| `DiabetesPedigreeFunction` | 29 | 0.1738 | 0.0146 |
| `Age` | 9 | 0.2384 | 0.0514 |
