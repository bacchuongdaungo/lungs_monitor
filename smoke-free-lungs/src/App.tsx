import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { LungViz } from "./LungViz";
import { BadgeStrip } from "./components/BadgeStrip";
import { InputForm } from "./components/InputForm";
import { MethodPanel } from "./components/MethodPanel";
import { StatsCards } from "./components/StatsCards";
import { TimelineScrubber } from "./components/TimelineScrubber";
import { getEarnedBadgeIds, mergeEarnedBadgeIds, MILESTONE_BADGES } from "./milestones";
import {
  computeRecoveryState,
  daysSince,
  type Inputs,
  MAX_PREVIEW_DAYS,
  parseISODateLocal,
  sanitizeInputs,
  todayISO,
  validateInputs,
} from "./model";
import { loadStoredState, saveStoredState } from "./storage";

const clampPreview = (value: number) => Math.max(0, Math.min(MAX_PREVIEW_DAYS, Math.round(value)));

function defaultInputs(now = new Date()): Inputs {
  return {
    yearsSmoking: 5,
    cigsPerDay: 10,
    quitDateISO: todayISO(now),
  };
}

export default function App() {
  const [initialState] = useState(() => loadStoredState());
  const [inputs, setInputs] = useState<Inputs>(() => initialState?.inputs ?? defaultInputs());
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>(() => {
    const sourceInputs = initialState?.inputs ?? defaultInputs();
    const persisted = initialState?.earnedBadgeIds ?? [];
    const unlockedFromStreak = getEarnedBadgeIds(daysSince(sourceInputs.quitDateISO));
    return mergeEarnedBadgeIds(persisted, unlockedFromStreak);
  });
  const [previewDays, setPreviewDays] = useState<number>(() => {
    const sourceInputs = initialState?.inputs ?? defaultInputs();
    return clampPreview(daysSince(sourceInputs.quitDateISO));
  });

  const todayKey = todayISO();
  const now = useMemo(() => parseISODateLocal(todayKey) ?? new Date(), [todayKey]);

  const validation = useMemo(() => validateInputs(inputs, now), [inputs, now]);
  const safeInputs = useMemo(() => sanitizeInputs(inputs, now), [inputs, now]);
  const state = useMemo(
    () => computeRecoveryState(safeInputs, previewDays, now),
    [safeInputs, previewDays, now],
  );

  useEffect(() => {
    saveStoredState({
      schemaVersion: 2,
      inputs,
      earnedBadgeIds,
    });
  }, [inputs, earnedBadgeIds]);

  const seedKey = `${safeInputs.yearsSmoking}|${safeInputs.cigsPerDay}|${safeInputs.quitDateISO}`;

  function handleInputChange(key: keyof Inputs, value: Inputs[keyof Inputs]) {
    const nowForUpdate = new Date();

    setInputs((current) => {
      const next = {
        ...current,
        [key]: value,
      };

      const safeNext = sanitizeInputs(next, nowForUpdate);
      const unlocked = getEarnedBadgeIds(daysSince(safeNext.quitDateISO, nowForUpdate));
      setEarnedBadgeIds((persisted) => mergeEarnedBadgeIds(persisted, unlocked));

      return next;
    });
  }

  return (
    <main className="page-shell">
      <header className="hero">
        <p className="eyebrow">Smoke-Free Lungs</p>
        <h1>Cartoon lungs that clear as smoke-free days stack up</h1>
        <p>
          Enter your smoking history once. The model estimates recovery trends over time and keeps the
          art deterministic for your profile.
        </p>
      </header>

      <section className="layout-grid">
        <article className="card card--intake">
          <InputForm inputs={inputs} errors={validation.errors} onChange={handleInputChange} />
        </article>

        <article className="card card--viz">
          <LungViz state={state} seedKey={seedKey} />
        </article>

        <article className="card card--timeline">
          <TimelineScrubber
            previewDays={state.previewDays}
            actualDays={state.daysSinceQuit}
            quitDateISO={safeInputs.quitDateISO}
            onChange={setPreviewDays}
          />
        </article>

        <article className="card card--stats">
          <StatsCards state={state} />
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
