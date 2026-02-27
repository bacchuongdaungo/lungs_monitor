import { describe, expect, it, beforeEach } from "vitest";
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
        yearsSmoking: 7,
        cigsPerDay: 10,
        quitDateISO: "2026-02-10",
      },
      earnedBadgeIds: [],
    });
  });

  it("saves and reloads v2 state", () => {
    saveStoredState({
      schemaVersion: 2,
      inputs: {
        yearsSmoking: 5,
        cigsPerDay: 8,
        quitDateISO: "2026-02-01",
      },
      earnedBadgeIds: ["day-1", "day-3"],
    });

    const loaded = loadStoredState();
    expect(loaded?.schemaVersion).toBe(2);
    expect(loaded?.earnedBadgeIds).toEqual(["day-1", "day-3"]);
  });
});