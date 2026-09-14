import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple
from backend.app.core.config import settings

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
ARTIFACTS_DIR = os.path.join(PROJECT_ROOT, "ml", "artifacts")

_MODEL_BUNDLES: Dict[str, Any] = {}
_BUNDLE_MTIMES: Dict[str, float] = {}

def get_loaded_bundle(disease_key: str) -> Dict[str, Any]:
    disease_key = disease_key.lower().replace(" ", "_")
    key_map = {"heart": "heart_disease", "kidney": "kidney_disease", "liver": "liver_disease", "thyroid": "thyroid_disease"}
    disease_key = key_map.get(disease_key, disease_key)
    artifact_path = os.path.join(ARTIFACTS_DIR, disease_key, "v1.0.0", "model_bundle.joblib")
    if not os.path.exists(artifact_path):
        raise FileNotFoundError(f"Model artifact bundle for '{disease_key}' not found at: {artifact_path}")

    mtime = os.path.getmtime(artifact_path)
    if disease_key not in _MODEL_BUNDLES or _BUNDLE_MTIMES.get(disease_key) != mtime:
        _MODEL_BUNDLES[disease_key] = joblib.load(artifact_path)
        _BUNDLE_MTIMES[disease_key] = mtime

    return _MODEL_BUNDLES[disease_key]


def run_prediction_inference(disease_key: str, input_values: Dict[str, Any]) -> Tuple[str, float, str, Dict[str, Any]]:
    """
    Executes model inference for a given disease and clinical input dictionary.
    Returns: (prediction_result, confidence_percentage, risk_level, processed_input_dict)
    """
    bundle = get_loaded_bundle(disease_key)
    model = bundle["model"]
    preprocessor = bundle["preprocessor"]
    feature_names = bundle["feature_names"]

    # Construct single row DataFrame matching training features with flexible key matching
    row_data = {}
    for feat in feature_names:
        val = None
        feat_clean = feat.lower().replace("_", "").replace(" ", "")
        for k, v in input_values.items():
            k_clean = str(k).lower().replace("_", "").replace(" ", "")
            if k == feat or k_clean == feat_clean:
                val = v
                break

        if val is None or val == "" or (isinstance(val, float) and np.isnan(val)):
            row_data[feat] = 0.0
        else:
            try:
                row_data[feat] = float(val)
            except ValueError:
                row_data[feat] = str(val)

    df_input = pd.DataFrame([row_data])

    # Transform through fitted pipeline
    X_trans = preprocessor.transform(df_input)

    # Predict
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X_trans)[0]
        pos_prob = float(proba[1]) if len(proba) > 1 else float(proba[0])
    else:
        pred = model.predict(X_trans)[0]
        pos_prob = 1.0 if pred == 1 else 0.0

    confidence_pct = round(pos_prob * 100.0, 1)

    # Risk level classification
    if confidence_pct >= 70.0:
        risk_level = "High"
        result_label = f"High Risk of {bundle['disease_name']}"
    elif confidence_pct >= 40.0:
        risk_level = "Moderate"
        result_label = f"Moderate Risk of {bundle['disease_name']}"
    else:
        risk_level = "Low"
        result_label = f"Low Risk / Normal ({bundle['disease_name']})"

    return result_label, confidence_pct, risk_level, row_data
