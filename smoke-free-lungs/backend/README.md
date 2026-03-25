# Backend

This backend is the first API layer for machine-learning health categorization in Smoke-Free Lungs.

It currently does three things:

- serves a prediction endpoint for health-level classification
- derives smoking exposure features from patient-facing inputs
- supports training and loading a scikit-learn model artifact

## Stack

- FastAPI for the HTTP API
- scikit-learn for the trainable classifier pipeline
- pandas and numpy for feature preparation
- a heuristic bootstrap fallback when no trained artifact exists yet

## Health Levels

The API returns one of:

- `low`
- `elevated`
- `high`
- `very_high`

These are relative model categories, not clinical diagnoses.

## Run locally

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Prediction endpoint:

```text
POST /api/v1/health-level/predict
```

Health check:

```text
GET /health
```

## Patient-shaped request

The request is intentionally close to the patient profile the frontend already captures. The backend derives the rest of the exposure metrics.

```json
{
  "age_years": 42,
  "biological_sex": "male",
  "bmi": 27.8,
  "smoking_years": 18.0,
  "cigarettes_per_day": 14.0,
  "days_since_quit": 22,
  "nicotine_mg_per_cig": 1.0,
  "tar_mg_per_cig": 12.0
}
```

Optional override fields are also accepted when the frontend already knows them:

- `packs_per_week`
- `pack_years`
- `effective_pack_years`
- `daily_nicotine_mg`
- `daily_tar_mg`

## Response shape

```json
{
  "health_level": "high",
  "confidence": 0.71,
  "model_source": "heuristic-bootstrap",
  "probabilities": {
    "low": 0.04,
    "elevated": 0.18,
    "high": 0.71,
    "very_high": 0.07
  },
  "drivers": [
    "effective_pack_years is materially elevated",
    "daily_tar_mg remains high",
    "days_since_quit is still early in recovery"
  ],
  "derived_features": {
    "packs_per_week": 4.9,
    "pack_years": 12.6,
    "effective_pack_years": 14.83,
    "daily_nicotine_mg": 14.0,
    "daily_tar_mg": 168.0,
    "years_since_quit": 0.06,
    "bmi_risk_band": 0.3,
    "smoking_load_index": 13.38,
    "recovery_offset": 0.01
  }
}
```

## Training a real model

Train on a CSV with these required raw columns:

- `age_years`
- `biological_sex`
- `bmi`
- `smoking_years`
- `cigarettes_per_day`
- `days_since_quit`
- `health_level`

Optional input columns may also be included:

- `nicotine_mg_per_cig`
- `tar_mg_per_cig`
- `packs_per_week`
- `pack_years`
- `effective_pack_years`
- `daily_nicotine_mg`
- `daily_tar_mg`

Run:

```bash
python train_health_model.py --csv path\to\training_data.csv
```

This writes:

```text
backend/models/health_level_model.joblib
```

Once that artifact exists, the API automatically uses it instead of the bootstrap heuristic.

## Tests

Run:

```bash
pytest
```

The backend tests cover feature derivation, API response shape, and training-frame preparation.

## Frontend mapping

The existing frontend already computes or stores the fields needed to call this backend:

- `ageYears`
- `bmi`
- `smokingYears`
- `cigsPerDay`
- `daysSinceQuit`
- `nicotineMgPerCig`
- `tarMgPerCig`

If desired, the frontend can also send its already-derived values:

- `packsPerWeek`
- `packYears`
- `effectivePackYears`
- `dailyNicotineMg`
- `dailyTarMg`
