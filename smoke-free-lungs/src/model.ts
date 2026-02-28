// src/model.ts
import { DEFAULT_BRAND_ID, getBrandById } from "./cigBrands";

export type BiologicalSex = "female" | "male" | "other";
export type SmokingLengthMode = "exact_dates" | "approx_years";
export type ConsumptionUnit = "cigarettes" | "packs";
export type ConsumptionIntervalUnit = "days" | "weeks";
export type WeightUnit = "kg" | "lb";
export type HeightUnit = "cm" | "in";

export type Inputs = {
  smokingLengthMode: SmokingLengthMode;
  smokingStartDateISO: string;
  approxSmokingYears: number | "";
  quitDateISO: string;
  consumptionUnit: ConsumptionUnit;
  consumptionQuantity: number | "";
  consumptionIntervalUnit: ConsumptionIntervalUnit;
  consumptionIntervalCount: number | "";
  cigaretteBrandId: string;
  dobISO: string;
  biologicalSex: BiologicalSex;
  weightValue: number | "";
  weightUnit: WeightUnit;
  heightValue: number | "";
  heightUnit: HeightUnit;
};

export type MetabolismCategory = "slower" | "average" | "faster";

export type ValidatedInputs = {
  smokingLengthMode: SmokingLengthMode;
  smokingStartDateISO: string;
  approxSmokingYears: number | null;
  quitDateISO: string;
  smokingYears: number;
  consumptionUnit: ConsumptionUnit;
  consumptionQuantity: number;
  consumptionIntervalUnit: ConsumptionIntervalUnit;
  consumptionIntervalCount: number;
  consumptionIntervalDays: number;
  cigsPerDay: number;
  packsPerWeek: number;
  dobISO: string;
  ageYears: number;
  biologicalSex: BiologicalSex;
  weightValue: number;
  weightUnit: WeightUnit;
  heightValue: number;
  heightUnit: HeightUnit;
  weightKg: number;
  heightCm: number;
  bmi: number;
  bmrKcalPerDay: number;
  metabolismFactor: number;
  metabolismCategory: MetabolismCategory;
  baselineRestingHeartRateBpm: number;
  cigaretteBrandId: string;
  cigaretteBrandName: string;
  nicotineMgPerCig: number;
  tarMgPerCig: number;
  packYears: number;
  effectivePackYears: number;
  dailyNicotineMg: number;
  dailyTarMg: number;
};

export type LungSubscores = {
  sootLoad: number;
  inflammation: number;
  mucus: number;
  ciliaFunction: number;
  tarBurden: number;
  nicotineDependence: number;
  dopamineTolerance: number;
  overallDirtiness: number;
};

export type RecoveryState = LungSubscores & {
  packYears: number;
  effectivePackYears: number;
  smokingYears: number;
  cigsPerDay: number;
  packsPerWeek: number;
  daysSinceQuit: number;
  previewDays: number;
  fullRecoveryDay: number;
  maxPreviewDays: number;
  isProjected: boolean;
  recoveryPercent: number;
  ageYears: number;
  metabolismFactor: number;
  metabolismCategory: MetabolismCategory;
  bmi: number;
  bmrKcalPerDay: number;
  restingHeartRateBpm: number;
  respirationRatePerMin: number;
  breathCycleSeconds: number;
  cigaretteBrandId: string;
  cigaretteBrandName: string;
  nicotineMgPerCig: number;
  tarMgPerCig: number;
  dailyNicotineMg: number;
  dailyTarMg: number;
};

export type InputErrors = Partial<Record<keyof Inputs, string>>;

export type ValidationResult = {
  value: ValidatedInputs | null;
  errors: InputErrors;
};

export const MAX_CIGS_PER_DAY = 80;
export const MAX_PREVIEW_DAYS = 3650;
export const MAX_AGE = 100;
export const MIN_AGE = 18;
export const MAX_SMOKING_YEARS = 80;
export const MAX_WEIGHT_KG = 300;
export const MIN_WEIGHT_KG = 35;
export const MAX_HEIGHT_CM = 240;
export const MIN_HEIGHT_CM = 130;
export const MAX_CONSUMPTION_QUANTITY = 2000;
export const MAX_CONSUMPTION_INTERVAL_COUNT = 365;
export const MIN_CONSUMPTION_INTERVAL_COUNT = 1;
export const FULL_RECOVERY_THRESHOLD = 0.995;

