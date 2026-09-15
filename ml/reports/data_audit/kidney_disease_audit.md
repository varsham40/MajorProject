# Data Audit Report: Kidney Disease (kidney_disease)

- **Dataset File**: `datasets/Kaggle/Kidney/kidney_disease_train.csv`
- **Total Rows**: `280`
- **Total Features**: `24` (Numeric: 14, Categorical: 10)
- **Duplicate Rows**: `0` (0.0%)
- **Duplicate Feature Combinations**: `0` (0.0%)

---

## 1. Class Distribution
- **Positive Class (Disease = 1)**: `62.14%` (174 samples)
- **Negative Class (Normal = 0)**: `37.86%` (106 samples)
- **Imbalance Status**: `MODERATELY BALANCED`

---

## 2. Missing Value Analysis
| Feature Name | Type | Missing Count | Missing % |
| :--- | :--- | ---: | ---: |
| `age` | Numeric | 5 | 1.79% |
| `bp` | Numeric | 9 | 3.21% |
| `sg` | Numeric | 36 | 12.86% |
| `al` | Numeric | 35 | 12.50% |
| `su` | Numeric | 38 | 13.57% |
| `rbc` | Categorical | 0 | 0.00% |
| `pc` | Categorical | 0 | 0.00% |
| `pcc` | Categorical | 0 | 0.00% |
| `ba` | Categorical | 0 | 0.00% |
| `bgr` | Numeric | 33 | 11.79% |
| `bu` | Numeric | 14 | 5.00% |
| `sc` | Numeric | 12 | 4.29% |
| `sod` | Numeric | 67 | 23.93% |
| `pot` | Numeric | 68 | 24.29% |
| `hemo` | Numeric | 39 | 13.93% |
| `pcv` | Numeric | 51 | 18.21% |
| `wc` | Numeric | 78 | 27.86% |
| `rc` | Numeric | 94 | 33.57% |
| `htn` | Categorical | 0 | 0.00% |
| `dm` | Categorical | 0 | 0.00% |
| `cad` | Categorical | 0 | 0.00% |
| `appet` | Categorical | 0 | 0.00% |
| `pe` | Categorical | 0 | 0.00% |
| `ane` | Categorical | 0 | 0.00% |

---

## 3. Outliers & Correlation / Leakage Check
| Feature Name | Outlier Count (IQR) | Pearson Corr with Target | Mutual Information |
| :--- | ---: | ---: | ---: |
| `age` | 5 | 0.2580 | 0.1044 |
| `bp` | 25 | 0.2679 | 0.1236 |
| `sg` | 0 | -0.6745 ⚠️ HIGH CORRELATION | 0.3292 |
| `al` | 0 | 0.5268 | 0.2340 |
| `su` | 43 | 0.2935 | 0.0250 |
| `bgr` | 18 | 0.4048 | 0.1946 |
| `bu` | 25 | 0.3569 | 0.1669 |
| `sc` | 32 | 0.2800 | 0.3799 |
| `sod` | 13 | -0.3071 | 0.2296 |
| `pot` | 3 | 0.0743 | 0.1993 |
| `hemo` | 1 | -0.7083 ⚠️ HIGH CORRELATION | 0.4239 |
| `pcv` | 1 | -0.6456 | 0.3594 |
| `wc` | 8 | 0.1773 | 0.1260 |
| `rc` | 1 | -0.5474 | 0.3629 |

### Special Investigation: Kidney Disease 100% Accuracy / 1.0 ROC-AUC Analysis
- **Duplicate Rows**: 0 total duplicate rows found in dataset.
- **High Correlation Features (|r| > 0.6)**: {'sg': -0.6745, 'hemo': -0.7083, 'pcv': -0.6456}
- **Hemoglobin (`hemo`) correlation with CKD**: -0.7083
- **Packed Cell Volume (`pcv`) correlation**: -0.6456
- **Serum Creatinine (`sc`) correlation**: 0.28
- **Key Finding**: In CKD diagnosis, severe anemia (`hemo < 9.0 g/dL`) and elevated serum creatinine (`sc > 3.0 mg/dL`) are near-deterministic biological markers of stage 4/5 Chronic Kidney Disease. The dataset features are exceptionally separable. However, in V1 single 80/20 split, preprocessing fit before split or shared duplicates could artificially inflates metrics. Phase 1 Stratified 5-Fold CV will validate whether 100% holds cleanly across strict CV folds without leakage.
