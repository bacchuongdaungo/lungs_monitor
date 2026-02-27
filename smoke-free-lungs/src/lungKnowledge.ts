// src/lungKnowledge.ts
import type { RecoveryState } from "./model";

export type LungPartId =
  | "trachea"
  | "bronchi"
  | "alveoli"
  | "left-lung"
  | "right-lung"
  | "pleura";

export type LungPart = {
  id: LungPartId;
  label: string;
  functionText: string;
  discomfortText: string;
  whySmokersFeelIt: string;
};

export const LUNG_PARTS: LungPart[] = [
  {
    id: "trachea",
    label: "Trachea",
    functionText: "Main airway tube that moves air from mouth/nose to bronchi.",
    discomfortText: "Irritation here can feel like burning, throat tightness, or dry cough.",
    whySmokersFeelIt: "Smoke particulates and hot gases irritate the lining and trigger inflammation.",
  },
  {
    id: "bronchi",
    label: "Bronchi",
    functionText: "Large airway branches that distribute air into each lung.",
    discomfortText: "Inflamed bronchi can feel like chest pressure, wheeze, or painful cough.",
    whySmokersFeelIt: "Tar and toxins increase mucus and bronchial wall swelling.",
  },
  {
    id: "alveoli",
    label: "Alveoli",
    functionText: "Tiny air sacs where oxygen enters blood and carbon dioxide leaves.",
    discomfortText: "Damage can feel like shortness of breath and reduced exercise tolerance.",
    whySmokersFeelIt: "Smoke exposure reduces gas-exchange efficiency and can inflame surrounding tissue.",
  },
  {
    id: "left-lung",
    label: "Left lung tissue",
    functionText: "Expands and recoils to move air; contains bronchi, bronchioles, and alveoli.",
    discomfortText: "Localized pain can come from airway irritation or pleural inflammation.",
    whySmokersFeelIt: "Inflammation and mucus burden can make breathing feel uneven.",
  },
  {
    id: "right-lung",
    label: "Right lung tissue",
    functionText: "Same respiratory role as left lung with three lobes and large air volume.",
    discomfortText: "Can feel heavy or tight when mucus burden and inflammation are elevated.",
    whySmokersFeelIt: "Tobacco smoke raises oxidative stress and airway reactivity.",
  },
  {
    id: "pleura",
    label: "Pleura",
    functionText: "Thin membrane around lungs that lets them glide during breathing.",
    discomfortText: "Pleural irritation often causes sharp pain on deep breath or cough.",
    whySmokersFeelIt: "Inflammatory conditions can sensitize pleural tissue and chest wall.",
  },
];

export function getLungPartById(id: LungPartId | null): LungPart | null {
  if (!id) return null;
  return LUNG_PARTS.find((part) => part.id === id) ?? null;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function answerLungQuestion(
  question: string,
  selectedPartId: LungPartId | null,
  state: RecoveryState,
): string {
  const prompt = question.trim().toLowerCase();
  const selected = getLungPartById(selectedPartId);

  if (!prompt && selected) {
    return `${selected.label}: ${selected.functionText} ${selected.discomfortText}`;
  }

  if (!prompt) {
    return "Ask about pain, function, recovery, breathing, or click a lung hotspot first.";
  }

  const painIntent = /hurt|pain|ache|sore|tight/.test(prompt);
  const functionIntent = /what does|function|do|for|role/.test(prompt);
  const darkIntent = /dark|black|dirty|soot|tar/.test(prompt);
  const progressIntent = /recover|healing|improv|better|timeline/.test(prompt);

  if (painIntent && selected) {
    return `${selected.label}: ${selected.discomfortText} ${selected.whySmokersFeelIt} ` +
      `Current inflammation proxy is ${formatPercent(state.inflammation)}.`;
  }

  if (functionIntent && selected) {
    return `${selected.label}: ${selected.functionText} Current cilia function proxy is ${formatPercent(
      state.ciliaFunction,
    )}.`;
  }

  if (darkIntent) {
    return `Dark areas represent soot/tar burden in this model. Current soot load is ${formatPercent(
      state.sootLoad,
    )}; as smoke-free days increase, this layer fades.`;
  }

  if (progressIntent) {
    return `Today your model recovery is ${formatPercent(state.recoveryPercent)} of the way to full recovery, with ` +
      `mucus at ${formatPercent(state.mucus)} and inflammation at ${formatPercent(state.inflammation)}.`;
  }

  if (selected) {
    return `${selected.label}: ${selected.functionText} ${selected.discomfortText}`;
  }

  return "Try clicking a lung hotspot, then ask: 'Why does this part hurt?' or 'What does this part do?'";
}