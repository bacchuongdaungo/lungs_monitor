import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { askMedicalLLM, type MedicalQuestionPayload } from "./medicalAssistant";
import {
  computeRecoveryState,
  estimateFullRecoveryDay,
  sanitizeInputs,
  type Inputs,
  type RecoveryState,
} from "./model";

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
  return computeRecoveryState(validated, 15, now, fullRecoveryDay);
}

function buildPayload(overrides?: Partial<MedicalQuestionPayload>): MedicalQuestionPayload {
  return {
    question: "What is recovering now?",
    selectedPartId: "bronchi",
    selectedPartLabel: "Bronchi",
    state: buildState(),
    conversation: [
      { role: "user", content: "Why does this part hurt?" },
      { role: "assistant", content: "It may be inflamed while cilia recover." },
    ],
    ...overrides,
  };
}

describe("medicalAssistant", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_MEDICAL_LLM_ENDPOINT", "https://example.test/medical");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("sends context, policy, and conversation in request body", async () => {
    vi.stubEnv("VITE_MEDICAL_LLM_BEARER_TOKEN", "token-123");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          answer: "Educational answer",
          safety: { urgency: "routine" },
          citations: [{ title: "CDC", url: "https://www.cdc.gov" }],
          meta: { model: "gpt-medical", requestId: "req-1" },
        }),
        { status: 200 },
      ),
    );

    const result = await askMedicalLLM(buildPayload());
    expect(result).toEqual({
      answer: "Educational answer",
      safety: { urgency: "routine" },
      citations: [{ title: "CDC", url: "https://www.cdc.gov" }],
      meta: { model: "gpt-medical", requestId: "req-1" },
    });

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://example.test/medical");

    const request = init as RequestInit;
    expect(request.method).toBe("POST");
    expect(request.headers).toEqual(
      expect.objectContaining({
        "Content-Type": "application/json",
        Authorization: "Bearer token-123",
      }),
    );

    const body = JSON.parse(String(request.body)) as Record<string, unknown>;
    expect(body.policy).toEqual({
      mode: "educational_only",
      noDiagnosis: true,
      noPrescriptions: true,
    });
    expect(body.conversation).toEqual([
      { role: "user", content: "Why does this part hurt?" },
      { role: "assistant", content: "It may be inflamed while cilia recover." },
    ]);
    expect(body.context).toEqual(
      expect.objectContaining({
        daysSinceQuit: expect.any(Number),
        smokingYears: expect.any(Number),
        inflammation: expect.any(Number),
      }),
    );
  });

  it("returns null when response is malformed", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          safety: { urgency: "routine" },
        }),
        { status: 200 },
      ),
    );

    const result = await askMedicalLLM(buildPayload());
    expect(result).toBeNull();
  });

  it("returns null on auth failure or network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("unauthorized", { status: 401 }));
    expect(await askMedicalLLM(buildPayload())).toBeNull();

    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network down"));
    expect(await askMedicalLLM(buildPayload())).toBeNull();
  });

  it("returns null when request times out", async () => {
    vi.useFakeTimers();

    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
      const signal = (init as RequestInit).signal as AbortSignal;
      return new Promise<Response>((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });

    const pending = askMedicalLLM(buildPayload());
    await vi.advanceTimersByTimeAsync(10_100);

    await expect(pending).resolves.toBeNull();
  });
});
