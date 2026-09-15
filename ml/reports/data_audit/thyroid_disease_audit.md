# Data Audit Report: Thyroid Disease (thyroid_disease)

- **Dataset File**: `datasets/Kaggle/Thydroid_disease/cleaned_dataset_Thyroid1.csv`
- **Total Rows**: `3771`
- **Total Features**: `25` (Numeric: 25, Categorical: 0)
- **Duplicate Rows**: `63` (1.67%)
- **Duplicate Feature Combinations**: `63` (1.67%)

---

## 1. Class Distribution
- **Positive Class (Disease = 1)**: `7.72%` (291 samples)
- **Negative Class (Normal = 0)**: `92.28%` (3480 samples)
- **Imbalance Status**: `HEAVILY IMBALANCED`

---

## 2. Missing Value Analysis
| Feature Name | Type | Missing Count | Missing % |
| :--- | :--- | ---: | ---: |
| `age` | Numeric | 0 | 0.00% |
| `sex` | Numeric | 0 | 0.00% |
| `on thyroxine` | Numeric | 0 | 0.00% |
| `query on thyroxine` | Numeric | 0 | 0.00% |
| `on antithyroid medication` | Numeric | 0 | 0.00% |
| `sick` | Numeric | 0 | 0.00% |
| `pregnant` | Numeric | 0 | 0.00% |
| `thyroid surgery` | Numeric | 0 | 0.00% |
| `I131 treatment` | Numeric | 0 | 0.00% |
| `query hypothyroid` | Numeric | 0 | 0.00% |
| `query hyperthyroid` | Numeric | 0 | 0.00% |
| `lithium` | Numeric | 0 | 0.00% |
| `goitre` | Numeric | 0 | 0.00% |
| `tumor` | Numeric | 0 | 0.00% |
| `hypopituitary` | Numeric | 0 | 0.00% |
| `psych` | Numeric | 0 | 0.00% |
| `TSH measured` | Numeric | 0 | 0.00% |
| `TSH` | Numeric | 0 | 0.00% |
| `T3 measured` | Numeric | 0 | 0.00% |
| `TT4 measured` | Numeric | 0 | 0.00% |
| `TT4` | Numeric | 0 | 0.00% |
| `T4U measured` | Numeric | 0 | 0.00% |
| `T4U` | Numeric | 0 | 0.00% |
| `FTI measured` | Numeric | 0 | 0.00% |
| `FTI` | Numeric | 0 | 0.00% |

---

## 3. Outliers & Correlation / Leakage Check
| Feature Name | Outlier Count (IQR) | Pearson Corr with Target | Mutual Information |
| :--- | ---: | ---: | ---: |
| `age` | 0 | -0.0017 | 0.0113 |
| `sex` | 0 | -0.0509 | 0.0000 |
| `on thyroxine` | 464 | -0.0811 | 0.0037 |
| `query on thyroxine` | 50 | -0.0075 | 0.0000 |
| `on antithyroid medication` | 43 | -0.0217 | 0.0021 |
| `sick` | 147 | -0.0018 | 0.0000 |
| `pregnant` | 53 | -0.0345 | 0.0000 |
| `thyroid surgery` | 53 | -0.0176 | 0.0000 |
| `I131 treatment` | 59 | 0.0036 | 0.0000 |
| `query hypothyroid` | 234 | 0.0863 | 0.0038 |
| `query hyperthyroid` | 237 | -0.0135 | 0.0042 |
| `lithium` | 18 | -0.0056 | 0.0000 |
| `goitre` | 34 | -0.0276 | 0.0028 |
| `tumor` | 96 | 0.0037 | 0.0000 |
| `hypopituitary` | 1 | -0.0047 | 0.0028 |
| `psych` | 184 | -0.0286 | 0.0000 |
| `TSH measured` | 369 | 0.0952 | 0.0108 |
| `TSH` | 258 | 0.4240 | 0.2215 |
| `T3 measured` | 769 | 0.0329 | 0.0003 |
| `TT4 measured` | 231 | 0.0531 | 0.0000 |
| `TT4` | 215 | -0.2917 | 0.0615 |
| `T4U measured` | 387 | 0.0159 | 0.0060 |
| `T4U` | 205 | 0.0284 | 0.0035 |
| `FTI measured` | 385 | 0.0155 | 0.0000 |
| `FTI` | 274 | -0.3138 | 0.0644 |
