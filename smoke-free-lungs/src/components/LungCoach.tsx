import { useState } from "react";
import { answerLungQuestion, getLungPartById, type LungPartId } from "../lungKnowledge";
import {
  askMedicalLLM,
  type MedicalAdviceCitation,
  type MedicalAdviceSafety,
  type MedicalConversationMessage,
} from "../medicalAssistant";
import type { RecoveryState } from "../model";

type Props = {
  selectedPartId: LungPartId | null;
  state: RecoveryState;
};

const QUICK_QUESTIONS = [
  "Why does this part hurt?",
  "What does this part do?",
  "Why are my lungs still dark?",
  "What is recovering right now?",
];

const MAX_CONVERSATION_MESSAGES = 12;
const URGENT_DEFAULT_MESSAGE =
  "If you have severe chest pain, major trouble breathing, coughing blood, or blue lips/fingertips, seek emergency care now.";

function clampConversation(messages: MedicalConversationMessage[]): MedicalConversationMessage[] {
  return messages.slice(-MAX_CONVERSATION_MESSAGES);
}

export function LungCoach({ selectedPartId, state }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(
    "Ask about pain, function, recovery, or click a lung hotspot first.",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<MedicalConversationMessage[]>([]);
  const [isUsingLLM, setIsUsingLLM] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [safety, setSafety] = useState<MedicalAdviceSafety | null>(null);
  const [citations, setCitations] = useState<MedicalAdviceCitation[]>([]);

  const selectedPart = getLungPartById(selectedPartId);

  async function submitQuestion(prompt: string) {
    const finalPrompt = prompt.trim();
    if (!finalPrompt) {
      setAnswer(answerLungQuestion("", selectedPartId, state));
      setStatusMessage("Enter a question to use AI assistance.");
      setIsUsingLLM(false);
      setSafety(null);
      setCitations([]);
      return;
    }

    setIsLoading(true);
    setStatusMessage("Trying AI medical assistant...");
    setSafety(null);
    setCitations([]);

    const pendingConversation = clampConversation([
      ...conversation,
      {
        role: "user",
        content: finalPrompt,
      },
    ]);

    const remoteAdvice = await askMedicalLLM({
      question: finalPrompt,
      selectedPartId,
      selectedPartLabel: selectedPart?.label ?? null,
      state,
      conversation: pendingConversation,
    });

    const fallback = answerLungQuestion(finalPrompt, selectedPartId, state);
    if (remoteAdvice) {
      setAnswer(remoteAdvice.answer);
      setSafety(remoteAdvice.safety);
      setCitations(remoteAdvice.citations ?? []);
      setIsUsingLLM(true);
      setStatusMessage("AI response received. Educational use only.");
      setConversation(
        clampConversation([
          ...pendingConversation,
          { role: "assistant", content: remoteAdvice.answer },
        ]),
      );
    } else {
      setAnswer(fallback);
      setIsUsingLLM(false);
      setStatusMessage("AI unavailable, using local explanation.");
    }

    setIsLoading(false);
  }

  const urgentMessage =
    safety && (safety.urgency === "urgent" || safety.emergencyMessage)
      ? safety.emergencyMessage ?? URGENT_DEFAULT_MESSAGE
      : null;

  return (
    <section>
      <h2 className="section-title">Ask The Lungs</h2>
      <p className="section-subtitle">
        Click a lung region, then ask anything about pain, function, or recovery.
      </p>

      <div className="coach-selected">
        Selected region: <strong>{selectedPart ? selectedPart.label : "None selected yet"}</strong>
      </div>

      <div className="coach-status" data-testid="coach-status">
        <span className={`coach-pill ${isUsingLLM ? "coach-pill--llm" : "coach-pill--local"}`}>
          {isUsingLLM ? "AI status: online" : "AI status: local fallback"}
        </span>
        {statusMessage ? <span className="coach-status-text">{statusMessage}</span> : null}
      </div>

      <div className="coach-row">
        <input
          type="text"
          aria-label="Ask lungs a question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <button
          type="button"
          className="chip"
          onClick={() => {
            void submitQuestion(question);
          }}
          disabled={isLoading}
        >
          {isLoading ? "Thinking..." : "Ask"}
        </button>
      </div>

      <div className="coach-chips">
        {QUICK_QUESTIONS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="chip"
            onClick={() => {
              setQuestion(prompt);
              void submitQuestion(prompt);
            }}
            disabled={isLoading}
          >
          {prompt}
          </button>
        ))}
      </div>

      {urgentMessage ? (
        <aside className="coach-alert coach-alert--urgent" data-testid="coach-urgent-callout">
          <strong>Urgent guidance:</strong> {urgentMessage}
        </aside>
      ) : null}

      {isUsingLLM && citations.length > 0 ? (
        <section className="coach-citations" data-testid="coach-citations">
          <strong>Sources:</strong>
          <ul>
            {citations.map((citation) => (
              <li key={`${citation.title}-${citation.url}`}>
                <a href={citation.url} target="_blank" rel="noreferrer">
                  {citation.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <article className="coach-answer" data-testid="qa-answer">
        {answer}
      </article>

      <small className="coach-note">
        Medical LLM mode activates when `VITE_MEDICAL_LLM_ENDPOINT` is configured; otherwise local explanations are used.
      </small>
    </section>
  );
}
