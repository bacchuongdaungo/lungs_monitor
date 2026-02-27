import type {
  ConsumptionIntervalUnit,
  ConsumptionUnit,
  HeightUnit,
  WeightUnit,
} from "./model";

const CIGS_PER_PACK = 20;
const LB_PER_KG = 2.2046226218;
const CM_PER_IN = 2.54;

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function convertNumberishInput(
  value: number | "",
  converter: (sourceValue: number) => number,
  decimals: number,
): number | "" {
  if (value === "" || !Number.isFinite(value)) return "";
  return roundTo(converter(value), decimals);
}

export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value;
  return from === "kg" ? value * LB_PER_KG : value / LB_PER_KG;
}

export function convertHeight(value: number, from: HeightUnit, to: HeightUnit): number {
  if (from === to) return value;
  return from === "cm" ? value / CM_PER_IN : value * CM_PER_IN;
}

export function convertConsumptionQuantityForUnit(
  quantity: number,
  from: ConsumptionUnit,
  to: ConsumptionUnit,
): number {
  if (from === to) return quantity;
  return from === "cigarettes" ? quantity / CIGS_PER_PACK : quantity * CIGS_PER_PACK;
}

export function convertConsumptionQuantityForInterval(
  quantity: number,
  from: ConsumptionIntervalUnit,
  to: ConsumptionIntervalUnit,
): number {
  if (from === to) return quantity;
  return from === "days" ? quantity * 7 : quantity / 7;
}

export function inchesToFeetInches(totalInches: number): { feet: number; inches: number } {
  const rounded = Math.max(0, Math.round(totalInches));
  return {
    feet: Math.floor(rounded / 12),
    inches: rounded % 12,
  };
}

export function feetInchesToTotalInches(feet: number, inches: number): number {
  const safeFeet = Number.isFinite(feet) ? Math.max(0, Math.round(feet)) : 0;
  const safeInches = Number.isFinite(inches) ? Math.max(0, Math.round(inches)) : 0;
  return safeFeet * 12 + safeInches;
}
