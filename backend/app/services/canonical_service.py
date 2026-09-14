import json
import hashlib
from typing import Dict, Any

def normalize_value(v: Any) -> Any:
    """
    Recursively normalizes values in payload dictionaries so that
    whole floating point numbers (e.g. 0.0, 120.0) are normalized
    to standard numbers (e.g. 0, 120). This ensures 100% hash parity
    between Python backend serialization and JavaScript frontend stringification.
    """
    if isinstance(v, float) and v.is_integer():
        return int(v)
    elif isinstance(v, dict):
        return {k: normalize_value(val) for k, val in v.items()}
    elif isinstance(v, list):
        return [normalize_value(val) for val in v]
    return v

def build_canonical_record_payload(
    record_code: str,
    disease: str,
    patient_id: str,
    doctor_id: str,
    hospital_id: str,
    result: str,
    confidence: float,
    inputs: Dict[str, Any],
    timestamp: str
) -> Dict[str, Any]:
    """
    Standardized canonical dictionary builder for both registration and verification.
    """
    raw_payload = {
        "record_code": record_code,
        "disease": disease,
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "hospital_id": hospital_id,
        "result": result,
        "confidence": confidence,
        "inputs": inputs,
        "timestamp": timestamp
    }
    return {k: normalize_value(v) for k, v in raw_payload.items()}

def generate_canonical_record_string(record_dict: Dict[str, Any]) -> str:
    """
    Generates a deterministic canonical JSON string representation of a medical record.
    Keys are sorted recursively and formatted without whitespace.
    """
    normalized = {k: normalize_value(v) for k, v in record_dict.items()}
    return json.dumps(normalized, sort_keys=True, separators=(',', ':'))

def calculate_record_sha256(record_dict: Dict[str, Any]) -> str:
    """
    Computes the SHA-256 hex string fingerprint of a canonical medical record dictionary.
    """
    canonical_str = generate_canonical_record_string(record_dict)
    return hashlib.sha256(canonical_str.encode('utf-8')).hexdigest()
