import os
import sys
import yaml
import json
import numpy as np
import pandas as pd
from datetime import datetime

from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier

import xgboost as xgb
import lightgbm as lgb
from catboost import CatBoostClassifier

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    precision_recall_curve, auc
)
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

PROJECT_ROOT = r"e:\1_Final_MicroProject\Majorproject_Varsha"
CONFIG_PATH = os.path.join(PROJECT_ROOT, "ml", "config", "disease_features.yaml")
REPORTS_DIR = os.path.join(PROJECT_ROOT, "ml", "reports", "model_comparison")
os.makedirs(REPORTS_DIR, exist_ok=True)

def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def get_candidate_models():
    return {
        "XGBoost": xgb.XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42, eval_metric='logloss'),
        "LightGBM": lgb.LGBMClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42, verbose=-1),
        "CatBoost": CatBoostClassifier(iterations=100, learning_rate=0.1, depth=5, random_seed=42, verbose=0),
        "RandomForest": RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42),
        "GradientBoosting": GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42),
        "LogisticRegression": LogisticRegression(max_iter=1000, C=1.0, random_state=42),
        "SVC": SVC(probability=True, C=1.0, random_state=42),
        "MLPClassifier": MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=500, random_state=42)
    }

def evaluate_disease(disease_key: str, disease_cfg: dict):
    csv_path = os.path.join(PROJECT_ROOT, disease_cfg["dataset_path"])
    df = pd.read_csv(csv_path)
    df.columns = [c.strip() for c in df.columns]

    target_col = disease_cfg["target_column"].strip()
    positive_label = disease_cfg["positive_label"]

    if disease_key == 'kidney_disease':
        df[target_col] = df[target_col].astype(str).str.strip().str.replace('\t', '')
        df[target_col] = df[target_col].apply(lambda x: 1 if x == positive_label else 0)
    elif disease_key == 'liver_disease':
        df[target_col] = df[target_col].apply(lambda x: 1 if x == positive_label else 0)
    else:
        df[target_col] = df[target_col].astype(str).str.strip().apply(
            lambda x: 1 if str(x) == str(positive_label) else 0
        )

    feature_cfgs = disease_cfg["features"]
    expected_features = [f["name"].strip() for f in feature_cfgs]
    existing_features = [f for f in expected_features if f in df.columns]

    X = df[existing_features].copy()
    y = df[target_col].values

    num_cols = []
    cat_cols = []
    for f in feature_cfgs:
        fname = f["name"].strip()
        if fname not in existing_features:
            continue
        if f["type"] in ["float", "int"]:
            num_cols.append(fname)
            X[fname] = pd.to_numeric(X[fname].astype(str).str.strip().replace('?', np.nan), errors='coerce')
        else:
            cat_cols.append(fname)
            X[fname] = X[fname].astype(str).str.strip().replace('?', np.nan)

    # Held-out 20% test set
    X_dev, X_test, y_dev, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    candidate_models = get_candidate_models()
    model_results = {}

    for model_name, model_obj in candidate_models.items():
        accs, precs, recs, f1s, aucs, pr_aucs = [], [], [], [], [], []

        for train_idx, val_idx in skf.split(X_dev, y_dev):
            X_tr, y_tr = X_dev.iloc[train_idx], y_dev[train_idx]
            X_va, y_va = X_dev.iloc[val_idx], y_dev[val_idx]

            transformers = []
            if num_cols:
                num_transformer = Pipeline(steps=[
                    ('imputer', SimpleImputer(strategy='median')),
                    ('scaler', StandardScaler())
                ])
                transformers.append(('num', num_transformer, num_cols))

            if cat_cols:
                cat_transformer = Pipeline(steps=[
                    ('imputer', SimpleImputer(strategy='most_frequent')),
                    ('encoder', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1))
                ])
                transformers.append(('cat', cat_transformer, cat_cols))

            preprocessor = ColumnTransformer(transformers=transformers)
            pipe = Pipeline(steps=[
                ('preprocessor', preprocessor),
                ('classifier', model_obj)
            ])

            pipe.fit(X_tr, y_tr)
            y_pred = pipe.predict(X_va)

            if hasattr(pipe, "predict_proba"):
                y_prob = pipe.predict_proba(X_va)[:, 1]
            else:
                y_prob = y_pred

            accs.append(accuracy_score(y_va, y_pred))
            precs.append(precision_score(y_va, y_pred, zero_division=0))
            recs.append(recall_score(y_va, y_pred, zero_division=0))
            f1s.append(f1_score(y_va, y_pred, zero_division=0))

            if len(np.unique(y_va)) > 1:
                aucs.append(roc_auc_score(y_va, y_prob))
                p_curve, r_curve, _ = precision_recall_curve(y_va, y_prob)
                pr_aucs.append(auc(r_curve, p_curve))
            else:
                aucs.append(0.5)
                pr_aucs.append(0.5)

        model_results[model_name] = {
            "Accuracy": f"{np.mean(accs):.4f} +/- {np.std(accs):.4f}",
            "Precision": f"{np.mean(precs):.4f} +/- {np.std(precs):.4f}",
            "Recall": f"{np.mean(recs):.4f} +/- {np.std(recs):.4f}",
            "F1": f"{np.mean(f1s):.4f} +/- {np.std(f1s):.4f}",
            "ROC-AUC": f"{np.mean(aucs):.4f} +/- {np.std(aucs):.4f}",
            "PR-AUC": f"{np.mean(pr_aucs):.4f} +/- {np.std(pr_aucs):.4f}",
            "mean_acc": float(np.mean(accs)),
            "mean_roc_auc": float(np.mean(aucs)),
            "mean_f1": float(np.mean(f1s))
        }

    # Generate Markdown Table
    md_lines = [
        f"# Phase 2 Model Comparison — {disease_cfg['disease_name']}",
        f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "| Model | CV Accuracy | Precision | Recall | F1 | ROC-AUC | PR-AUC |",
        "|---|---|---|---|---|---|---|"
    ]
    for mname, mres in model_results.items():
        md_lines.append(
            f"| {mname} | {mres['Accuracy']} | {mres['Precision']} | {mres['Recall']} | {mres['F1']} | {mres['ROC-AUC']} | {mres['PR-AUC']} |"
        )

    out_md = os.path.join(REPORTS_DIR, f"{disease_key}_model_table.md")
    with open(out_md, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

    print(f"[{disease_cfg['disease_name']}] Phase 2 Model Comparison Complete. Saved to {out_md}")
    return model_results

def main():
    config = load_config()
    summary_results = {}
    for disease_key, disease_cfg in config.items():
        res = evaluate_disease(disease_key, disease_cfg)
        summary_results[disease_key] = res

    summary_md = [
        "# Phase 2 Candidate Model Comparison Summary",
        f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "## Top Performing Model Per Disease (by Mean ROC-AUC)",
        "",
        "| Disease | Top Model | CV Accuracy | CV F1 | CV ROC-AUC |",
        "|---|---|---|---|---|"
    ]

    for dkey, dres in summary_results.items():
        top_model = max(dres.items(), key=lambda x: x[1]["mean_roc_auc"])
        mname = top_model[0]
        mmetrics = top_model[1]
        summary_md.append(f"| {dkey.replace('_', ' ').title()} | **{mname}** | {mmetrics['Accuracy']} | {mmetrics['F1']} | {mmetrics['ROC-AUC']} |")

    sum_out = os.path.join(REPORTS_DIR, "SUMMARY.md")
    with open(sum_out, "w", encoding="utf-8") as f:
        f.write("\n".join(summary_md))
    print(f"Phase 2 Summary saved to {sum_out}")

    # Write copy to ml/scripts/phase2_model_comparison.py
    target_script = os.path.join(PROJECT_ROOT, "ml", "scripts", "phase2_model_comparison.py")
    with open(__file__, "r", encoding="utf-8") as rf:
        content = rf.read()
    with open(target_script, "w", encoding="utf-8") as wf:
        wf.write(content)

if __name__ == "__main__":
    main()
