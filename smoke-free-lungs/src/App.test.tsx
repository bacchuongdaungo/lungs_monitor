import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { DEFAULT_BRAND_ID } from "./cigBrands";
import { daysSince, type Inputs } from "./model";

function formatISODateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isoDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return formatISODateLocal(date);
}

function defaultStoredInputs(quitDateISO: string): Inputs {
  const now = new Date();
  const smokingStart = new Date(now);
  smokingStart.setFullYear(smokingStart.getFullYear() - 8);

  const dob = new Date(now);
  dob.setFullYear(dob.getFullYear() - 35);

  return {
    smokingLengthMode: "exact_dates",
    smokingStartDateISO: formatISODateLocal(smokingStart),
    approxSmokingYears: 8,
    quitDateISO,
    consumptionUnit: "cigarettes",
    consumptionQuantity: 10,
    consumptionIntervalUnit: "days",
    consumptionIntervalCount: 1,
    cigaretteBrandId: DEFAULT_BRAND_ID,
    cigaretteBrandName: "Average US king-size (reference)",
    dobISO: formatISODateLocal(dob),
    biologicalSex: "other",
    weightValue: 70,
    weightUnit: "kg",
    heightValue: 170,
    heightUnit: "cm",
    vapeBrandName: "CalmMint",
    recoveryGoal: "Reach one full smoke-free year",
  };
}

function seedStoredState(quitDateISO: string) {
  localStorage.setItem(
    "sfl_state_v2",
    JSON.stringify({
      schemaVersion: 2,
      inputs: defaultStoredInputs(quitDateISO),
      earnedBadgeIds: [],
    }),
  );
}

function seedStoredGoal(goal: string) {
  const inputs = defaultStoredInputs(formatISODateLocal(new Date()));
  localStorage.setItem(
    "sfl_state_v2",
    JSON.stringify({
      schemaVersion: 2,
      inputs: {
        ...inputs,
        recoveryGoal: goal,
      },
      earnedBadgeIds: [],
    }),
  );
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = "";
  });

  it("defaults to the home page and keeps the visualization available", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /visualize lung recovery/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /lung recovery visualization/i })).toBeInTheDocument();
    expect(screen.getByText(/ask the lungs/i)).toBeInTheDocument();
  });

  it("lets the dashboard sidebar collapse and expand", async () => {
    render(<App />);

    const toggle = screen.getByRole("button", { name: /collapse sidebar/i });

    await userEvent.click(toggle);
    expect(screen.queryByText(/recovery dashboard/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /expand sidebar/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /expand sidebar/i }));
    expect(screen.getByText(/recovery dashboard/i)).toBeInTheDocument();
  });

  it("navigates to patient page and shows record fields for cigarette, vape, and goal", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /patient record/i }));

    expect(screen.getByRole("heading", { name: /patient record/i })).toBeInTheDocument();
    expect(screen.getByText(/medical profile and habits/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /update smoking history/i }));

    expect(screen.getByLabelText(/^cigarette brand$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^vape brand$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^recovery goal$/i)).toBeInTheDocument();
  });

  it("filters the cigarette catalog as the user types", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /patient record/i }));
    await userEvent.click(screen.getByRole("button", { name: /update smoking history/i }));

    await userEvent.clear(screen.getByLabelText(/search cigarette catalog/i));
    await userEvent.type(screen.getByLabelText(/search cigarette catalog/i), "marl");

    expect(screen.getByRole("option", { name: /marlboro red/i })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /camel filters/i })).not.toBeInTheDocument();
  });

  it("shows the stored recovery goal on the progress page", () => {
    seedStoredGoal("Reach 90 smoke-free days");
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /progress/i }));

    expect(screen.getAllByText(/reach 90 smoke-free days/i).length).toBeGreaterThan(0);
  });

  it("shows current smoke-free time on the progress page", async () => {
    const targetQuitDate = isoDaysAgo(12);
    const expectedDaysSinceQuit = daysSince(targetQuitDate);
    seedStoredState(targetQuitDate);
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /progress/i }));

    await waitFor(() => {
      expect(screen.getAllByText(new RegExp(`${expectedDaysSinceQuit} days`, "i")).length).toBeGreaterThan(0);
    });
  });

  it("answers a question for a selected lung hotspot on the home page", async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId("hotspot-bronchi"));
    fireEvent.change(screen.getByLabelText(/ask lungs a question/i), {
      target: { value: "What does this part do?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^ask$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("qa-answer").textContent?.toLowerCase()).toContain("cilia function proxy");
    });
  });
});
