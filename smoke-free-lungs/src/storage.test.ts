import { beforeEach, describe, expect, it } from "vitest";
import { inferDOBFromAgeYears } from "./model";
import { loadStoredState, saveStoredState } from "./storage";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("migrates legacy v1 inputs to v2 shape", () => {
    localStorage.setItem(
      "sfl_inputs_v1",
      JSON.stringify({ yearsSmoking: 7, cigsPerDay: 10, quitDateISO: "2026-02-10" }),
    );

    const loaded = loadStoredState();
    expect(loaded).toEqual({
      schemaVersion: 2,
      inputs: {
        smokingLengthMode: "exact_dates",
        smokingStartDateISO: "2019-02-10",
        approxSmokingYears: 7,
        quitDateISO: "2026-02-10",
        consumptionUnit: "cigarettes",
        consumptionQuantity: 10,
        consumptionIntervalUnit: "days",
        consumptionIntervalCount: 1,
        cigaretteBrandId: "average-us-king",
        dobISO: inferDOBFromAgeYears(35),
        biologicalSex: "other",
        weightValue: 70,
        weightUnit: "kg",
        heightValue: 170,
        heightUnit: "cm",
      },
      earnedBadgeIds: [],
    });
  });

  it("saves and reloads v2 state", () => {
    saveStoredState({
      schemaVersion: 2,
      inputs: {
        smokingLengthMode: "exact_dates",
        smokingStartDateISO: "2014-01-01",
        approxSmokingYears: "",
        quitDateISO: "2026-02-01",
        consumptionUnit: "packs",
        consumptionQuantity: 4,
        consumptionIntervalUnit: "weeks",
        consumptionIntervalCount: 1,
        cigaretteBrandId: "marlboro-red",
        dobISO: "1984-02-01",
        biologicalSex: "male",
        weightValue: 83,
        weightUnit: "kg",
        heightValue: 180,
        heightUnit: "cm",
      },
      earnedBadgeIds: ["day-1", "day-3"],
    });

    const loaded = loadStoredState();
    expect(loaded?.schemaVersion).toBe(2);
    expect(loaded?.earnedBadgeIds).toEqual(["day-1", "day-3"]);
    expect(loaded?.inputs.biologicalSex).toBe("male");
    expect(loaded?.inputs.cigaretteBrandId).toBe("marlboro-red");
    expect(loaded?.inputs.consumptionUnit).toBe("packs");
  });
});
