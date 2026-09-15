import os
import joblib
import pandas as pd
import numpy as np
import re
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
    artifact_path_v2 = os.path.join(ARTIFACTS_DIR, disease_key, "v2.0.0", "model_bundle.joblib")
    artifact_path_v1 = os.path.join(ARTIFACTS_DIR, disease_key, "v1.0.0", "model_bundle.joblib")
    artifact_path = artifact_path_v2 if os.path.exists(artifact_path_v2) else artifact_path_v1
    if not os.path.exists(artifact_path):
        raise FileNotFoundError(f"Model artifact bundle for '{disease_key}' not found at: {artifact_path}")

    mtime = os.path.getmtime(artifact_path)
    if disease_key not in _MODEL_BUNDLES or _BUNDLE_MTIMES.get(disease_key) != mtime:
        _MODEL_BUNDLES[disease_key] = joblib.load(artifact_path)
        _BUNDLE_MTIMES[disease_key] = mtime

    return _MODEL_BUNDLES[disease_key]


def parse_clean_clinical_value(val: Any) -> Any:
    """
    Robustly parses clinical input values from UI forms (handles numbers, string labels, 
    '0 (Female)', '1 (Yes)', 'Female/Male', 'Yes/No', 'True/False').
    """
    if val is None or val == "" or (isinstance(val, float) and np.isnan(val)):
        return 0.0

    if isinstance(val, (int, float)) and not isinstance(val, bool):
        return float(val)

    val_str = str(val).strip()
    if not val_str:
        return 0.0

    # Try direct numeric conversion
    try:
        return float(val_str)
    except ValueError:
        pass

    # Extract leading numeric digits if string starts with a number e.g. "0 (Female)" -> 0.0, "1 (Yes)" -> 1.0
    num_match = re.match(r"^([-+]?\d*\.?\d+)", val_str)
    if num_match:
        try:
            return float(num_match.group(1))
        except ValueError:
            pass

    # Standardize string representations for categorical variables
    s_lower = val_str.lower()

    if s_lower in ["f", "female", "no", "n", "false", "absent", "notpresent"]:
        return 0.0
    elif s_lower in ["m", "male", "yes", "y", "true", "present"]:
        return 1.0

    return val_str


def run_prediction_inference(disease_key: str, input_values: Dict[str, Any]) -> Tuple[str, float, str, Dict[str, Any]]:
    """
    Executes model inference for a given disease and clinical input dictionary.
    Returns: (prediction_result, confidence_percentage, risk_level, processed_input_dict)
    """
    bundle = get_loaded_bundle(disease_key)
    model = bundle.get("calibrated_model", bundle["model"])
    preprocessor = bundle["preprocessor"]
    feature_names = bundle["feature_names"]
    num_cols = bundle.get("num_cols", [])

    # Construct single row DataFrame matching training features with flexible key matching
    row_data = {}
    for feat in feature_names:
        val = None
        feat_clean = feat.lower().replace("_", "").replace(" ", "").replace("(", "").replace(")", "").replace("/", "").replace("-", "")
        
        # Priority 1: Exact match
        for k, v in input_values.items():
            k_clean = str(k).lower().replace("_", "").replace(" ", "").replace("(", "").replace(")", "").replace("/", "").replace("-", "")
            if k == feat or k_clean == feat_clean:
                val = v
                break

        # Priority 2: Substring match if exact match not found
        if val is None:
            for k, v in input_values.items():
                k_clean = str(k).lower().replace("_", "").replace(" ", "").replace("(", "").replace(")", "").replace("/", "").replace("-", "")
                if k_clean and (k_clean == feat_clean or (len(k_clean) > 3 and k_clean in feat_clean)):
                    val = v
                    break

        parsed_val = parse_clean_clinical_value(val)
        
        # If column is numerical in model preprocessor but string was passed, ensure numeric conversion
        if num_cols and feat in num_cols:
            try:
                row_data[feat] = float(parsed_val)
            except (ValueError, TypeError):
                row_data[feat] = 0.0
        else:
            row_data[feat] = parsed_val

    df_input = pd.DataFrame([row_data])

    # Transform through fitted preprocessor pipeline
    X_trans = preprocessor.transform(df_input)

    # Execute model prediction / probability
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X_trans)[0]
        pos_prob = float(proba[1]) if len(proba) > 1 else float(proba[0])
    else:
        pred = model.predict(X_trans)[0]
        pos_prob = 1.0 if pred == 1 else 0.0

    # Clip probability between 0.1% and 99.9% for realistic clinical confidence
    pos_prob = float(np.clip(pos_prob, 0.001, 0.999))
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
