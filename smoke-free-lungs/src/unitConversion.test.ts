import { describe, expect, it } from "vitest";
import { estimateCigsPerDay } from "./model";
import {
  convertConsumptionQuantityForInterval,
  convertConsumptionQuantityForUnit,
  convertHeight,
  convertWeight,
  feetInchesToTotalInches,
  inchesToFeetInches,
} from "./unitConversion";

describe("unitConversion", () => {
  it("converts weight between kg and lbs", () => {
    expect(convertWeight(70, "kg", "lb")).toBeCloseTo(154.32, 2);
    expect(convertWeight(154.323583, "lb", "kg")).toBeCloseTo(70, 3);
  });

  it("converts height between cm and inches", () => {
    expect(convertHeight(170, "cm", "in")).toBeCloseTo(66.93, 2);
    expect(convertHeight(66.929134, "in", "cm")).toBeCloseTo(170, 2);
  });

  it("converts inches to feet/inches and back", () => {
    const split = inchesToFeetInches(67);
    expect(split).toEqual({ feet: 5, inches: 7 });
    expect(feetInchesToTotalInches(split.feet, split.inches)).toBe(67);
  });

  it("preserves cigs/day when switching cigarettes to packs", () => {
    const quantityInPacks = convertConsumptionQuantityForUnit(12, "cigarettes", "packs");
    const originalRate = estimateCigsPerDay("cigarettes", 12, "days", 1);
    const convertedRate = estimateCigsPerDay("packs", quantityInPacks, "days", 1);

    expect(convertedRate).toBeCloseTo(originalRate as number, 6);
  });

  it("preserves cigs/day when switching days to weeks", () => {
    const weeklyQuantity = convertConsumptionQuantityForInterval(10, "days", "weeks");
    const originalRate = estimateCigsPerDay("cigarettes", 10, "days", 1);
    const convertedRate = estimateCigsPerDay("cigarettes", weeklyQuantity, "weeks", 1);

    expect(convertedRate).toBeCloseTo(originalRate as number, 6);
  });
});