const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

const MS_PER_DAY = 86_400_000;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const clamp01 = (value: number) => clamp(value, 0, 1);

export function formatISODateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO(now = new Date()): string {
  return formatISODateLocal(now);
}

export function parseISODateLocal(isoDate: string): Date | null {
  const match = ISO_DATE_RE.exec(isoDate);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);
  const isValid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  return isValid ? date : null;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateDiffDays(startISO: string, endISO: string): number {
  const start = parseISODateLocal(startISO);
  const end = parseISODateLocal(endISO);
  if (!start || !end) return 0;

  const deltaMs = startOfLocalDay(end).getTime() - startOfLocalDay(start).getTime();
  return Math.max(0, Math.floor(deltaMs / MS_PER_DAY));
}

export function smokingYearsByDates(startISO: string, endISO: string): number {
  return dateDiffDays(startISO, endISO) / 365.25;
}

export function addDaysToISO(isoDate: string, days: number): string | null {
  const parsed = parseISODateLocal(isoDate);
  if (!parsed) return null;
  parsed.setDate(parsed.getDate() + days);
  return formatISODateLocal(parsed);
}

export function inferDOBFromAgeYears(ageYears: number, now = new Date()): string {
  const dob = startOfLocalDay(now);
  dob.setDate(dob.getDate() - Math.round(ageYears * 365.25));
  return formatISODateLocal(dob);
}

export function ageYearsFromDOBISO(dobISO: string, now = new Date()): number | null {
  const dob = parseISODateLocal(dobISO);
  if (!dob) return null;
  const deltaMs = startOfLocalDay(now).getTime() - startOfLocalDay(dob).getTime();
  if (deltaMs < 0) return null;
  return deltaMs / MS_PER_DAY / 365.25;
}

function normalizeSex(value: unknown): BiologicalSex {
  if (value === "female" || value === "male" || value === "other") return value;  
  return "other";
}

function normalizeLengthMode(value: unknown): SmokingLengthMode {
  if (value === "approx_years") return "approx_years";
  return "exact_dates";
}

function normalizeConsumptionUnit(value: unknown): ConsumptionUnit {
  if (value === "packs") return "packs";
  return "cigarettes";
}

function normalizeConsumptionIntervalUnit(value: unknown): ConsumptionIntervalUnit {
  if (value === "weeks") return "weeks";
  return "days";
}

function normalizeWeightUnit(value: unknown): WeightUnit {
  if (value === "lb") return "lb";
  return "kg";
}

function normalizeHeightUnit(value: unknown): HeightUnit {
  if (value === "in") return "in";
  return "cm";
}

function readNumberish(value: number | ""): number | null {
  if (value === "") return null;
  if (!Number.isFinite(value)) return null;
  return value;
}

function validateRange(label: string, value: number | "", min: number, max: number): string | null {
  const numeric = readNumberish(value);
  if (numeric == null) return `Enter ${label}.`;
  if (numeric < min || numeric > max) return `${label} must be between ${min} and ${max}.`;
  return null;
}

function intervalDays(intervalUnit: ConsumptionIntervalUnit, intervalCount: number): number {
  return intervalUnit === "weeks" ? intervalCount * 7 : intervalCount;
}

export function estimateCigsPerDay(
  consumptionUnit: ConsumptionUnit,
  quantity: number,
  consumptionIntervalUnit: ConsumptionIntervalUnit,
  consumptionIntervalCount: number,
): number | null {
  if (!Number.isFinite(quantity) || !Number.isFinite(consumptionIntervalCount)) return null;
  if (quantity < 0 || consumptionIntervalCount < MIN_CONSUMPTION_INTERVAL_COUNT) return null;

  const days = intervalDays(consumptionIntervalUnit, consumptionIntervalCount);
  if (days <= 0) return null;

  const cigarettes = consumptionUnit === "packs" ? quantity * 20 : quantity;
  return cigarettes / days;
}

