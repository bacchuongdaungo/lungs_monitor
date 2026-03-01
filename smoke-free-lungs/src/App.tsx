import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { DEFAULT_BRAND_ID } from "./cigBrands";
import { LungViz } from "./LungViz";
import { BadgeStrip } from "./components/BadgeStrip";
import { BreathingDemo } from "./components/BreathingDemo";
import { InputForm } from "./components/InputForm";
import { LungCoach } from "./components/LungCoach";
import { MethodPanel } from "./components/MethodPanel";
import { RecoveryActivity } from "./components/RecoveryActivity";
import { StatsCards } from "./components/StatsCards";
import { TimelineScrubber } from "./components/TimelineScrubber";
import { LungsScene } from "./features/lungs";
import { getEarnedBadgeIds, mergeEarnedBadgeIds, MILESTONE_BADGES } from "./milestones";
import type { LungPartId } from "./lungKnowledge";
import {
  computeRecoveryState,
  daysSince,
  estimateFullRecoveryDay,
  formatISODateLocal,
  inferDOBFromAgeYears,
  type Inputs,
  parseISODateLocal,
  sanitizeInputs,
  todayISO,
  validateInputs,
} from "./model";
import { loadStoredState, saveStoredState } from "./storage";

const clampPreview = (value: number, maxDays: number) => Math.max(0, Math.min(maxDays, Math.round(value)));

const VIZ_PART_BUTTONS: readonly { id: LungPartId; label: string }[] = [
  { id: "trachea", label: "Trachea" },
  { id: "bronchi", label: "Bronchi" },
  { id: "left-upper-lobe", label: "Left Upper" },
  { id: "left-lower-lobe", label: "Left Lower" },
  { id: "right-upper-lobe", label: "Right Upper" },
  { id: "right-middle-lobe", label: "Right Middle" },
  { id: "right-lower-lobe", label: "Right Lower" },
] as const;

function defaultSmokingStartISO(now = new Date()): string {
  const start = new Date(now);
  start.setFullYear(start.getFullYear() - 8);
  return formatISODateLocal(start);
}

function defaultInputs(now = new Date()): Inputs {
  return {
    smokingLengthMode: "exact_dates",
    smokingStartDateISO: defaultSmokingStartISO(now),
    approxSmokingYears: 8,
    quitDateISO: todayISO(now),
    consumptionUnit: "cigarettes",
    consumptionQuantity: 10,
    consumptionIntervalUnit: "days",
    consumptionIntervalCount: 1,
    cigaretteBrandId: DEFAULT_BRAND_ID,
    dobISO: inferDOBFromAgeYears(35, now),
    biologicalSex: "other",
    weightValue: 70,
    weightUnit: "kg",
    heightValue: 170,
    heightUnit: "cm",
  };
}

