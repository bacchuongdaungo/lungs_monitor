import { useState } from "react";
import { answerLungQuestion, getLungPartById, type LungPartId } from "../lungKnowledge";
import { askMedicalLLM } from "../medicalAssistant";
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

export function LungCoach({ selectedPartId, state }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(
    "Ask about pain, function, recovery, or click a lung hotspot first.",
  );
  const [isLoading, setIsLoading] = useState(false);

  const selectedPart = getLungPartById(selectedPartId);

  async function submitQuestion(prompt: string) {
    const finalPrompt = prompt.trim();
    if (!finalPrompt) {
      setAnswer(answerLungQuestion("", selectedPartId, state));
      return;
    }

    setIsLoading(true);

    const remoteAnswer = await askMedicalLLM({
      question: finalPrompt,
      selectedPartId,
      selectedPartLabel: selectedPart?.label ?? null,
      state,
    });

    const fallback = answerLungQuestion(finalPrompt, selectedPartId, state);
    setAnswer(remoteAnswer ?? fallback);
    setIsLoading(false);
  }

  return (
    <section>
      <h2 className="section-title">Ask The Lungs</h2>
      <p className="section-subtitle">
        Click a lung region, then ask anything about pain, function, or recovery.
      </p>

      <div className="coach-selected">
        Selected region: <strong>{selectedPart ? selectedPart.label : "None selected yet"}</strong>
      </div>

      <div className="coach-row">
        <input
          type="text"
          aria-label="Ask lungs a question"
          value={question}
          placeholder="e.g., Why does this part hurt?"
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

      <article className="coach-answer" data-testid="qa-answer">
        {answer}
      </article>

      <small className="coach-note">
        Medical LLM mode activates when `VITE_MEDICAL_LLM_ENDPOINT` is configured; otherwise local explanations are used.
      </small>
    </section>
  );
}