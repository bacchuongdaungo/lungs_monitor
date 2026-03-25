from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import joblib
import numpy as np

from app.ml.features import build_feature_row, derive_features, request_to_frame
from app.schemas import HealthLevelRequest

LABELS = ["low", "elevated", "high", "very_high"]
MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "health_level_model.joblib"


@dataclass(slots=True)
class PredictionResult:
    label: str
    confidence: float
    probabilities: dict[str, float]
    model_source: str
    drivers: list[str]
    derived_features: dict[str, float]


def _softmax(values: np.ndarray) -> np.ndarray:
    shifted = values - np.max(values)
    exps = np.exp(shifted)
    return exps / np.sum(exps)


class HealthLevelPredictor:
    def __init__(self, model_path: Path = MODEL_PATH) -> None:
        self.model_path = model_path
        self._bundle = self._load_bundle()

    def _load_bundle(self):
        if not self.model_path.exists():
            return None
        return joblib.load(self.model_path)

    def predict(self, payload: HealthLevelRequest) -> PredictionResult:
        if self._bundle is not None:
            return self._predict_with_artifact(payload)
        return self._predict_with_bootstrap(payload)

    def _predict_with_artifact(self, payload: HealthLevelRequest) -> PredictionResult:
        frame = request_to_frame(payload)
        model = self._bundle["model"]
        labels = list(self._bundle["labels"])
        probabilities_raw = model.predict_proba(frame)[0]
        label = labels[int(np.argmax(probabilities_raw))]
        probabilities = {
            label_name: float(probabilities_raw[index])
            for index, label_name in enumerate(labels)
        }
        return PredictionResult(
            label=label,
            confidence=float(np.max(probabilities_raw)),
            probabilities=probabilities,
            model_source="trained-artifact",
            drivers=self._drivers(payload),
            derived_features=derive_features(payload).model_dump(),
        )

    def _predict_with_bootstrap(self, payload: HealthLevelRequest) -> PredictionResult:
        features = build_feature_row(payload)
        score = (
            0.14 * min(features.age_years / 100.0, 1.0)
            + 0.16 * min(features.bmi_risk_band, 1.0)
            + 0.12 * min(features.smoking_years / 40.0, 1.0)
            + 0.14 * min(features.cigarettes_per_day / 40.0, 1.0)
            + 0.20 * min(features.effective_pack_years / 40.0, 1.0)
            + 0.10 * min(features.daily_nicotine_mg / 40.0, 1.0)
            + 0.16 * min(features.daily_tar_mg / 400.0, 1.0)
            - 0.14 * min(features.recovery_offset, 1.0)
        )
        score = float(np.clip(score, 0.0, 1.0))

        logits = np.array(
            [
                1.6 - (score * 6.0),
                0.8 - abs(score - 0.35) * 4.5,
                0.8 - abs(score - 0.62) * 4.2,
                (score * 6.0) - 3.0,
            ]
        )
        probabilities_raw = _softmax(logits)
        label = LABELS[int(np.argmax(probabilities_raw))]
        probabilities = {
            label_name: float(probabilities_raw[index])
            for index, label_name in enumerate(LABELS)
        }
        return PredictionResult(
            label=label,
            confidence=float(np.max(probabilities_raw)),
            probabilities=probabilities,
            model_source="heuristic-bootstrap",
            drivers=self._drivers(payload),
            derived_features=derive_features(payload).model_dump(),
        )

    def _drivers(self, payload: HealthLevelRequest) -> list[str]:
        derived = derive_features(payload)
        drivers: list[str] = []

        if derived.effective_pack_years >= 15:
            drivers.append("effective_pack_years is materially elevated")
        if derived.daily_tar_mg >= 120:
            drivers.append("daily_tar_mg remains high")
        if payload.days_since_quit <= 90:
            drivers.append("days_since_quit is still early in recovery")
        if payload.bmi >= 30:
            drivers.append("bmi is in a higher-risk range")
        if payload.cigarettes_per_day >= 20:
            drivers.append("cigarettes_per_day indicates heavy prior smoking")

        if not drivers:
            drivers.append("current risk drivers are relatively modest in this bootstrap model")
        return drivers[:3]
