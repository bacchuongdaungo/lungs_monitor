from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_healthcheck() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_predict_health_level_returns_patient_friendly_payload() -> None:
    response = client.post(
        "/api/v1/health-level/predict",
        json={
            "age_years": 42,
            "biological_sex": "male",
            "bmi": 27.8,
            "smoking_years": 18.0,
            "cigarettes_per_day": 14.0,
            "days_since_quit": 22,
        },
    )

    assert response.status_code == 200
    body = response.json()

    assert body["health_level"] in {"low", "elevated", "high", "very_high"}
    assert 0 <= body["confidence"] <= 1
    assert body["model_source"] in {"trained-artifact", "heuristic-bootstrap"}
    assert set(body["probabilities"]) == {"low", "elevated", "high", "very_high"}
    assert "derived_features" in body
    assert round(body["derived_features"]["packs_per_week"], 2) == 4.90
    assert round(body["derived_features"]["daily_tar_mg"], 2) == 168.00
    assert isinstance(body["drivers"], list)