function toKg(weightValue: number, weightUnit: WeightUnit): number {
  return weightUnit === "lb" ? weightValue * KG_PER_LB : weightValue;
}

function toCm(heightValue: number, heightUnit: HeightUnit): number {
  return heightUnit === "in" ? heightValue * CM_PER_IN : heightValue;
}

export function packYears(cigsPerDay: number, yearsSmoking: number): number {
  return (cigsPerDay / 20) * yearsSmoking;
}

export function daysSince(quitDateISO: string, now = new Date()): number {
  const quitDate = parseISODateLocal(quitDateISO);
  if (!quitDate) return 0;

  const deltaMs = startOfLocalDay(now).getTime() - startOfLocalDay(quitDate).getTime();
  return Math.max(0, Math.floor(deltaMs / MS_PER_DAY));
}

function mifflinStJeorBmr(weightKg: number, heightCm: number, ageYears: number, sex: BiologicalSex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (sex === "male") return base + 5;
  if (sex === "female") return base - 161;
  return base - 78;
}

function computeBmi(weightKg: number, heightCm: number): number {
  const meters = heightCm / 100;
  if (meters <= 0) return 0;
  return weightKg / (meters * meters);
}

function computeMetabolismFactor(bmrKcalPerDay: number, weightKg: number): number {
  const baselineBmr = 1600;
  const bmrRatio = bmrKcalPerDay / baselineBmr;

  const bmiNeutralWeight = 70;
  const weightRatio = Math.sqrt(weightKg / bmiNeutralWeight);

  const combined = 0.62 * bmrRatio + 0.38 * weightRatio;
  return clamp(combined, 0.8, 1.25);
}

function categorizeMetabolism(factor: number): MetabolismCategory {
  if (factor < 0.95) return "slower";
  if (factor > 1.07) return "faster";
  return "average";
}

function computeBaselineRestingHeartRateBpm(
  ageYears: number,
  bmi: number,
  metabolismFactor: number,
  biologicalSex: BiologicalSex,
): number {
  const sexOffset = biologicalSex === "male" ? -1 : biologicalSex === "female" ? 1 : 0;
  const ageOffset = (ageYears - 35) * 0.22;
  const bmiOffset = (bmi - 22) * 0.75;
  const metabolismOffset = (1 - metabolismFactor) * 10;

  const baseline = 70 + sexOffset + ageOffset + bmiOffset + metabolismOffset;
  return clamp(baseline, 52, 95);
}

function computeDynamicCardioRates(
  validated: ValidatedInputs,
  curve: ReturnType<typeof computeCurveAtDay>,
): { restingHeartRateBpm: number; respirationRatePerMin: number; breathCycleSeconds: number } {
  const exposurePenalty = clamp(validated.effectivePackYears / 20, 0, 1) * 5;
  const recoveryPenalty =
    curve.nicotineDependence * 8 +
    curve.inflammation * 6 +
    curve.dopamineTolerance * 3;

  const restingHeartRateBpm = clamp(
    validated.baselineRestingHeartRateBpm + exposurePenalty + recoveryPenalty - curve.recoveryPercent * 3,
    48,
    112,
  );

  const respirationRatePerMin = clamp(
    restingHeartRateBpm / 4.7 +
      curve.inflammation * 3 +
      curve.mucus * 2 -
      curve.ciliaFunction * 1.2,
    10,
    24,
  );

  return {
    restingHeartRateBpm,
    respirationRatePerMin,
    breathCycleSeconds: 60 / respirationRatePerMin,
  };
}

function computeBrandChemistryMultiplier(tarMg: number, nicotineMg: number): number {
  const tarNorm = clamp01((tarMg - 6) / 14);
  const nicotineNorm = clamp01((nicotineMg - 0.4) / 1.3);
  const chemistryLoad = 0.68 * tarNorm + 0.32 * nicotineNorm;
  return 0.86 + chemistryLoad * 0.34;
}

