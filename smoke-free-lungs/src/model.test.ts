import { describe, expect, it } from "vitest";
import {
  computeRecoveryState,
  daysSince,
  packYears,
  sanitizeInputs,
  validateInputs,
  type Inputs,
} from "./model";

describe("model", () => {
  it("computes pack-years", () => {
    expect(packYears(20, 10)).toBe(10);
    expect(packYears(10, 8)).toBe(4);
  });

  it("clamps sanitize inputs to accepted ranges", () => {
    const sanitized = sanitizeInputs(
      {
        yearsSmoking: 300,
        cigsPerDay: 250,
        quitDateISO: "2099-01-01",
      },
      new Date(2026, 1, 26),
    );

    expect(sanitized.yearsSmoking).toBe(80);
    expect(sanitized.cigsPerDay).toBe(80);
    expect(sanitized.quitDateISO).toBe("2026-02-26");
  });

  it("uses local calendar days and clamps future dates", () => {
    const now = new Date(2026, 1, 26, 23, 50, 0);

    expect(daysSince("2026-02-26", now)).toBe(0);
    expect(daysSince("2026-02-25", now)).toBe(1);
    expect(daysSince("2026-02-27", now)).toBe(0);
  });

  it("returns validation errors for out-of-range and future date", () => {
    const result = validateInputs(
      {
        yearsSmoking: -2,
        cigsPerDay: 90,
        quitDateISO: "2026-03-01",
      },
      new Date(2026, 1, 26),
    );

    expect(result.value).toBeNull();
    expect(result.errors.yearsSmoking).toMatch(/between 0 and 80/i);
    expect(result.errors.cigsPerDay).toMatch(/between 0 and 80/i);
    expect(result.errors.quitDateISO).toMatch(/cannot be in the future/i);
  });

  it("produces monotonic trends for key subscores", () => {
    const inputs: Inputs = {
      yearsSmoking: 18,
      cigsPerDay: 15,
      quitDateISO: "2026-01-01",
    };
    const now = new Date(2026, 1, 26);
    const validated = sanitizeInputs(inputs, now);

    const day0 = computeRecoveryState(validated, 0, now);
    const day30 = computeRecoveryState(validated, 30, now);
    const day365 = computeRecoveryState(validated, 365, now);

    expect(day30.sootLoad).toBeLessThan(day0.sootLoad);
    expect(day365.sootLoad).toBeLessThan(day30.sootLoad);

    expect(day30.inflammation).toBeLessThan(day0.inflammation);
    expect(day365.inflammation).toBeLessThan(day30.inflammation);

    expect(day30.mucus).toBeLessThan(day0.mucus);
    expect(day365.mucus).toBeLessThan(day30.mucus);

    expect(day30.ciliaFunction).toBeGreaterThan(day0.ciliaFunction);
    expect(day365.ciliaFunction).toBeGreaterThan(day30.ciliaFunction);
  });

  it("is deterministic for identical inputs/day", () => {
    const now = new Date(2026, 1, 26);
    const validated = sanitizeInputs(
      {
        yearsSmoking: 9,
        cigsPerDay: 12,
        quitDateISO: "2025-06-10",
      },
      now,
    );

    const a = computeRecoveryState(validated, 90, now);
    const b = computeRecoveryState(validated, 90, now);

    expect(a).toEqual(b);
  });
});