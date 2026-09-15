import os
import sys
import yaml
import json
import numpy as np
import pandas as pd
from datetime import datetime

from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    precision_recall_curve, auc
)
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CONFIG_PATH = os.path.join(PROJECT_ROOT, "ml", "config", "disease_features.yaml")
REPORTS_DIR = os.path.join(PROJECT_ROOT, "ml", "reports", "v1_baseline")
os.makedirs(REPORTS_DIR, exist_ok=True)

def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def get_v1_voting_classifier():
    rf = RandomForestClassifier(n_estimators=120, random_state=42, max_depth=12)
    gb = xgb.XGBClassifier(n_estimators=120, learning_rate=0.08, max_depth=5, random_state=42, eval_metric='logloss') if HAS_XGBOOST else GradientBoostingClassifier(n_estimators=120, learning_rate=0.08, max_depth=5, random_state=42)
    mlp = MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=500, random_state=42)
    lr = LogisticRegression(max_iter=1000, random_state=42, C=1.0)
    svc = SVC(probability=True, kernel='rbf', C=1.0, random_state=42)
    return VotingClassifier(
        estimators=[('rf', rf), ('gb', gb), ('mlp', mlp), ('lr', lr), ('svc', svc)],
        voting='soft'
    )

def evaluate_v1_baseline(disease_key: str, disease_cfg: dict):
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

    # Carve out 20% held-out test set
    X_dev, X_test, y_dev, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # 5-Fold Stratified Cross-Validation on Development set
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    accs, precs, recs, f1s, aucs, pr_aucs = [], [], [], [], [], []

    for fold, (train_idx, val_idx) in enumerate(skf.split(X_dev, y_dev)):
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
        full_pipe = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', get_v1_voting_classifier())
        ])

        full_pipe.fit(X_tr, y_tr)

        y_pred = full_pipe.predict(X_va)
        y_proba = full_pipe.predict_proba(X_va)[:, 1]

        accs.append(accuracy_score(y_va, y_pred))
        precs.append(precision_score(y_va, y_pred, zero_division=0))
        recs.append(recall_score(y_va, y_pred, zero_division=0))
        f1s.append(f1_score(y_va, y_pred, zero_division=0))
        
        try:
            aucs.append(roc_auc_score(y_va, y_proba))
        except Exception:
            aucs.append(accs[-1])

        try:
            p_prec, p_rec, _ = precision_recall_curve(y_va, y_proba)
            pr_aucs.append(auc(p_rec, p_prec))
        except Exception:
            pr_aucs.append(accs[-1])

    results = {
        "disease_key": disease_key,
        "disease_name": disease_cfg["disease_name"],
        "cv_folds": 5,
        "metrics": {
            "accuracy": {"mean": round(float(np.mean(accs)), 4), "std": round(float(np.std(accs)), 4)},
            "precision": {"mean": round(float(np.mean(precs)), 4), "std": round(float(np.std(precs)), 4)},
            "recall": {"mean": round(float(np.mean(recs)), 4), "std": round(float(np.std(recs)), 4)},
            "f1_score": {"mean": round(float(np.mean(f1s)), 4), "std": round(float(np.std(f1s)), 4)},
            "roc_auc": {"mean": round(float(np.mean(aucs)), 4), "std": round(float(np.std(aucs)), 4)},
            "pr_auc": {"mean": round(float(np.mean(pr_aucs)), 4), "std": round(float(np.std(pr_aucs)), 4)},
        }
    }

    out_file = os.path.join(REPORTS_DIR, f"{disease_key}_cv_results.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"[{disease_cfg['disease_name']}] Stratified 5-Fold CV Accuracy: {results['metrics']['accuracy']['mean']} +/- {results['metrics']['accuracy']['std']} | ROC-AUC: {results['metrics']['roc_auc']['mean']} +/- {results['metrics']['roc_auc']['std']}")
    return results

def main():
    config = load_config()
    summary = []
    for key, cfg in config.items():
        res = evaluate_v1_baseline(key, cfg)
        summary.append(res)

    summary_md = "# Phase 1 -- V1 Voting Ensemble Stratified 5-Fold CV Baseline Summary\n\n"
    summary_md += "| Disease Domain | CV Accuracy (mean +/- std) | Precision | Recall | F1 Score | ROC-AUC | PR-AUC |\n"
    summary_md += "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n"

    for s in summary:
        m = s["metrics"]
        summary_md += f"| **{s['disease_name']}** | {m['accuracy']['mean']} +/- {m['accuracy']['std']} | {m['precision']['mean']} +/- {m['precision']['std']} | {m['recall']['mean']} +/- {m['recall']['std']} | {m['f1_score']['mean']} +/- {m['f1_score']['std']} | **{m['roc_auc']['mean']} +/- {m['roc_auc']['std']}** | {m['pr_auc']['mean']} +/- {m['pr_auc']['std']} |\n"

    summary_md += "\n---\n- **Leakage Prevention**: All preprocessing (imputation, scaling, encoding) refit inside each Stratified K-Fold split.\n- **Held-Out Test Set**: 20% carved out prior to CV and held untouched for Phase 5 final evaluation.\n"
    
    summary_path = os.path.join(REPORTS_DIR, "SUMMARY.md")
    with open(summary_path, "w", encoding="utf-8") as f:
        f.write(summary_md)

    print(f"\nPhase 1 Complete! Summary saved to {summary_path}")

if __name__ == "__main__":
    main()