function buildCurveContext(validated: ValidatedInputs) {
  const exposure = clamp01(1 - Math.exp(-0.085 * validated.effectivePackYears));

  const nicotineNorm = clamp01(validated.dailyNicotineMg / 20);
  const tarNorm = clamp01(validated.dailyTarMg / 220);

  const tarBurdenStart = clamp01(0.2 + 0.8 * (0.7 * exposure + 0.3 * tarNorm));
  const tarBurdenFloor = clamp01(0.004 + 0.05 * exposure);

  const nicotineDependenceStart = clamp01(0.18 + 0.82 * nicotineNorm);
  const nicotineDependenceFloor = 0.02;

  const dopamineToleranceStart = clamp01(0.1 + 0.9 * (0.55 * exposure + 0.45 * nicotineNorm));
  const dopamineToleranceFloor = 0.03;

  const sootStart = clamp01(0.06 + 0.9 * exposure + 0.08 * tarNorm);
  const sootFloor = clamp01(0.005 + 0.08 * exposure);

  const inflammationStart = clamp01(0.08 + 0.86 * exposure + 0.05 * nicotineNorm);
  const inflammationFloor = clamp01(0.01 + 0.09 * exposure);

  const mucusStart = clamp01(0.06 + 0.82 * exposure);
  const mucusFloor = clamp01(0.004 + 0.05 * exposure);

  const ciliaStart = clamp01(0.28 + (1 - exposure) * 0.4);
  const ciliaCeiling = clamp01(0.98 - exposure * 0.16);

  const startOverall = clamp01(
    0.33 * sootStart +
      0.24 * inflammationStart +
      0.15 * mucusStart +
      0.12 * tarBurdenStart +
      0.08 * nicotineDependenceStart +
      0.08 * dopamineToleranceStart,
  );

  const floorOverall = clamp01(
    0.33 * sootFloor +
      0.24 * inflammationFloor +
      0.15 * mucusFloor +
      0.12 * tarBurdenFloor +
      0.08 * nicotineDependenceFloor +
      0.08 * dopamineToleranceFloor,
  );

  const recoveryRange = Math.max(1e-6, startOverall - floorOverall);

  return {
    sootStart,
    sootFloor,
    inflammationStart,
    inflammationFloor,
    mucusStart,
    mucusFloor,
    ciliaStart,
    ciliaCeiling,
    tarBurdenStart,
    tarBurdenFloor,
    nicotineDependenceStart,
    nicotineDependenceFloor,
    dopamineToleranceStart,
    dopamineToleranceFloor,
    startOverall,
    floorOverall,
    recoveryRange,
  };
}

function computeCurveAtDay(validated: ValidatedInputs, day: number) {
  const context = buildCurveContext(validated);
  const adjustedDay = Math.max(0, day) * validated.metabolismFactor;

  const sootLoad =
    context.sootFloor +
    (context.sootStart - context.sootFloor) * Math.exp(-adjustedDay / 82);

  const inflammation =
    context.inflammationFloor +
    (context.inflammationStart - context.inflammationFloor) * Math.exp(-adjustedDay / 156);

  const mucus =
    context.mucusFloor +
    (context.mucusStart - context.mucusFloor) * Math.exp(-adjustedDay / 120);

  const tarBurden =
    context.tarBurdenFloor +
    (context.tarBurdenStart - context.tarBurdenFloor) * Math.exp(-adjustedDay / 188);

  const nicotineDependence =
    context.nicotineDependenceFloor +
    (context.nicotineDependenceStart - context.nicotineDependenceFloor) * Math.exp(-adjustedDay / 46);

  const dopamineTolerance =
    context.dopamineToleranceFloor +
    (context.dopamineToleranceStart - context.dopamineToleranceFloor) * Math.exp(-adjustedDay / 236);

  const ciliaFunction =
    context.ciliaCeiling -
    (context.ciliaCeiling - context.ciliaStart) * Math.exp(-adjustedDay / 132);

  const overallDirtiness = clamp01(
    0.33 * sootLoad +
      0.24 * inflammation +
      0.15 * mucus +
      0.12 * tarBurden +
      0.08 * nicotineDependence +
      0.08 * dopamineTolerance,
  );

  const recoveryPercent =
    context.recoveryRange <= 1e-6
      ? 1
      : clamp01((context.startOverall - overallDirtiness) / context.recoveryRange);

  return {
    sootLoad,
    inflammation,
    mucus,
    ciliaFunction,
    tarBurden,
    nicotineDependence,
    dopamineTolerance,
    overallDirtiness,
    recoveryPercent,
  };
}

