import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach } from "vitest";
import App from "./App";

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

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows validation error without breaking visualization", async () => {
    const user = userEvent.setup();
    render(<App />);

    const yearsInput = screen.getByLabelText(/years smoked/i);
    await user.clear(yearsInput);

    expect(await screen.findByText(/enter years smoked/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /lung recovery visualization/i })).toBeInTheDocument();
  });

  it("updates projected state when the timeline slider moves ahead", () => {
    render(<App />);

    const timeline = screen.getByLabelText(/recovery timeline preview/i);
    fireEvent.change(timeline, { target: { value: "30" } });

    expect(screen.getByText(/projected view/i)).toBeInTheDocument();
  });

  it("unlocks badges at exact day thresholds and persists earned ids", async () => {
    render(<App />);

    const quitDateInput = screen.getByLabelText(/quit date/i);
    fireEvent.change(quitDateInput, { target: { value: isoDaysAgo(3) } });

    await waitFor(() => {
      expect(screen.getByTestId("badge-day-3")).toHaveAttribute("data-unlocked", "true");
    });

    expect(screen.getByTestId("badge-day-14")).toHaveAttribute("data-unlocked", "false");

    await waitFor(() => {
      const savedRaw = localStorage.getItem("sfl_state_v2");
      expect(savedRaw).not.toBeNull();
      const saved = JSON.parse(savedRaw as string) as { earnedBadgeIds: string[] };
      expect(saved.earnedBadgeIds).toContain("day-3");
    });
  });
});