from __future__ import annotations

from dataclasses import asdict, dataclass

import pandas as pd

from app.schemas import DerivedFeatures, HealthLevelRequest


@dataclass(slots=True)
class FeatureRow:
    age_years: float
    biological_sex: str
    bmi: float
    smoking_years: float
    cigarettes_per_day: float
    packs_per_week: float
    pack_years: float
    effective_pack_years: float
    days_since_quit: int
    daily_nicotine_mg: float
    daily_tar_mg: float
    years_since_quit: float
    bmi_risk_band: float
    smoking_load_index: float
    recovery_offset: float


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def clamp01(value: float) -> float:
    return clamp(value, 0.0, 1.0)


def bmi_risk_band(bmi: float) -> float:
    if bmi < 18.5:
        return 0.25
    if bmi < 25:
        return 0.0
    if bmi < 30:
        return 0.3
    if bmi < 35:
        return 0.55
    return 0.75


def brand_chemistry_multiplier(tar_mg_per_cig: float, nicotine_mg_per_cig: float) -> float:
    tar_norm = clamp01((tar_mg_per_cig - 6.0) / 14.0)
    nicotine_norm = clamp01((nicotine_mg_per_cig - 0.4) / 1.3)
    chemistry_load = 0.68 * tar_norm + 0.32 * nicotine_norm
    return 0.86 + chemistry_load * 0.34


def derive_features(payload: HealthLevelRequest) -> DerivedFeatures:
    packs_per_week = payload.packs_per_week
    if packs_per_week is None:
        packs_per_week = (payload.cigarettes_per_day / 20.0) * 7.0

    pack_years = payload.pack_years
    if pack_years is None:
        pack_years = (payload.cigarettes_per_day / 20.0) * payload.smoking_years

    effective_pack_years = payload.effective_pack_years
    if effective_pack_years is None:
        effective_pack_years = pack_years * brand_chemistry_multiplier(
            payload.tar_mg_per_cig,
            payload.nicotine_mg_per_cig,
        )

    daily_nicotine_mg = payload.daily_nicotine_mg
    if daily_nicotine_mg is None:
        daily_nicotine_mg = payload.nicotine_mg_per_cig * payload.cigarettes_per_day

    daily_tar_mg = payload.daily_tar_mg
    if daily_tar_mg is None:
        daily_tar_mg = payload.tar_mg_per_cig * payload.cigarettes_per_day

    years_since_quit = payload.days_since_quit / 365.25
    smoking_load_index = (
        0.35 * payload.cigarettes_per_day
        + 0.25 * pack_years
        + 0.40 * effective_pack_years
    )
    recovery_offset = min(payload.days_since_quit / 3650.0, 1.0)

    return DerivedFeatures(
        packs_per_week=packs_per_week,
        pack_years=pack_years,
        effective_pack_years=effective_pack_years,
        daily_nicotine_mg=daily_nicotine_mg,
        daily_tar_mg=daily_tar_mg,
        years_since_quit=years_since_quit,
        bmi_risk_band=bmi_risk_band(payload.bmi),
        smoking_load_index=smoking_load_index,
        recovery_offset=recovery_offset,
    )


def build_feature_row(payload: HealthLevelRequest) -> FeatureRow:
    derived = derive_features(payload)

    return FeatureRow(
        age_years=payload.age_years,
        biological_sex=payload.biological_sex,
        bmi=payload.bmi,
        smoking_years=payload.smoking_years,
        cigarettes_per_day=payload.cigarettes_per_day,
        packs_per_week=derived.packs_per_week,
        pack_years=derived.pack_years,
        effective_pack_years=derived.effective_pack_years,
        days_since_quit=payload.days_since_quit,
        daily_nicotine_mg=derived.daily_nicotine_mg,
        daily_tar_mg=derived.daily_tar_mg,
        years_since_quit=derived.years_since_quit,
        bmi_risk_band=derived.bmi_risk_band,
        smoking_load_index=derived.smoking_load_index,
        recovery_offset=derived.recovery_offset,
    )


def request_to_frame(payload: HealthLevelRequest) -> pd.DataFrame:
    return pd.DataFrame([asdict(build_feature_row(payload))])