export function estimateFullRecoveryDay(validated: ValidatedInputs): number {
  for (let day = 0; day <= MAX_PREVIEW_DAYS; day += 1) {
    const curve = computeCurveAtDay(validated, day);
    if (curve.recoveryPercent >= FULL_RECOVERY_THRESHOLD) {
      return day;
    }
  }

  return MAX_PREVIEW_DAYS;
}

export function validateInputs(inputs: Inputs, now = new Date()): ValidationResult {
  const errors: InputErrors = {};

  const lengthMode = normalizeLengthMode(inputs.smokingLengthMode);
  const consumptionUnit = normalizeConsumptionUnit(inputs.consumptionUnit);
  const consumptionIntervalUnit = normalizeConsumptionIntervalUnit(inputs.consumptionIntervalUnit);
  const weightUnit = normalizeWeightUnit(inputs.weightUnit);
  const heightUnit = normalizeHeightUnit(inputs.heightUnit);

  const quitDate = parseISODateLocal(inputs.quitDateISO);
  if (!quitDate) {
    errors.quitDateISO = "Enter a valid quit date.";
  } else if (quitDate > startOfLocalDay(now)) {
    errors.quitDateISO = "Quit date cannot be in the future.";
  }

  let smokingStartDateISO = inputs.quitDateISO;
  let smokingYears = 0;
  let approxSmokingYears: number | null = null;

  if (lengthMode === "exact_dates") {
    const smokingStartDate = parseISODateLocal(inputs.smokingStartDateISO);
    if (!smokingStartDate) {
      errors.smokingStartDateISO = "Enter a valid smoking start date.";
    } else if (quitDate && smokingStartDate > quitDate) {
      errors.smokingStartDateISO = "Smoking start date must be on or before quit date.";
    } else {
      smokingStartDateISO = formatISODateLocal(smokingStartDate);
      smokingYears = smokingYearsByDates(smokingStartDateISO, formatISODateLocal(quitDate as Date));
    }
  } else {
    const approxError = validateRange("approximate smoking years", inputs.approxSmokingYears, 0, MAX_SMOKING_YEARS);
    if (approxError) {
      errors.approxSmokingYears = approxError;
    } else {
      approxSmokingYears = Number(inputs.approxSmokingYears);
      smokingYears = approxSmokingYears;
      const derived = addDaysToISO(formatISODateLocal(quitDate as Date), -Math.round(smokingYears * 365.25));
      smokingStartDateISO = derived ?? formatISODateLocal(quitDate as Date);
    }
  }

  const qtyError = validateRange("smoking quantity", inputs.consumptionQuantity, 0, MAX_CONSUMPTION_QUANTITY);
  if (qtyError) errors.consumptionQuantity = qtyError;

  const intervalError = validateRange(
    "interval count",
    inputs.consumptionIntervalCount,
    MIN_CONSUMPTION_INTERVAL_COUNT,
    MAX_CONSUMPTION_INTERVAL_COUNT,
  );
  if (intervalError) errors.consumptionIntervalCount = intervalError;

  const estimatedCigsPerDay = estimateCigsPerDay(
    consumptionUnit,
    Number(inputs.consumptionQuantity),
    consumptionIntervalUnit,
    Number(inputs.consumptionIntervalCount),
  );

  if (estimatedCigsPerDay == null) {
    errors.consumptionQuantity = errors.consumptionQuantity ?? "Enter a valid smoking pattern.";
  } else if (estimatedCigsPerDay > MAX_CIGS_PER_DAY) {
    errors.consumptionQuantity = `This pattern equals ${estimatedCigsPerDay.toFixed(1)} cigarettes/day; max supported is ${MAX_CIGS_PER_DAY}.`;
  }

  const dob = parseISODateLocal(inputs.dobISO);
  const ageYears = ageYearsFromDOBISO(inputs.dobISO, now);
  if (!dob || ageYears == null) {
    errors.dobISO = "Enter a valid date of birth.";
  } else if (ageYears < MIN_AGE || ageYears > MAX_AGE) {
    errors.dobISO = `Age must be between ${MIN_AGE} and ${MAX_AGE}.`;
  }

  const weightValue = readNumberish(inputs.weightValue);
  if (weightValue == null) {
    errors.weightValue = "Enter weight.";
  }
  const heightValue = readNumberish(inputs.heightValue);
  if (heightValue == null) {
    errors.heightValue = "Enter height.";
  }

  const weightKg = weightValue == null ? 0 : toKg(weightValue, weightUnit);
  const heightCm = heightValue == null ? 0 : toCm(heightValue, heightUnit);

  if (weightValue != null && (weightKg < MIN_WEIGHT_KG || weightKg > MAX_WEIGHT_KG)) {
    errors.weightValue = `Weight is outside supported range (${MIN_WEIGHT_KG}-${MAX_WEIGHT_KG} kg).`;
  }

  if (heightValue != null && (heightCm < MIN_HEIGHT_CM || heightCm > MAX_HEIGHT_CM)) {
    errors.heightValue = `Height is outside supported range (${MIN_HEIGHT_CM}-${MAX_HEIGHT_CM} cm).`;
  }

  const biologicalSex = normalizeSex(inputs.biologicalSex);
  if (biologicalSex !== inputs.biologicalSex) {
    errors.biologicalSex = "Pick a biological sex.";
  }

  const brand = getBrandById(inputs.cigaretteBrandId);
  if (!brand) {
    errors.cigaretteBrandId = "Pick a cigarette brand.";
  }

  if (Object.keys(errors).length > 0 || !quitDate || !brand || estimatedCigsPerDay == null || ageYears == null) {
    return { value: null, errors };
  }

  const quitDateISO = formatISODateLocal(quitDate);
  const consumptionQuantity = Number(inputs.consumptionQuantity);
  const consumptionIntervalCount = Number(inputs.consumptionIntervalCount);
  const consumptionIntervalDays = intervalDays(consumptionIntervalUnit, consumptionIntervalCount);
  const cigsPerDay = estimatedCigsPerDay;
  const packsPerWeek = (cigsPerDay / 20) * 7;

  const bmrKcalPerDay = mifflinStJeorBmr(weightKg, heightCm, ageYears, biologicalSex);
  const bmi = computeBmi(weightKg, heightCm);
  const metabolismFactor = computeMetabolismFactor(bmrKcalPerDay, weightKg);
  const metabolismCategory = categorizeMetabolism(metabolismFactor);
  const baselineRestingHeartRateBpm = computeBaselineRestingHeartRateBpm(
    ageYears,
    bmi,
    metabolismFactor,
    biologicalSex,
  );

  const pack = packYears(cigsPerDay, smokingYears);
  const chemistryMultiplier = computeBrandChemistryMultiplier(brand.tarMg, brand.nicotineMg);

  return {
    value: {
      smokingLengthMode: lengthMode,
      smokingStartDateISO,
      approxSmokingYears,
      quitDateISO,
      smokingYears,
      consumptionUnit,
      consumptionQuantity,
      consumptionIntervalUnit,
      consumptionIntervalCount,
      consumptionIntervalDays,
      cigsPerDay,
      packsPerWeek,
      dobISO: formatISODateLocal(dob as Date),
      ageYears,
      biologicalSex,
      weightValue: weightValue as number,
      weightUnit,
      heightValue: heightValue as number,
      heightUnit,
      weightKg,
      heightCm,
      bmi,
      bmrKcalPerDay,
      metabolismFactor,
      metabolismCategory,
      baselineRestingHeartRateBpm,
      cigaretteBrandId: brand.id,
      cigaretteBrandName: brand.name,
      nicotineMgPerCig: brand.nicotineMg,
      tarMgPerCig: brand.tarMg,
      packYears: pack,
      effectivePackYears: pack * chemistryMultiplier,
      dailyNicotineMg: brand.nicotineMg * cigsPerDay,
      dailyTarMg: brand.tarMg * cigsPerDay,
    },
    errors,
  };
}

