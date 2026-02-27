// src/storage.ts
import type { Inputs } from "./model";

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

function isInputs(value: unknown): value is Inputs {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return (
    isNumberishOrEmpty(record.yearsSmoking) &&
    isNumberishOrEmpty(record.cigsPerDay) &&
    typeof record.quitDateISO === "string"
  );
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
  if (!isInputs(record.inputs)) return null;

  return {
    schemaVersion: 2,
    inputs: record.inputs,
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
    if (!isInputs(legacyParsed)) return null;

    return {
      schemaVersion: 2,
      inputs: legacyParsed,
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