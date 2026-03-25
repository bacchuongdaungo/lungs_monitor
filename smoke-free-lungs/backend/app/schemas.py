from typing import Literal

from pydantic import BaseModel, Field

HealthLevel = Literal["low", "elevated", "high", "very_high"]
BiologicalSex = Literal["female", "male", "other"]


class HealthLevelRequest(BaseModel):
    age_years: float = Field(ge=18, le=100)
    biological_sex: BiologicalSex
    bmi: float = Field(ge=10, le=80)
    smoking_years: float = Field(ge=0, le=80)
    cigarettes_per_day: float = Field(ge=0, le=80)
    days_since_quit: int = Field(ge=0, le=36500)
    nicotine_mg_per_cig: float = Field(default=1.0, ge=0, le=5)
    tar_mg_per_cig: float = Field(default=12.0, ge=0, le=60)
    packs_per_week: float | None = Field(default=None, ge=0, le=28)
    pack_years: float | None = Field(default=None, ge=0, le=200)
    effective_pack_years: float | None = Field(default=None, ge=0, le=300)
    daily_nicotine_mg: float | None = Field(default=None, ge=0, le=200)
    daily_tar_mg: float | None = Field(default=None, ge=0, le=2000)


class DerivedFeatures(BaseModel):
    packs_per_week: float = Field(ge=0, le=28)
    pack_years: float = Field(ge=0, le=200)
    effective_pack_years: float = Field(ge=0, le=300)
    daily_nicotine_mg: float = Field(ge=0, le=200)
    daily_tar_mg: float = Field(ge=0, le=2000)
    years_since_quit: float = Field(ge=0, le=100)
    bmi_risk_band: float = Field(ge=0, le=1)
    smoking_load_index: float = Field(ge=0)
    recovery_offset: float = Field(ge=0, le=1)


class HealthLevelResponse(BaseModel):
    health_level: HealthLevel
    confidence: float = Field(ge=0, le=1)
    model_source: Literal["trained-artifact", "heuristic-bootstrap"]
    probabilities: dict[HealthLevel, float]
    drivers: list[str]
    derived_features: DerivedFeatures
