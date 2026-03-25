from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from app.ml.features import request_to_frame
from app.schemas import HealthLevelRequest

MODEL_PATH = Path(__file__).resolve().parent / "models" / "health_level_model.joblib"
TARGET_COLUMN = "health_level"
RAW_REQUIRED_COLUMNS = [
    "age_years",
    "biological_sex",
    "bmi",
    "smoking_years",
    "cigarettes_per_day",
    "days_since_quit",
]
RAW_OPTIONAL_COLUMNS = [
    "nicotine_mg_per_cig",
    "tar_mg_per_cig",
    "packs_per_week",
    "pack_years",
    "effective_pack_years",
    "daily_nicotine_mg",
    "daily_tar_mg",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train the smoke-free lungs health-level classifier.")
    parser.add_argument("--csv", required=True, help="Path to a CSV containing training rows.")
    return parser.parse_args()


def build_pipeline() -> Pipeline:
    numeric_features = [
        "age_years",
        "bmi",
        "smoking_years",
        "cigarettes_per_day",
        "packs_per_week",
        "pack_years",
        "effective_pack_years",
        "days_since_quit",
        "daily_nicotine_mg",
        "daily_tar_mg",
        "years_since_quit",
        "bmi_risk_band",
        "smoking_load_index",
        "recovery_offset",
    ]
    categorical_features = ["biological_sex"]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                    ]
                ),
                numeric_features,
            ),
            (
                "categorical",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("onehot", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                categorical_features,
            ),
        ]
    )

    classifier = RandomForestClassifier(
        n_estimators=300,
        max_depth=8,
        random_state=42,
        class_weight="balanced_subsample",
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )


def prepare_training_frame(df: pd.DataFrame) -> pd.DataFrame:
    missing = [column for column in RAW_REQUIRED_COLUMNS if column not in df.columns]
    if missing:
        raise ValueError(
            "Training CSV is missing required columns: "
            + ", ".join(missing)
        )

    feature_frames: list[pd.DataFrame] = []
    candidate_columns = RAW_REQUIRED_COLUMNS + RAW_OPTIONAL_COLUMNS
    available_columns = [column for column in candidate_columns if column in df.columns]
    for row in df[available_columns].to_dict(orient="records"):
        payload = HealthLevelRequest.model_validate(row)
        feature_frames.append(request_to_frame(payload))

    return pd.concat(feature_frames, ignore_index=True)


def main() -> None:
    args = parse_args()
    csv_path = Path(args.csv).resolve()
    df = pd.read_csv(csv_path)

    if TARGET_COLUMN not in df.columns:
        raise ValueError(f"Training CSV must include '{TARGET_COLUMN}'.")

    x = prepare_training_frame(df)
    y = df[TARGET_COLUMN].astype(str)

    pipeline = build_pipeline()
    pipeline.fit(x, y)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    bundle = {
        "model": pipeline,
        "labels": pipeline.named_steps["classifier"].classes_.tolist(),
    }
    joblib.dump(bundle, MODEL_PATH)
    print(f"Saved trained model to {MODEL_PATH}")


if __name__ == "__main__":
    main()
