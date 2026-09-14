import os
import sys
import json
import yaml
import time
import pickle
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split
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
    confusion_matrix, roc_curve
)
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import shap

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, PROJECT_ROOT)

CONFIG_PATH = os.path.join(PROJECT_ROOT, "ml", "config", "disease_features.yaml")
ARTIFACTS_DIR = os.path.join(PROJECT_ROOT, "ml", "artifacts")

def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def get_classifier(algorithm_name: str):
    alg = algorithm_name.strip()
    if alg in ["VotingEnsemble", "Ensemble", "VotingClassifier"]:
        rf = RandomForestClassifier(n_estimators=120, random_state=42, max_depth=12)
        gb = xgb.XGBClassifier(n_estimators=120, learning_rate=0.08, max_depth=5, random_state=42, eval_metric='logloss') if HAS_XGBOOST else GradientBoostingClassifier(n_estimators=120, learning_rate=0.08, max_depth=5, random_state=42)
        mlp = MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=500, random_state=42)
        lr = LogisticRegression(max_iter=1000, random_state=42, C=1.0)
        svc = SVC(probability=True, kernel='rbf', C=1.0, random_state=42)
        return VotingClassifier(
            estimators=[('rf', rf), ('gb', gb), ('mlp', mlp), ('lr', lr), ('svc', svc)],
            voting='soft'
        )
    elif alg == "RandomForestClassifier":
        return RandomForestClassifier(n_estimators=120, random_state=42, max_depth=12)
    elif alg == "GradientBoostingClassifier":
        return GradientBoostingClassifier(n_estimators=120, learning_rate=0.08, max_depth=5, random_state=42)
    elif alg == "XGBClassifier":
        if HAS_XGBOOST:
            return xgb.XGBClassifier(n_estimators=120, learning_rate=0.08, max_depth=5, random_state=42, eval_metric='logloss')
        else:
            return GradientBoostingClassifier(n_estimators=120, learning_rate=0.08, max_depth=5, random_state=42)
    elif alg == "LogisticRegression":
        return LogisticRegression(max_iter=1000, random_state=42, C=1.0)
    elif alg == "SVC":
        return SVC(probability=True, kernel='rbf', C=1.0, random_state=42)
    elif alg == "MLPClassifier":
        return MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=500, random_state=42)
    else:
        # Default fallback
        return RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)

