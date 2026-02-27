import { describe, expect, it } from "vitest";
import {
  computeRecoveryState,
  daysSince,
  estimateCigsPerDay,
  estimateFullRecoveryDay,
  inferDOBFromAgeYears,
  packYears,
  sanitizeInputs,
  smokingYearsByDates,
  validateInputs,
  type Inputs,
} from "./model";

const baseInputs: Inputs = {
  smokingLengthMode: "exact_dates",
  smokingStartDateISO: "2018-01-10",
  approxSmokingYears: 8,
  quitDateISO: "2026-01-10",
  consumptionUnit: "cigarettes",
  consumptionQuantity: 10,
  consumptionIntervalUnit: "days",
  consumptionIntervalCount: 1,
  cigaretteBrandId: "average-us-king",
  dobISO: "1991-01-10",
  biologicalSex: "other",
  weightValue: 70,
  weightUnit: "kg",
  heightValue: 170,
  heightUnit: "cm",
};

describe("model", () => {
  it("computes pack-years", () => {
    expect(packYears(20, 10)).toBe(10);
    expect(packYears(10, 8)).toBe(4);
  });

  it("computes smoking years from start and quit dates", () => {
    expect(smokingYearsByDates("2016-01-01", "2026-01-01")).toBeCloseTo(10, 1);
    expect(smokingYearsByDates("2026-01-01", "2026-01-01")).toBe(0);
  });

  it("converts pattern to cigarettes/day", () => {
    expect(estimateCigsPerDay("cigarettes", 10, "days", 1)).toBe(10);
    expect(estimateCigsPerDay("packs", 2, "weeks", 1)).toBeCloseTo(5.714, 2);
  });

  it("sanitizes invalid values and fixes invalid date order", () => {
    const sanitized = sanitizeInputs(
      {
        smokingLengthMode: "exact_dates",
        smokingStartDateISO: "2026-04-01",
        approxSmokingYears: "",
        quitDateISO: "2099-01-01",
        consumptionUnit: "packs",
        consumptionQuantity: 250,
        consumptionIntervalUnit: "days",
        consumptionIntervalCount: 0,
        cigaretteBrandId: "unknown-id",
        dobISO: "2099-01-01",
        biologicalSex: "other",
        weightValue: 500,
        weightUnit: "kg",
        heightValue: 300,
        heightUnit: "cm",
      },
      new Date(2026, 1, 26),
    );

    expect(sanitized.quitDateISO).toBe("2026-02-26");
    expect(sanitized.smokingStartDateISO).toBe("2026-02-26");
    expect(sanitized.cigsPerDay).toBeLessThanOrEqual(80);
    expect(sanitized.weightKg).toBe(300);
    expect(sanitized.heightCm).toBe(240);
    expect(sanitized.cigaretteBrandId).toBe("average-us-king");
    expect(sanitized.dobISO).toBe(inferDOBFromAgeYears(30, new Date(2026, 1, 26)));
  });

  it("uses local calendar days and clamps future quit date", () => {
    const now = new Date(2026, 1, 26, 23, 50, 0);

    expect(daysSince("2026-02-26", now)).toBe(0);
    expect(daysSince("2026-02-25", now)).toBe(1);
    expect(daysSince("2026-02-27", now)).toBe(0);
  });

  it("returns validation errors for out-of-range and invalid dates", () => {
    const result = validateInputs(
      {
        ...baseInputs,
        consumptionQuantity: 5000,
        consumptionIntervalCount: 0,
        weightValue: 20,
        heightValue: 280,
        dobISO: "2020-01-01",
        smokingStartDateISO: "2026-03-10",
      },
      new Date(2026, 1, 26),
    );

    expect(result.value).toBeNull();
    expect(result.errors.consumptionQuantity).toMatch(/between 0 and 2000|max supported/i);
    expect(result.errors.consumptionIntervalCount).toMatch(/between 1 and 365/i);
    expect(result.errors.weightValue).toMatch(/outside supported range/i);
    expect(result.errors.heightValue).toMatch(/outside supported range/i);
    expect(result.errors.dobISO).toMatch(/between 18 and 100/i);
    expect(result.errors.smokingStartDateISO).toMatch(/on or before quit date/i);
  });

  it("produces monotonic trends for key subscores", () => {
    const now = new Date(2026, 1, 26);
    const validated = sanitizeInputs(
      {
        ...baseInputs,
        smokingStartDateISO: "2006-01-01",
        consumptionUnit: "packs",
        consumptionQuantity: 2,
        consumptionIntervalUnit: "days",
        consumptionIntervalCount: 1,
        dobISO: "1982-01-01",
        biologicalSex: "male",
        weightValue: 82,
        weightUnit: "kg",
        heightValue: 178,
        heightUnit: "cm",
      },
      now,
    );

    const day0 = computeRecoveryState(validated, 0, now);
    const day30 = computeRecoveryState(validated, 30, now);
    const day365 = computeRecoveryState(validated, 365, now);

    expect(day30.sootLoad).toBeLessThan(day0.sootLoad);
    expect(day365.sootLoad).toBeLessThan(day30.sootLoad);

    expect(day30.inflammation).toBeLessThan(day0.inflammation);
    expect(day365.inflammation).toBeLessThan(day30.inflammation);

    expect(day30.mucus).toBeLessThan(day0.mucus);
    expect(day365.mucus).toBeLessThan(day30.mucus);

    expect(day30.tarBurden).toBeLessThan(day0.tarBurden);
    expect(day365.tarBurden).toBeLessThan(day30.tarBurden);

    expect(day30.dopamineTolerance).toBeLessThan(day0.dopamineTolerance);
    expect(day365.dopamineTolerance).toBeLessThan(day30.dopamineTolerance);

    expect(day30.ciliaFunction).toBeGreaterThan(day0.ciliaFunction);
    expect(day365.ciliaFunction).toBeGreaterThan(day30.ciliaFunction);
  });

  it("estimates full recovery and caps preview day", () => {
    const now = new Date(2026, 1, 26);
    const validated = sanitizeInputs(baseInputs, now);
    const fullDay = estimateFullRecoveryDay(validated);

    const projectedPastFull = computeRecoveryState(validated, fullDay + 500, now, fullDay);
    expect(projectedPastFull.previewDays).toBe(fullDay);
    expect(projectedPastFull.recoveryPercent).toBeGreaterThan(0.99);
  });

  it("is deterministic for identical inputs/day", () => {
    const now = new Date(2026, 1, 26);
    const validated = sanitizeInputs(baseInputs, now);

    const fullDay = estimateFullRecoveryDay(validated);
    const a = computeRecoveryState(validated, 90, now, fullDay);
    const b = computeRecoveryState(validated, 90, now, fullDay);

    expect(a).toEqual(b);
  });
});
