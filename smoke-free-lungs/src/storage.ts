// src/storage.ts
import { DEFAULT_BRAND_ID } from "./cigBrands";
import {
  addDaysToISO,
  inferDOBFromAgeYears,
  todayISO,
  type BiologicalSex,
  type ConsumptionIntervalUnit,
  type ConsumptionUnit,
  type HeightUnit,
  type Inputs,
  type SmokingLengthMode,
  type WeightUnit,
} from "./model";

const LEGACY_KEY = "sfl_inputs_v1";
const STATE_KEY_V2 = "sfl_state_v2";

export type StoredStateV2 = {
  schemaVersion: 2;
  inputs: Inputs;
  earnedBadgeIds: string[];
};

function isNumberishOrEmpty(value: unknown): value is number | "" {
  return value === "" || (typeof value === "number" && Number.isFinite(value));
}

function normalizeSex(value: unknown): BiologicalSex {
  if (value === "female" || value === "male" || value === "other") return value;
  return "other";
}

function normalizeConsumptionUnit(value: unknown): ConsumptionUnit {
  if (value === "packs") return "packs";
  return "cigarettes";
}

function normalizeConsumptionIntervalUnit(value: unknown): ConsumptionIntervalUnit {
  if (value === "weeks") return "weeks";
  return "days";
}

function normalizeLengthMode(value: unknown): SmokingLengthMode {
  if (value === "approx_years") return "approx_years";
  return "exact_dates";
}

function normalizeWeightUnit(value: unknown): WeightUnit {
  if (value === "lb") return "lb";
  return "kg";
}

function normalizeHeightUnit(value: unknown): HeightUnit {
  if (value === "in") return "in";
  return "cm";
}

function inferSmokingStartFromYears(quitDateISO: string, years: number): string {
  const days = Math.max(0, Math.round(years * 365.25));
  return addDaysToISO(quitDateISO, -days) ?? quitDateISO;
}

function normalizeInputs(value: unknown): Inputs | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const smokingLengthMode = normalizeLengthMode(record.smokingLengthMode);

  const quitDateISO = typeof record.quitDateISO === "string" ? record.quitDateISO : todayISO();

  const approxSmokingYears =
    isNumberishOrEmpty(record.approxSmokingYears) && record.approxSmokingYears !== ""
      ? record.approxSmokingYears
      : isNumberishOrEmpty(record.yearsSmoking) && record.yearsSmoking !== ""
        ? record.yearsSmoking
        : "";

  let smokingStartDateISO =
    typeof record.smokingStartDateISO === "string"
      ? record.smokingStartDateISO
      : quitDateISO;

  if (!record.smokingStartDateISO && typeof approxSmokingYears === "number") {
    smokingStartDateISO = inferSmokingStartFromYears(quitDateISO, approxSmokingYears);
  }

  const legacyCigsPerDay = isNumberishOrEmpty(record.cigsPerDay) ? record.cigsPerDay : 0;

  const weightUnit = normalizeWeightUnit(record.weightUnit);
  const heightUnit = normalizeHeightUnit(record.heightUnit);

  const weightValue =
    isNumberishOrEmpty(record.weightValue)
      ? record.weightValue
      : isNumberishOrEmpty(record.weightKg)
        ? record.weightKg
        : "";

  const heightValue =
    isNumberishOrEmpty(record.heightValue)
      ? record.heightValue
      : isNumberishOrEmpty(record.heightCm)
        ? record.heightCm
        : "";

  return {
    smokingLengthMode,
    smokingStartDateISO,
    approxSmokingYears,
    quitDateISO,
    consumptionUnit: normalizeConsumptionUnit(record.consumptionUnit),
    consumptionQuantity: isNumberishOrEmpty(record.consumptionQuantity)
      ? record.consumptionQuantity
      : legacyCigsPerDay,
    consumptionIntervalUnit: normalizeConsumptionIntervalUnit(record.consumptionIntervalUnit),
    consumptionIntervalCount: isNumberishOrEmpty(record.consumptionIntervalCount)
      ? record.consumptionIntervalCount
      : 1,
    cigaretteBrandId:
      typeof record.cigaretteBrandId === "string" && record.cigaretteBrandId.length > 0
        ? record.cigaretteBrandId
        : DEFAULT_BRAND_ID,
    dobISO:
      typeof record.dobISO === "string"
        ? record.dobISO
        : inferDOBFromAgeYears(
            typeof record.ageYears === "number" && Number.isFinite(record.ageYears)
              ? record.ageYears
              : 35,
          ),
    biologicalSex: normalizeSex(record.biologicalSex),
    weightValue: weightValue === "" ? 70 : weightValue,
    weightUnit,
    heightValue: heightValue === "" ? 170 : heightValue,
    heightUnit,
  };
}

function normalizeBadgeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const unique = new Set<string>();
  for (const candidate of value) {
    if (typeof candidate === "string" && candidate.length > 0) {
      unique.add(candidate);
    }
  }
  return [...unique];
}

function normalizeStoredState(value: unknown): StoredStateV2 | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== 2) return null;

  const normalizedInputs = normalizeInputs(record.inputs);
  if (!normalizedInputs) return null;

  return {
    schemaVersion: 2,
    inputs: normalizedInputs,
    earnedBadgeIds: normalizeBadgeIds(record.earnedBadgeIds),
  };
}

export function loadStoredState(): StoredStateV2 | null {
  try {
    const rawV2 = localStorage.getItem(STATE_KEY_V2);
    if (rawV2) {
      const parsedV2 = JSON.parse(rawV2) as unknown;
      const normalized = normalizeStoredState(parsedV2);
      if (normalized) return normalized;
    }

    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if (!legacyRaw) return null;

    const legacyParsed = JSON.parse(legacyRaw) as unknown;
    const normalizedInputs = normalizeInputs(legacyParsed);
    if (!normalizedInputs) return null;

    return {
      schemaVersion: 2,
      inputs: normalizedInputs,
      earnedBadgeIds: [],
    };
  } catch {
    return null;
  }
}

export function saveStoredState(state: StoredStateV2): void {
  localStorage.setItem(STATE_KEY_V2, JSON.stringify(state));
}

export function loadInputs(): Inputs | null {
  return loadStoredState()?.inputs ?? null;
}

export function saveInputs(inputs: Inputs): void {
  const current = loadStoredState();
  saveStoredState({
    schemaVersion: 2,
    inputs,
    earnedBadgeIds: current?.earnedBadgeIds ?? [],
  });
}
