// src/medicalAssistant.ts
import type { LungPartId } from "./lungKnowledge";
import type { RecoveryState } from "./model";

export type MedicalQuestionPayload = {
  question: string;
  selectedPartId: LungPartId | null;
  selectedPartLabel: string | null;
  state: RecoveryState;
};

type MedicalResponse = {
  answer?: string;
};

export async function askMedicalLLM(payload: MedicalQuestionPayload): Promise<string | null> {
  const endpoint = import.meta.env.VITE_MEDICAL_LLM_ENDPOINT as string | undefined;
  if (!endpoint) return null;

  try {
    const token = import.meta.env.VITE_MEDICAL_LLM_BEARER_TOKEN as string | undefined;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        question: payload.question,
        selectedPartId: payload.selectedPartId,
        selectedPartLabel: payload.selectedPartLabel,
        context: {
          daysSinceQuit: payload.state.daysSinceQuit,
          previewDays: payload.state.previewDays,
          smokingYears: payload.state.smokingYears,
          recoveryPercent: payload.state.recoveryPercent,
          inflammation: payload.state.inflammation,
          mucus: payload.state.mucus,
          sootLoad: payload.state.sootLoad,
          dopamineTolerance: payload.state.dopamineTolerance,
          nicotineDependence: payload.state.nicotineDependence,
          tarBurden: payload.state.tarBurden,
          ciliaFunction: payload.state.ciliaFunction,
          disclaimer: "Educational app; avoid diagnosis and treatment claims.",
        },
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as MedicalResponse;
    const answer = typeof data.answer === "string" ? data.answer.trim() : "";
    return answer.length > 0 ? answer : null;
  } catch {
    return null;
  }
}