export function sanitizeInputs(inputs: Inputs, now = new Date()): ValidatedInputs {
  const today = startOfLocalDay(now);
  const lengthMode = normalizeLengthMode(inputs.smokingLengthMode);

  const quitCandidate = parseISODateLocal(inputs.quitDateISO);
  const safeQuitDate = quitCandidate && quitCandidate <= today ? quitCandidate : today;
  const quitDateISO = formatISODateLocal(safeQuitDate);

  let smokingStartDateISO = quitDateISO;
  let smokingYears = 0;
  let approxSmokingYears: number | null = null;

  if (lengthMode === "exact_dates") {
    const startCandidate = parseISODateLocal(inputs.smokingStartDateISO);
    const safeStart = startCandidate && startCandidate <= safeQuitDate ? startCandidate : safeQuitDate;
    smokingStartDateISO = formatISODateLocal(safeStart);
    smokingYears = smokingYearsByDates(smokingStartDateISO, quitDateISO);
  } else {
    approxSmokingYears = clamp(Number(inputs.approxSmokingYears) || 0, 0, MAX_SMOKING_YEARS);
    smokingYears = approxSmokingYears;
    smokingStartDateISO = addDaysToISO(quitDateISO, -Math.round(smokingYears * 365.25)) ?? quitDateISO;
  }

  const consumptionUnit = normalizeConsumptionUnit(inputs.consumptionUnit);
  const consumptionIntervalUnit = normalizeConsumptionIntervalUnit(inputs.consumptionIntervalUnit);
  const consumptionQuantity = clamp(Number(inputs.consumptionQuantity) || 0, 0, MAX_CONSUMPTION_QUANTITY);
  const consumptionIntervalCount = clamp(
    Number(inputs.consumptionIntervalCount) || 1,
    MIN_CONSUMPTION_INTERVAL_COUNT,
    MAX_CONSUMPTION_INTERVAL_COUNT,
  );
  const consumptionIntervalDays = intervalDays(consumptionIntervalUnit, consumptionIntervalCount);

  const estimated = estimateCigsPerDay(
    consumptionUnit,
    consumptionQuantity,
    consumptionIntervalUnit,
    consumptionIntervalCount,
  );
  const cigsPerDay = clamp(estimated ?? 0, 0, MAX_CIGS_PER_DAY);
  const packsPerWeek = (cigsPerDay / 20) * 7;

  const dobCandidate = parseISODateLocal(inputs.dobISO);
  const safeDob = dobCandidate && dobCandidate <= today ? dobCandidate : parseISODateLocal(inferDOBFromAgeYears(30, now));
  const dobISO = formatISODateLocal(safeDob as Date);
  const ageYears = clamp(ageYearsFromDOBISO(dobISO, now) ?? 30, MIN_AGE, MAX_AGE);

  const biologicalSex = normalizeSex(inputs.biologicalSex);

  const weightUnit = normalizeWeightUnit(inputs.weightUnit);
  const heightUnit = normalizeHeightUnit(inputs.heightUnit);

  const weightValue = Number(inputs.weightValue) || (weightUnit === "kg" ? 70 : 154.3);
  const heightValue = Number(inputs.heightValue) || (heightUnit === "cm" ? 170 : 66.9);

  const weightKg = clamp(toKg(weightValue, weightUnit), MIN_WEIGHT_KG, MAX_WEIGHT_KG);
  const heightCm = clamp(toCm(heightValue, heightUnit), MIN_HEIGHT_CM, MAX_HEIGHT_CM);

  const brand = getBrandById(inputs.cigaretteBrandId) ?? getBrandById(DEFAULT_BRAND_ID);

  const bmrKcalPerDay = mifflinStJeorBmr(weightKg, heightCm, ageYears, biologicalSex);
  const bmi = computeBmi(weightKg, heightCm);
  const metabolismFactor = computeMetabolismFactor(bmrKcalPerDay, weightKg);
  const metabolismCategory = categorizeMetabolism(metabolismFactor);
  const baselineRestingHeartRateBpm = computeBaselineRestingHeartRateBpm(
    ageYears,
    bmi,
    metabolismFactor,
    biologicalSex,
  );

  const pack = packYears(cigsPerDay, smokingYears);
  const chemistryMultiplier = computeBrandChemistryMultiplier(brand.tarMg, brand.nicotineMg);

  return {
    smokingLengthMode: lengthMode,
    smokingStartDateISO,
    approxSmokingYears,
    quitDateISO,
    smokingYears,
    consumptionUnit,
    consumptionQuantity,
    consumptionIntervalUnit,
    consumptionIntervalCount,
    consumptionIntervalDays,
    cigsPerDay,
    packsPerWeek,
    dobISO,
    ageYears,
    biologicalSex,
    weightValue,
    weightUnit,
    heightValue,
    heightUnit,
    weightKg,
    heightCm,
    bmi,
    bmrKcalPerDay,
    metabolismFactor,
    metabolismCategory,
    baselineRestingHeartRateBpm,
    cigaretteBrandId: brand.id,
    cigaretteBrandName: brand.name,
    nicotineMgPerCig: brand.nicotineMg,
    tarMgPerCig: brand.tarMg,
    packYears: pack,
    effectivePackYears: pack * chemistryMultiplier,
    dailyNicotineMg: brand.nicotineMg * cigsPerDay,
    dailyTarMg: brand.tarMg * cigsPerDay,
  };
}

