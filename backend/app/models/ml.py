import uuid
from datetime import datetime
from sqlalchemy import String, Text, Float, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.core.database import Base

class AIModel(Base):
    __tablename__ = "ai_models"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    disease: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    algorithm: Mapped[str] = mapped_column(String(100), nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    feature_count: Mapped[int] = mapped_column(Integer, nullable=False)
    preprocessing_version: Mapped[str] = mapped_column(String(50), nullable=False)
    training_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    accuracy: Mapped[float] = mapped_column(Float, nullable=True)
    precision: Mapped[float] = mapped_column(Float, nullable=True)
    recall: Mapped[float] = mapped_column(Float, nullable=True)
    f1_score: Mapped[float] = mapped_column(Float, nullable=True)
    roc_auc: Mapped[float] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE")
    artifact_path: Mapped[str] = mapped_column(Text, nullable=False)

class ModelFeature(Base):
    __tablename__ = "model_features"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("ai_models.id", ondelete="CASCADE"), nullable=False)
    feature_name: Mapped[str] = mapped_column(String(100), nullable=False)
    feature_order: Mapped[int] = mapped_column(Integer, nullable=False)
    data_type: Mapped[str] = mapped_column(String(50), nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=True)
    validation_rules: Mapped[dict] = mapped_column(JSON, nullable=False)

class ModelTrainingRun(Base):
    __tablename__ = "model_training_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("ai_models.id", ondelete="CASCADE"), nullable=False)
    dataset_name: Mapped[str] = mapped_column(String(255), nullable=False)
    dataset_version: Mapped[str] = mapped_column(String(50), nullable=False)
    training_samples: Mapped[int] = mapped_column(Integer, nullable=False)
    testing_samples: Mapped[int] = mapped_column(Integer, nullable=False)
    accuracy: Mapped[float] = mapped_column(Float, nullable=True)
    precision: Mapped[float] = mapped_column(Float, nullable=True)
    recall: Mapped[float] = mapped_column(Float, nullable=True)
    f1_score: Mapped[float] = mapped_column(Float, nullable=True)
    roc_auc: Mapped[float] = mapped_column(Float, nullable=True)
    training_duration: Mapped[float] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ModelAnalysisResult(Base):
    __tablename__ = "model_analysis_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("ai_models.id", ondelete="CASCADE"), nullable=False)
    confusion_matrix: Mapped[dict] = mapped_column(JSON, nullable=False)
    roc_curve: Mapped[dict] = mapped_column(JSON, nullable=False)
    feature_importance: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    doctor_id: Mapped[str] = mapped_column(String(36), ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("ai_models.id"), nullable=True)
    disease: Mapped[str] = mapped_column(String(100), nullable=False)
    result: Mapped[str] = mapped_column(String(100), nullable=False)  # High Risk / Positive, Low Risk / Negative
    confidence: Mapped[float] = mapped_column(Float, nullable=False)   # Percentage (0 - 100)
    risk_level: Mapped[str] = mapped_column(String(50), nullable=False)  # High, Moderate, Low
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class PredictionInput(Base):
    __tablename__ = "prediction_inputs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    prediction_id: Mapped[str] = mapped_column(String(36), ForeignKey("predictions.id", ondelete="CASCADE"), unique=True, nullable=False)
    inputs: Mapped[dict] = mapped_column(JSON, nullable=False)

class PredictionAnalysis(Base):
    __tablename__ = "prediction_analysis"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    prediction_id: Mapped[str] = mapped_column(String(36), ForeignKey("predictions.id", ondelete="CASCADE"), unique=True, nullable=False)
    ai_analysis_text: Mapped[str] = mapped_column(Text, nullable=False)

class SHAPExplanation(Base):
    __tablename__ = "shap_explanations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    prediction_id: Mapped[str] = mapped_column(String(36), ForeignKey("predictions.id", ondelete="CASCADE"), unique=True, nullable=False)
    base_value: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class SHAPFeature(Base):
    __tablename__ = "shap_features"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    shap_explanation_id: Mapped[str] = mapped_column(String(36), ForeignKey("shap_explanations.id", ondelete="CASCADE"), nullable=False)
    feature_name: Mapped[str] = mapped_column(String(100), nullable=False)
    patient_value: Mapped[str] = mapped_column(String(100), nullable=False)
    shap_value: Mapped[float] = mapped_column(Float, nullable=False)
    effect: Mapped[str] = mapped_column(String(50), nullable=False)  # Increased Risk, Decreased Risk, Neutral

class PredictionReport(Base):
    __tablename__ = "prediction_reports"

    prediction_id: Mapped[str] = mapped_column(String(36), ForeignKey("predictions.id", ondelete="CASCADE"), primary_key=True)
    report_id: Mapped[str] = mapped_column(String(36), ForeignKey("medical_reports.id", ondelete="CASCADE"), primary_key=True)
