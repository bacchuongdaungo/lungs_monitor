// src/medicalAssistant.ts
import type { LungPartId } from "./lungKnowledge";
import type { RecoveryState } from "./model";

export type MedicalConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type MedicalQuestionPayload = {
  question: string;
  selectedPartId: LungPartId | null;
  selectedPartLabel: string | null;
  state: RecoveryState;
  conversation: MedicalConversationMessage[];
};

export type MedicalAdviceSafety = {
  urgency: "routine" | "urgent";
  emergencyMessage?: string;
  refused?: boolean;
  refusalReason?: string;
};

export type MedicalAdviceCitation = {
  title: string;
  url: string;
};

export type MedicalAdviceResponse = {
  answer: string;
  safety: MedicalAdviceSafety;
  citations?: MedicalAdviceCitation[];
  meta?: {
    model?: string;
    requestId?: string;
  };
};

const MEDICAL_LLM_TIMEOUT_MS = 10_000;
const MAX_CONVERSATION_MESSAGES = 12;

function buildContext(state: RecoveryState) {
  return {
    daysSinceQuit: state.daysSinceQuit,
    previewDays: state.previewDays,
    smokingYears: state.smokingYears,
    recoveryPercent: state.recoveryPercent,
    inflammation: state.inflammation,
    mucus: state.mucus,
    sootLoad: state.sootLoad,
    dopamineTolerance: state.dopamineTolerance,
    nicotineDependence: state.nicotineDependence,
    tarBurden: state.tarBurden,
    ciliaFunction: state.ciliaFunction,
  };
}

function buildConversation(messages: MedicalConversationMessage[]): MedicalConversationMessage[] {
  return messages
    .filter((item) => item.role === "user" || item.role === "assistant")
    .map((item) => ({
      role: item.role,
      content: item.content.trim(),
    }))
    .filter((item) => item.content.length > 0)
    .slice(-MAX_CONVERSATION_MESSAGES);
}

function normalizeCitations(value: unknown): MedicalAdviceCitation[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const citations = value
    .map((item): MedicalAdviceCitation | null => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const title = typeof record.title === "string" ? record.title.trim() : "";
      const url = typeof record.url === "string" ? record.url.trim() : "";
      if (!title || !url) return null;
      return { title, url };
    })
    .filter((item): item is MedicalAdviceCitation => item != null);

  return citations.length > 0 ? citations : undefined;
}

function normalizeMeta(value: unknown): MedicalAdviceResponse["meta"] {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const model = typeof record.model === "string" ? record.model.trim() : undefined;
  const requestId = typeof record.requestId === "string" ? record.requestId.trim() : undefined;

  if (!model && !requestId) return undefined;
  return { ...(model ? { model } : {}), ...(requestId ? { requestId } : {}) };
}

function normalizeSafety(value: unknown): MedicalAdviceSafety | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const urgency = record.urgency;
  if (urgency !== "routine" && urgency !== "urgent") return null;

  const emergencyMessage =
    typeof record.emergencyMessage === "string" && record.emergencyMessage.trim().length > 0
      ? record.emergencyMessage.trim()
      : undefined;

  const refusalReason =
    typeof record.refusalReason === "string" && record.refusalReason.trim().length > 0
      ? record.refusalReason.trim()
      : undefined;

  const refused = typeof record.refused === "boolean" ? record.refused : undefined;

  return {
    urgency,
    ...(emergencyMessage ? { emergencyMessage } : {}),
    ...(typeof refused === "boolean" ? { refused } : {}),
    ...(refusalReason ? { refusalReason } : {}),
  };
}

function normalizeMedicalAdviceResponse(value: unknown): MedicalAdviceResponse | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  const answer = typeof record.answer === "string" ? record.answer.trim() : "";
  if (!answer) return null;

  const safety = normalizeSafety(record.safety);
  if (!safety) return null;

  const citations = normalizeCitations(record.citations);
  const meta = normalizeMeta(record.meta);

  return {
    answer,
    safety,
    ...(citations ? { citations } : {}),
    ...(meta ? { meta } : {}),
  };
}

export async function askMedicalLLM(payload: MedicalQuestionPayload): Promise<MedicalAdviceResponse | null> {
  const endpoint = import.meta.env.VITE_MEDICAL_LLM_ENDPOINT as string | undefined;
  if (!endpoint) return null;

  const token = import.meta.env.VITE_MEDICAL_LLM_BEARER_TOKEN as string | undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MEDICAL_LLM_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: controller.signal,
      body: JSON.stringify({
        question: payload.question.trim(),
        selectedPartId: payload.selectedPartId,
        selectedPartLabel: payload.selectedPartLabel,
        context: buildContext(payload.state),
        conversation: buildConversation(payload.conversation),
        policy: {
          mode: "educational_only",
          noDiagnosis: true,
          noPrescriptions: true,
        },
      }),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as unknown;
    return normalizeMedicalAdviceResponse(data);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
