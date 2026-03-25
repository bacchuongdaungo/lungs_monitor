import pandas as pd

from train_health_model import prepare_training_frame


def test_prepare_training_frame_engineers_model_columns() -> None:
    df = pd.DataFrame(
        [
            {
                "age_years": 39,
                "biological_sex": "female",
                "bmi": 24.1,
                "smoking_years": 9.0,
                "cigarettes_per_day": 8.0,
                "days_since_quit": 120,
                "health_level": "elevated",
            }
        ]
    )

    engineered = prepare_training_frame(df)

    assert "packs_per_week" in engineered.columns
    assert "effective_pack_years" in engineered.columns
    assert "daily_nicotine_mg" in engineered.columns
    assert "daily_tar_mg" in engineered.columns
    assert engineered.shape[0] == 1
