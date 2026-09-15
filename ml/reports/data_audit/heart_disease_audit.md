# Data Audit Report: Heart Disease (heart_disease)

- **Dataset File**: `datasets/Kaggle/heart.csv`
- **Total Rows**: `1025`
- **Total Features**: `13` (Numeric: 13, Categorical: 0)
- **Duplicate Rows**: `723` (70.54%)
- **Duplicate Feature Combinations**: `723` (70.54%)

---

## 1. Class Distribution
- **Positive Class (Disease = 1)**: `48.68%` (499 samples)
- **Negative Class (Normal = 0)**: `51.32%` (526 samples)
- **Imbalance Status**: `MODERATELY BALANCED`

---

## 2. Missing Value Analysis
| Feature Name | Type | Missing Count | Missing % |
| :--- | :--- | ---: | ---: |
| `age` | Numeric | 0 | 0.00% |
| `sex` | Numeric | 0 | 0.00% |
| `cp` | Numeric | 0 | 0.00% |
| `trestbps` | Numeric | 0 | 0.00% |
| `chol` | Numeric | 0 | 0.00% |
| `fbs` | Numeric | 0 | 0.00% |
| `restecg` | Numeric | 0 | 0.00% |
| `thalach` | Numeric | 0 | 0.00% |
| `exang` | Numeric | 0 | 0.00% |
| `oldpeak` | Numeric | 0 | 0.00% |
| `slope` | Numeric | 0 | 0.00% |
| `ca` | Numeric | 0 | 0.00% |
| `thal` | Numeric | 0 | 0.00% |

---

## 3. Outliers & Correlation / Leakage Check
| Feature Name | Outlier Count (IQR) | Pearson Corr with Target | Mutual Information |
| :--- | ---: | ---: | ---: |
| `age` | 0 | 0.2293 | 0.0512 |
| `sex` | 0 | 0.2795 | 0.0335 |
| `cp` | 0 | -0.4349 | 0.1358 |
| `trestbps` | 30 | 0.1388 | 0.0771 |
| `chol` | 16 | 0.1000 | 0.2753 |
| `fbs` | 153 | 0.0412 | 0.0000 |
| `restecg` | 0 | -0.1345 | 0.0015 |
| `thalach` | 4 | -0.4229 | 0.1477 |
| `exang` | 0 | 0.4380 | 0.0945 |
| `oldpeak` | 7 | 0.4384 | 0.1326 |
| `slope` | 0 | -0.3455 | 0.0501 |
| `ca` | 87 | 0.3821 | 0.1206 |
| `thal` | 7 | 0.3378 | 0.1366 |