export function computeRecoveryState(
  validated: ValidatedInputs,
  previewDays: number,
  now = new Date(),
  fullRecoveryDayOverride?: number,
): RecoveryState {
  const daysSinceQuit = daysSince(validated.quitDateISO, now);
  const fullRecoveryDay =
    typeof fullRecoveryDayOverride === "number"
      ? clamp(Math.round(fullRecoveryDayOverride), 0, MAX_PREVIEW_DAYS)
      : estimateFullRecoveryDay(validated);

  const day = clamp(Math.round(previewDays), 0, fullRecoveryDay);
  const curve = computeCurveAtDay(validated, day);
  const cardioRates = computeDynamicCardioRates(validated, curve);

  return {
    packYears: validated.packYears,
    effectivePackYears: validated.effectivePackYears,
    smokingYears: validated.smokingYears,
    cigsPerDay: validated.cigsPerDay,
    packsPerWeek: validated.packsPerWeek,
    sootLoad: curve.sootLoad,
    inflammation: curve.inflammation,
    mucus: curve.mucus,
    ciliaFunction: curve.ciliaFunction,
    tarBurden: curve.tarBurden,
    nicotineDependence: curve.nicotineDependence,
    dopamineTolerance: curve.dopamineTolerance,
    overallDirtiness: curve.overallDirtiness,
    daysSinceQuit,
    previewDays: day,
    fullRecoveryDay,
    maxPreviewDays: fullRecoveryDay,
    isProjected: day > daysSinceQuit,
    recoveryPercent: curve.recoveryPercent,
    ageYears: validated.ageYears,
    metabolismFactor: validated.metabolismFactor,
    metabolismCategory: validated.metabolismCategory,
    bmi: validated.bmi,
    bmrKcalPerDay: validated.bmrKcalPerDay,
    restingHeartRateBpm: cardioRates.restingHeartRateBpm,
    respirationRatePerMin: cardioRates.respirationRatePerMin,
    breathCycleSeconds: cardioRates.breathCycleSeconds,
    cigaretteBrandId: validated.cigaretteBrandId,
    cigaretteBrandName: validated.cigaretteBrandName,
    nicotineMgPerCig: validated.nicotineMgPerCig,
    tarMgPerCig: validated.tarMgPerCig,
    dailyNicotineMg: validated.dailyNicotineMg,
    dailyTarMg: validated.dailyTarMg,
  };
}

export function computeRecoveryFromInputs(
  inputs: Inputs,
  previewDays: number,
  now = new Date(),
): RecoveryState {
  return computeRecoveryState(sanitizeInputs(inputs, now), previewDays, now);
}
