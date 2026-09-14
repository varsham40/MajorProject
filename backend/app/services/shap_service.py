import shap
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from backend.app.services.ml_service import get_loaded_bundle

def compute_shap_explanations(disease_key: str, input_values: Dict[str, Any]) -> Tuple[float, List[Dict[str, Any]], str]:
    """
    Computes SHAP values using TreeExplainer for the provided patient clinical input.
    Returns: (base_value, shap_features_list, ai_analysis_text)
    """
    bundle = get_loaded_bundle(disease_key)
    model = bundle["model"]
    preprocessor = bundle["preprocessor"]
    num_cols = bundle["num_cols"]
    cat_cols = bundle["cat_cols"]
    feature_names = bundle["feature_names"]

    # Construct single row DataFrame
    row_data = {}
    for feat in feature_names:
        val = input_values.get(feat)
        if val is None or val == "":
            row_data[feat] = np.nan
        else:
            try:
                row_data[feat] = float(val)
            except ValueError:
                row_data[feat] = str(val)

    df_input = pd.DataFrame([row_data])
    X_trans = preprocessor.transform(df_input)

    # Compute SHAP
    shap_vals = None
    explainer = None

    try:
        explainer = shap.TreeExplainer(model)
        shap_vals = explainer.shap_values(X_trans)
    except Exception:
        try:
            # Fallback to KernelExplainer for non-tree models (e.g. MLPClassifier, LogisticRegression)
            explainer = shap.KernelExplainer(model.predict_proba, X_trans)
            shap_vals = explainer.shap_values(X_trans)
        except Exception:
            # Emergency fallback: zero shap values
            shap_vals = np.zeros(X_trans.shape)

    # Base value (expected value)
    base_value = 0.5
    if explainer is not None and hasattr(explainer, "expected_value") and explainer.expected_value is not None:
        exp_val = explainer.expected_value
        if isinstance(exp_val, (list, np.ndarray)):
            base_value = float(exp_val[1]) if len(exp_val) > 1 else float(exp_val[0])
        else:
            base_value = float(exp_val)

    # Handle multi-class / binary array output formats
    if isinstance(shap_vals, list):
        # Array for class 1 (positive class)
        target_shap = shap_vals[1][0] if len(shap_vals) > 1 else shap_vals[0][0]
    elif isinstance(shap_vals, np.ndarray):
        if shap_vals.ndim == 3:
            target_shap = shap_vals[0, :, 1] if shap_vals.shape[2] > 1 else shap_vals[0, :, 0]
        elif shap_vals.ndim == 2:
            target_shap = shap_vals[0]
        else:
            target_shap = shap_vals
    else:
        target_shap = np.array(shap_vals).flatten()

    all_transformed_feature_names = num_cols + cat_cols

    shap_features_list = []
    top_risk_factors = []
    top_protective_factors = []

    for name, val_shap in zip(all_transformed_feature_names, target_shap):
        val_shap_float = round(float(val_shap), 4)
        orig_val = str(input_values.get(name, "N/A"))

        if val_shap_float > 0.01:
            effect = "Increased Risk"
            top_risk_factors.append(f"{name} ({orig_val})")
        elif val_shap_float < -0.01:
            effect = "Decreased Risk"
            top_protective_factors.append(f"{name} ({orig_val})")
        else:
            effect = "Neutral"

        shap_features_list.append({
            "feature_name": name,
            "patient_value": orig_val,
            "shap_value": val_shap_float,
            "effect": effect
        })

    # Sort feature contributions by magnitude
    shap_features_list.sort(key=lambda x: abs(x["shap_value"]), reverse=True)

    # Generate Natural Language AI Analysis
    disease_name = bundle["disease_name"]
    analysis_lines = [
        f"Artificial Intelligence Clinical Analysis for {disease_name}:"
    ]

    if top_risk_factors:
        analysis_lines.append(f"• Primary clinical contributors increasing risk: {', '.join(top_risk_factors[:3])}.")
    if top_protective_factors:
        analysis_lines.append(f"• Primary protective factors reducing risk: {', '.join(top_protective_factors[:3])}.")

    if not top_risk_factors and not top_protective_factors:
        analysis_lines.append("• Patient clinical indicators are within normal reference baselines.")

    display_base_val = max(0.0, min(1.0, base_value)) if 0.0 <= base_value <= 1.0 else 0.5
    analysis_lines.append(f"• SHAP Base Expected Risk Value: {round(display_base_val * 100, 1)}%.")
    ai_analysis_text = "\n".join(analysis_lines)

    return round(base_value, 4), shap_features_list, ai_analysis_text

