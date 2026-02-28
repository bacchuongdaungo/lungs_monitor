import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
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

    const qtyInput = screen.getByRole("spinbutton", { name: /quantity/i });
    await user.clear(qtyInput);

    expect(await screen.findByText(/enter smoking quantity/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /lung recovery visualization/i })).toBeInTheDocument();
  });

  it("supports timeline day input and recovery-date quick jump", async () => {
    render(<App />);

    const dayInput = screen.getByLabelText(/go to day number/i);
    fireEvent.change(dayInput, { target: { value: "45" } });
    expect(dayInput).toHaveValue(45);

    const recoveryJump = screen.getByRole("button", { name: /\+recovery date/i });
    fireEvent.click(recoveryJump);

    await waitFor(() => {
      expect(screen.getByLabelText(/go to day number/i)).toHaveValue(
        Number((screen.getByLabelText(/go to day number/i) as HTMLInputElement).max),
      );
    });
  });

  it("unlocks badges at exact day thresholds and persists earned ids", async () => {
    render(<App />);

    const quitDateInput = screen.getByLabelText(/end date \(quit\)/i);
    fireEvent.change(quitDateInput, { target: { value: isoDaysAgo(3) } });
    fireEvent.click(screen.getByRole("button", { name: /submit smoking history/i }));

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

  it("answers a question for selected lung hotspot", async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId("hotspot-bronchi"));

    const questionInput = screen.getByLabelText(/ask lungs a question/i);
    fireEvent.change(questionInput, { target: { value: "What does this part do?" } });
    fireEvent.click(screen.getByRole("button", { name: /^ask$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("qa-answer").textContent?.toLowerCase()).toContain("cilia function proxy");
    });
  });

  it("keeps anatomy button selection in sync between 2D and 3D", async () => {
    const { container } = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /^bronchi$/i }));
    const bronchiHotspot = screen.getByTestId("hotspot-bronchi");
    expect(bronchiHotspot).toHaveAttribute("fill-opacity", "0.2");

    fireEvent.click(screen.getByRole("button", { name: /^3d$/i }));

    await waitFor(() => {
      expect(container.querySelector(".lungs3d-selection")?.textContent).toContain("Bronchi");
    });
  });

  it("keeps recovery activity tied to current day since quit", async () => {
    render(<App />);

    const quitDateInput = screen.getByLabelText(/end date \(quit\)/i);
    fireEvent.change(quitDateInput, { target: { value: isoDaysAgo(12) } });
    fireEvent.click(screen.getByRole("button", { name: /submit smoking history/i }));

    await waitFor(() => {
      expect(screen.getByText(/today, day 12 since quit/i)).toBeInTheDocument();
    });
  });
});