def preprocess_and_train(disease_key: str, disease_cfg: dict, custom_csv_path: str = None, algorithm_name: str = "RandomForestClassifier"):
    print(f"\n==========================================")
    print(f" Training Model ({algorithm_name}) for: {disease_cfg['disease_name']} ({disease_key})")
    print(f"==========================================")

    if custom_csv_path and os.path.exists(custom_csv_path):
        csv_path = custom_csv_path
        dataset_name = os.path.basename(custom_csv_path)
    else:
        csv_path = os.path.join(PROJECT_ROOT, disease_cfg['dataset_path'])
        dataset_name = os.path.basename(csv_path)

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset file not found at: {csv_path}")

    df = pd.read_csv(csv_path)
    print(f"Loaded dataset ({dataset_name}): {df.shape[0]} rows, {df.shape[1]} columns.")

    # Clean whitespace in column names
    df.columns = [c.strip() for c in df.columns]

    target_col = disease_cfg['target_column'].strip()
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in dataset columns: {list(df.columns)}")

    # Clean target label
    positive_label = disease_cfg['positive_label']
    if disease_key == 'kidney_disease':
        df[target_col] = df[target_col].astype(str).str.strip().str.replace('\t', '')
        df[target_col] = df[target_col].apply(lambda x: 1 if x == positive_label else 0)
    elif disease_key == 'liver_disease':
        df[target_col] = df[target_col].apply(lambda x: 1 if x == positive_label else 0)
    else:
        df[target_col] = df[target_col].astype(str).str.strip().apply(
            lambda x: 1 if str(x) == str(positive_label) else 0
        )

    feature_cfgs = disease_cfg['features']
    feature_names = [f['name'].strip() for f in feature_cfgs]

    existing_features = [f for f in feature_names if f in df.columns]
    if not existing_features:
        raise ValueError(f"No matching feature columns found in dataset. Expected: {feature_names}")

    X = df[existing_features].copy()
    y = df[target_col].values

    num_cols = []
    cat_cols = []

    for f_info in feature_cfgs:
        fname = f_info['name'].strip()
        if fname not in existing_features:
            continue
        if f_info['type'] in ['float', 'int']:
            X[fname] = pd.to_numeric(X[fname].astype(str).str.strip().replace('?', np.nan), errors='coerce')
            num_cols.append(fname)
        else:
            X[fname] = X[fname].astype(str).str.strip().replace('?', np.nan)
            cat_cols.append(fname)

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

    if len(np.unique(y)) > 1:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    else:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    start_time = time.time()
    
    X_train_trans = preprocessor.fit_transform(X_train)
    X_test_trans = preprocessor.transform(X_test)

    # Instantiate chosen model
    model = get_classifier(algorithm_name)
    model.fit(X_train_trans, y_train)

    duration = round(time.time() - start_time, 3)

    y_pred = model.predict(X_test_trans)
    y_proba = model.predict_proba(X_test_trans)[:, 1] if hasattr(model, "predict_proba") else y_pred

    acc = round(float(accuracy_score(y_test, y_pred)), 4)
    prec = round(float(precision_score(y_test, y_pred, zero_division=0)), 4)
    rec = round(float(recall_score(y_test, y_pred, zero_division=0)), 4)
    f1 = round(float(f1_score(y_test, y_pred, zero_division=0)), 4)
    try:
        auc = round(float(roc_auc_score(y_test, y_proba)), 4)
    except Exception:
        auc = acc

    cm = confusion_matrix(y_test, y_pred).tolist()

    fpr, tpr, thresholds = roc_curve(y_test, y_proba)
    roc_data = {
        "fpr": [round(x, 4) for x in fpr.tolist()[:20]],
        "tpr": [round(x, 4) for x in tpr.tolist()[:20]]
    }

    # Feature Importance calculation based on model type
    all_feature_names = num_cols + cat_cols
    feat_importance_dict = {}

    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        feat_importance_dict = {
            name: round(float(imp), 4) for name, imp in zip(all_feature_names, importances)
        }
    elif hasattr(model, "estimators_"):
        total_imp = np.zeros(len(all_feature_names))
        count = 0
        for est in model.estimators_:
            if hasattr(est, "feature_importances_"):
                total_imp += est.feature_importances_
                count += 1
            elif hasattr(est, "coef_"):
                c = np.abs(est.coef_[0])
                total_imp += c / (np.sum(c) if np.sum(c) > 0 else 1.0)
                count += 1
        if count > 0:
            total_imp /= count
        feat_importance_dict = {
            name: round(float(imp), 4) for name, imp in zip(all_feature_names, total_imp)
        }
    elif hasattr(model, "coef_"):
        coefs = np.abs(model.coef_[0])
        total = np.sum(coefs) if np.sum(coefs) > 0 else 1.0
        norm_coefs = coefs / total
        feat_importance_dict = {
            name: round(float(imp), 4) for name, imp in zip(all_feature_names, norm_coefs)
        }
    else:
        # Uniform fallback if model doesn't expose importances/coefs
        val = round(1.0 / max(len(all_feature_names), 1), 4)
        feat_importance_dict = {name: val for name in all_feature_names}

    # Build SHAP Explainer dynamically based on algorithm architecture
    try:
        if algorithm_name in ["RandomForestClassifier", "GradientBoostingClassifier", "XGBClassifier"]:
            explainer = shap.TreeExplainer(model)
        elif algorithm_name == "LogisticRegression":
            explainer = shap.LinearExplainer(model, X_train_trans)
        else:
            explainer = shap.KernelExplainer(model.predict_proba, shap.sample(X_train_trans, 20))
    except Exception:
        # Fallback to general KernelExplainer if model-specific explainer fails
        try:
            explainer = shap.KernelExplainer(model.predict_proba, shap.sample(X_train_trans, 10))
        except Exception:
            explainer = None

    version = "v1.0.0"
    out_dir = os.path.join(ARTIFACTS_DIR, disease_key, version)
    os.makedirs(out_dir, exist_ok=True)

    bundle = {
        "disease_key": disease_key,
        "disease_name": disease_cfg['disease_name'],
        "algorithm": algorithm_name,
        "version": version,
        "model": model,
        "preprocessor": preprocessor,
        "num_cols": num_cols,
        "cat_cols": cat_cols,
        "feature_names": existing_features,
        "feature_cfgs": feature_cfgs,
        "training_date": datetime.utcnow().isoformat(),
        "dataset_name": dataset_name,
        "metrics": {
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "roc_auc": auc,
            "training_samples": len(X_train),
            "testing_samples": len(X_test),
            "duration": duration
        },
        "confusion_matrix": cm,
        "roc_curve": roc_data,
        "feature_importance": feat_importance_dict
    }

    # 1. Save model_bundle.joblib
    joblib_path = os.path.join(out_dir, "model_bundle.joblib")
    joblib.dump(bundle, joblib_path)

    # 2. Save model_bundle.pkl
    pkl_bundle_path = os.path.join(out_dir, "model_bundle.pkl")
    with open(pkl_bundle_path, "wb") as f:
        pickle.dump(bundle, f)

    # 3. Save individual model.pkl
    model_pkl_path = os.path.join(out_dir, "model.pkl")
    with open(model_pkl_path, "wb") as f:
        pickle.dump(model, f)

    # 4. Save individual scaler.pkl
    scaler_pkl_path = os.path.join(out_dir, "scaler.pkl")
    with open(scaler_pkl_path, "wb") as f:
        pickle.dump(preprocessor, f)

    # 5. Save individual shap_explainer.pkl
    shap_pkl_path = os.path.join(out_dir, "shap_explainer.pkl")
    if explainer is not None:
        with open(shap_pkl_path, "wb") as f:
            pickle.dump(explainer, f)

    # 6. Save metadata.json
    meta_path = os.path.join(out_dir, "metadata.json")
    meta_dict = {
        "disease": disease_cfg['disease_name'],
        "disease_key": disease_key,
        "algorithm": algorithm_name,
        "version": version,
        "dataset_name": dataset_name,
        "feature_count": len(existing_features),
        "preprocessing_version": "v1.0",
        "training_date": datetime.utcnow().isoformat(),
        "metrics": bundle["metrics"],
        "confusion_matrix": cm,
        "roc_curve": roc_data,
        "feature_importance": feat_importance_dict,
        "artifact_path": joblib_path,
        "artifacts": {
            "joblib_bundle": joblib_path,
            "pkl_bundle": pkl_bundle_path,
            "model_pkl": model_pkl_path,
            "scaler_pkl": scaler_pkl_path,
            "shap_pkl": shap_pkl_path
        }
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta_dict, f, indent=2)

    print(f"Successfully trained {algorithm_name} for {disease_cfg['disease_name']}. Saved .pkl & .joblib artifacts!")
    return bundle

def train_all():
    config = load_config()
    results = {}
    for disease_key, disease_cfg in config.items():
        bundle = preprocess_and_train(disease_key, disease_cfg, algorithm_name="RandomForestClassifier")
        results[disease_key] = bundle["metrics"]
    
    print("\n==========================================")
    print(" ALL DISEASE MODELS TRAINED AND SAVED AS .pkl & .joblib!")
    print("==========================================")

if __name__ == "__main__":
    train_all()