export default function App() {
  const [initialState] = useState(() => loadStoredState());
  const [initialInputs] = useState<Inputs>(() => initialState?.inputs ?? defaultInputs());
  const [inputs, setInputs] = useState<Inputs>(() => initialInputs);
  const [selectedPartId, setSelectedPartId] = useState<LungPartId | null>(null);
  const [vizMode, setVizMode] = useState<"2d" | "3d">("2d");
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>(() => {
    const sourceInputs = initialState?.inputs ?? defaultInputs();
    const persisted = initialState?.earnedBadgeIds ?? [];
    const unlockedFromStreak = getEarnedBadgeIds(daysSince(sourceInputs.quitDateISO));
    return mergeEarnedBadgeIds(persisted, unlockedFromStreak);
  });
  const [previewDays, setPreviewDays] = useState<number>(() => {
    const sourceInputs = initialState?.inputs ?? defaultInputs();
    return Math.max(0, daysSince(sourceInputs.quitDateISO));
  });

  const todayKey = todayISO();
  const now = useMemo(() => parseISODateLocal(todayKey) ?? new Date(), [todayKey]);

  const validation = useMemo(() => validateInputs(inputs, now), [inputs, now]);
  const safeInputs = useMemo(() => sanitizeInputs(inputs, now), [inputs, now]);
  const fullRecoveryDay = useMemo(() => estimateFullRecoveryDay(safeInputs), [safeInputs]);

  const effectivePreviewDays = useMemo(
    () => clampPreview(previewDays, fullRecoveryDay),
    [previewDays, fullRecoveryDay],
  );

  const state = useMemo(
    () => computeRecoveryState(safeInputs, effectivePreviewDays, now, fullRecoveryDay),
    [safeInputs, effectivePreviewDays, now, fullRecoveryDay],
  );

  useEffect(() => {
    saveStoredState({
      schemaVersion: 2,
      inputs,
      earnedBadgeIds,
    });
  }, [inputs, earnedBadgeIds]);

  const seedKey = `${safeInputs.smokingStartDateISO}|${safeInputs.quitDateISO}|${safeInputs.cigsPerDay.toFixed(3)}|${safeInputs.cigaretteBrandId}|${safeInputs.dobISO}|${safeInputs.weightKg}|${safeInputs.heightCm}|${safeInputs.biologicalSex}`;

  function handleInputChange(key: keyof Inputs, value: Inputs[keyof Inputs]) {
    setInputs((current) => ({
      ...current,
      [key]: value,
    }));

    if (key === "quitDateISO" && typeof value === "string") {
      const currentDaysSinceQuit = daysSince(value);
      setPreviewDays(currentDaysSinceQuit);
      setEarnedBadgeIds((persisted) =>
        mergeEarnedBadgeIds(persisted, getEarnedBadgeIds(currentDaysSinceQuit)),
      );
    }
  }

  return (
    <main className="page-shell">
      <header className="hero">
        <p className="eyebrow">Smoke-Free Lungs</p>
        <h1>Cartoon lungs that clear as smoke-free days stack up</h1>
        <p>
          Enter your smoking pattern and body metrics. The model estimates recovery
          trends and keeps art deterministic for your profile.
        </p>
      </header>

      <section className="layout-grid">
        <article className="card card--intake">
          <InputForm
            inputs={inputs}
            errors={validation.errors}
            summary={safeInputs}
            onChange={handleInputChange}
          />
        </article>

        <article className="card card--viz">
          <section className="viz-shell">
            <div className="viz-head">
              <h2 className="section-title">Lung Visualization</h2>
              <div className="viz-mode-toggle">
                <button
                  type="button"
                  className={`chip ${vizMode === "2d" ? "chip--primary" : ""}`}
                  onClick={() => setVizMode("2d")}
                >
                  2D
                </button>
                <button
                  type="button"
                  className={`chip ${vizMode === "3d" ? "chip--primary" : ""}`}
                  onClick={() => setVizMode("3d")}
                >
                  3D
                </button>
              </div>
            </div>
            <p className="section-subtitle">
              Pick a lung component from buttons or directly on the model.
            </p>

            <div className="viz-part-buttons">
              {VIZ_PART_BUTTONS.map((part) => (
                <button
                  key={part.id}
                  type="button"
                  className={`chip ${selectedPartId === part.id ? "chip--primary" : ""}`}
                  onClick={() => setSelectedPartId(part.id)}
                >
                  {part.label}
                </button>
              ))}
              <button
                type="button"
                className="chip"
                onClick={() => setSelectedPartId(null)}
              >
                Clear
              </button>
            </div>

            {vizMode === "2d" ? (
              <LungViz
                state={state}
                seedKey={seedKey}
                selectedPartId={selectedPartId}
                onSelectPart={setSelectedPartId}
              />
            ) : (
              <LungsScene
                selectedPartId={selectedPartId}
                onSelectPart={setSelectedPartId}
              />
            )}
          </section>
        </article>

        <article className="card card--coach">
          <LungCoach selectedPartId={selectedPartId} state={state} />
        </article>

        <article className="card card--timeline">
          <TimelineScrubber
            previewDays={state.previewDays}
            actualDays={state.daysSinceQuit}
            maxDays={state.maxPreviewDays}
            quitDateISO={safeInputs.quitDateISO}
            onChange={setPreviewDays}
          />
        </article>

        <article className="card card--activity">
          <RecoveryActivity quitDateISO={safeInputs.quitDateISO} currentDaysSinceQuit={state.daysSinceQuit} />
        </article>

        <article className="card card--stats">
          <StatsCards state={state} />
        </article>

        <article className="card card--breathing">
          <BreathingDemo state={state} />
        </article>

        <article className="card card--badges">
          <BadgeStrip badges={MILESTONE_BADGES} earnedBadgeIds={earnedBadgeIds} currentDays={state.daysSinceQuit} />
        </article>

        <article className="card card--method">
          <MethodPanel />
        </article>
      </section>
    </main>
  );
}
