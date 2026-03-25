from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.ml.predictor import HealthLevelPredictor
from app.schemas import HealthLevelRequest, HealthLevelResponse

app = FastAPI(
    title="Smoke-Free Lungs Backend",
    version="0.1.0",
    summary="Prediction API for smoke-free lung recovery and health-level categorization",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = HealthLevelPredictor()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/health-level/predict", response_model=HealthLevelResponse)
def predict_health_level(payload: HealthLevelRequest) -> HealthLevelResponse:
    result = predictor.predict(payload)
    return HealthLevelResponse(
        health_level=result.label,
        confidence=result.confidence,
        model_source=result.model_source,
        probabilities=result.probabilities,
        drivers=result.drivers,
        derived_features=result.derived_features,
    )
