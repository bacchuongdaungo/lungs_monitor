// src/model.ts
export type Inputs = {
  yearsSmoking: number | "";
  cigsPerDay: number | "";
  quitDateISO: string;
};

export type ValidatedInputs = {
  yearsSmoking: number;
  cigsPerDay: number;
  quitDateISO: string;
  packYears: number;
};

export type LungSubscores = {
  sootLoad: number;
  inflammation: number;
  mucus: number;
  ciliaFunction: number;
  overallDirtiness: number;
};

export type RecoveryState = LungSubscores & {
  packYears: number;
  daysSinceQuit: number;
  previewDays: number;
  isProjected: boolean;
};

export type InputErrors = Partial<Record<keyof Inputs, string>>;

export type ValidationResult = {
  value: ValidatedInputs | null;
  errors: InputErrors;
};

export const MAX_YEARS_SMOKING = 80;
export const MAX_CIGS_PER_DAY = 80;
export const MAX_PREVIEW_DAYS = 730;

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

export function addDaysToISO(isoDate: string, days: number): string | null {
  const parsed = parseISODateLocal(isoDate);
  if (!parsed) return null;
  parsed.setDate(parsed.getDate() + days);
  return formatISODateLocal(parsed);
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

export function validateInputs(inputs: Inputs, now = new Date()): ValidationResult {
  const errors: InputErrors = {};

  const yearsError = validateRange("years smoked", inputs.yearsSmoking, 0, MAX_YEARS_SMOKING);
  if (yearsError) errors.yearsSmoking = yearsError;

  const cigsError = validateRange("cigarettes per day", inputs.cigsPerDay, 0, MAX_CIGS_PER_DAY);
  if (cigsError) errors.cigsPerDay = cigsError;

  const quitDate = parseISODateLocal(inputs.quitDateISO);
  if (!quitDate) {
    errors.quitDateISO = "Enter a valid quit date.";
  } else if (quitDate > startOfLocalDay(now)) {
    errors.quitDateISO = "Quit date cannot be in the future.";
  }

  if (Object.keys(errors).length > 0) {
    return { value: null, errors };
  }

  const yearsSmoking = Number(inputs.yearsSmoking);
  const cigsPerDay = Number(inputs.cigsPerDay);
  const quitDateISO = formatISODateLocal(quitDate as Date);

  return {
    value: {
      yearsSmoking,
      cigsPerDay,
      quitDateISO,
      packYears: packYears(cigsPerDay, yearsSmoking),
    },
    errors,
  };
}

export function sanitizeInputs(inputs: Inputs, now = new Date()): ValidatedInputs {
  const yearsSmoking = clamp(Number(inputs.yearsSmoking) || 0, 0, MAX_YEARS_SMOKING);
  const cigsPerDay = clamp(Number(inputs.cigsPerDay) || 0, 0, MAX_CIGS_PER_DAY);

  const parsedQuit = parseISODateLocal(inputs.quitDateISO);
  const today = startOfLocalDay(now);
  const safeQuitDate = parsedQuit && parsedQuit <= today ? parsedQuit : today;

  return {
    yearsSmoking,
    cigsPerDay,
    quitDateISO: formatISODateLocal(safeQuitDate),
    packYears: packYears(cigsPerDay, yearsSmoking),
  };
}

export function computeRecoveryState(
  validated: ValidatedInputs,
  previewDays: number,
  now = new Date(),
): RecoveryState {
  const day = clamp(Math.round(previewDays), 0, MAX_PREVIEW_DAYS);
  const daysSinceQuit = daysSince(validated.quitDateISO, now);

  const exposure = clamp01(1 - Math.exp(-0.11 * validated.packYears));

  const sootStart = clamp01(0.12 + 0.83 * exposure);
  const sootFloor = clamp01(0.03 + 0.2 * exposure);
  const sootLoad = sootFloor + (sootStart - sootFloor) * Math.exp(-day / 75);

  const inflammationStart = clamp01(0.15 + 0.78 * exposure);
  const inflammationFloor = clamp01(0.07 + 0.28 * exposure);
  const inflammation =
    inflammationFloor +
    (inflammationStart - inflammationFloor) * Math.exp(-day / 140);

  const mucusStart = clamp01(0.1 + 0.76 * exposure);
  const mucusFloor = clamp01(0.02 + 0.1 * exposure);
  const mucus = mucusFloor + (mucusStart - mucusFloor) * Math.exp(-day / 110);

  const ciliaStart = clamp01(0.2 + (1 - exposure) * 0.45);
  const ciliaCeiling = clamp01(0.95 - exposure * 0.25);
  const ciliaFunction =
    ciliaCeiling - (ciliaCeiling - ciliaStart) * Math.exp(-day / 120);

  const overallDirtiness = clamp01(0.45 * sootLoad + 0.35 * inflammation + 0.2 * mucus);

  return {
    packYears: validated.packYears,
    sootLoad,
    inflammation,
    mucus,
    ciliaFunction,
    overallDirtiness,
    daysSinceQuit,
    previewDays: day,
    isProjected: day > daysSinceQuit,
  };
}

export function computeRecoveryFromInputs(
  inputs: Inputs,
  previewDays: number,
  now = new Date(),
): RecoveryState {
  return computeRecoveryState(sanitizeInputs(inputs, now), previewDays, now);
}