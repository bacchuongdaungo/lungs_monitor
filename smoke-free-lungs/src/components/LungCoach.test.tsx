import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MedicalQuestionPayload } from "../medicalAssistant";
import {
  computeRecoveryState,
  estimateFullRecoveryDay,
  sanitizeInputs,
  type Inputs,
  type RecoveryState,
} from "../model";
import { LungCoach } from "./LungCoach";

const askMedicalLLMMock = vi.fn<(payload: MedicalQuestionPayload) => Promise<unknown>>();

vi.mock("../medicalAssistant", () => ({
  askMedicalLLM: (payload: MedicalQuestionPayload) => askMedicalLLMMock(payload),
}));

function buildState(): RecoveryState {
  const now = new Date(2026, 1, 26);
  const inputs: Inputs = {
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
    vapeBrandName: "",
    recoveryGoal: "Reach one full smoke-free year",
  };

  const validated = sanitizeInputs(inputs, now);
  const fullRecoveryDay = estimateFullRecoveryDay(validated);
  return computeRecoveryState(validated, 21, now, fullRecoveryDay);
}

describe("LungCoach", () => {
  afterEach(() => {
    askMedicalLLMMock.mockReset();
  });

  it("renders LLM answer with urgency callout and citations", async () => {
    askMedicalLLMMock.mockResolvedValue({
      answer: "Educational AI explanation.",
      safety: {
        urgency: "urgent",
        emergencyMessage: "Seek urgent care if breathing worsens.",
      },
      citations: [
        { title: "CDC", url: "https://www.cdc.gov/tobacco/" },
      ],
    });

    render(<LungCoach selectedPartId="bronchi" state={buildState()} />);

    fireEvent.change(screen.getByLabelText(/ask lungs a question/i), {
      target: { value: "Why does this part hurt?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^ask$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("qa-answer")).toHaveTextContent("Educational AI explanation.");
    });

    expect(screen.getByText(/AI status: online/i)).toBeInTheDocument();
    expect(screen.getByTestId("coach-urgent-callout")).toHaveTextContent("Seek urgent care if breathing worsens.");
    expect(screen.getByTestId("coach-citations")).toHaveTextContent("CDC");
  });

  it("falls back to local explanation when LLM is unavailable", async () => {
    askMedicalLLMMock.mockResolvedValue(null);

    render(<LungCoach selectedPartId="bronchi" state={buildState()} />);

    fireEvent.change(screen.getByLabelText(/ask lungs a question/i), {
      target: { value: "What does this part do?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^ask$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("qa-answer").textContent?.toLowerCase()).toContain("cilia function proxy");
    });

    expect(screen.getByText(/AI status: local fallback/i)).toBeInTheDocument();
    expect(screen.getByText(/AI unavailable, using local explanation/i)).toBeInTheDocument();
    expect(screen.queryByTestId("coach-citations")).not.toBeInTheDocument();
  });

  it("sends rolling session memory between consecutive questions", async () => {
    askMedicalLLMMock
      .mockResolvedValueOnce({
        answer: "First AI answer",
        safety: { urgency: "routine" },
      })
      .mockResolvedValueOnce({
        answer: "Second AI answer",
        safety: { urgency: "routine" },
      });

    render(<LungCoach selectedPartId="bronchi" state={buildState()} />);

    fireEvent.change(screen.getByLabelText(/ask lungs a question/i), {
      target: { value: "First question?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^ask$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("qa-answer")).toHaveTextContent("First AI answer");
    });

    fireEvent.change(screen.getByLabelText(/ask lungs a question/i), {
      target: { value: "Second question?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^ask$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("qa-answer")).toHaveTextContent("Second AI answer");
    });

    expect(askMedicalLLMMock).toHaveBeenCalledTimes(2);
    const secondPayload = askMedicalLLMMock.mock.calls[1]?.[0] as MedicalQuestionPayload;
    expect(secondPayload.conversation).toEqual([
      { role: "user", content: "First question?" },
      { role: "assistant", content: "First AI answer" },
      { role: "user", content: "Second question?" },
    ]);
  });

  it("resets memory on component remount (no persistence)", async () => {
    askMedicalLLMMock.mockResolvedValue({
      answer: "AI answer",
      safety: { urgency: "routine" },
    });

    const { unmount } = render(<LungCoach selectedPartId="bronchi" state={buildState()} />);

    fireEvent.change(screen.getByLabelText(/ask lungs a question/i), {
      target: { value: "First session question?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^ask$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("qa-answer")).toHaveTextContent("AI answer");
    });

    unmount();
    askMedicalLLMMock.mockClear();
    askMedicalLLMMock.mockResolvedValue({
      answer: "Fresh session answer",
      safety: { urgency: "routine" },
    });

    render(<LungCoach selectedPartId="bronchi" state={buildState()} />);
    fireEvent.change(screen.getByLabelText(/ask lungs a question/i), {
      target: { value: "New session question?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^ask$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("qa-answer")).toHaveTextContent("Fresh session answer");
    });

    const payload = askMedicalLLMMock.mock.calls[0]?.[0] as MedicalQuestionPayload;
    expect(payload.conversation).toEqual([
      { role: "user", content: "New session question?" },
    ]);
  });
});
