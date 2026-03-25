from app.ml.features import derive_features
from app.schemas import HealthLevelRequest


def make_payload(**overrides) -> HealthLevelRequest:
    payload = {
        "age_years": 42,
        "biological_sex": "male",
        "bmi": 27.8,
        "smoking_years": 18.0,
        "cigarettes_per_day": 14.0,
        "days_since_quit": 22,
    }
    payload.update(overrides)
    return HealthLevelRequest.model_validate(payload)


def test_derive_features_computes_missing_exposure_metrics() -> None:
    derived = derive_features(make_payload())

    assert round(derived.packs_per_week, 2) == 4.90
    assert round(derived.pack_years, 2) == 12.60
    assert derived.effective_pack_years > derived.pack_years
    assert round(derived.daily_nicotine_mg, 2) == 14.00
    assert round(derived.daily_tar_mg, 2) == 168.00
    assert derived.years_since_quit > 0
    assert 0 <= derived.recovery_offset <= 1


def test_derive_features_respects_explicit_overrides() -> None:
    derived = derive_features(
        make_payload(
            packs_per_week=3.0,
            pack_years=7.5,
            effective_pack_years=9.25,
            daily_nicotine_mg=8.5,
            daily_tar_mg=96.0,
        )
    )

    assert derived.packs_per_week == 3.0
    assert derived.pack_years == 7.5
    assert derived.effective_pack_years == 9.25
    assert derived.daily_nicotine_mg == 8.5
    assert derived.daily_tar_mg == 96.0
