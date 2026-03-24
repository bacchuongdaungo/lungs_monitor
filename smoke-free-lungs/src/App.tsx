import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { DEFAULT_BRAND_ID } from "./cigBrands";
import { AppNav, type AppPageId } from "./components/AppNav";
import { getEarnedBadgeIds, mergeEarnedBadgeIds } from "./milestones";
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
} from "./model";
import { HomePage } from "./pages/HomePage";
import { PatientPage } from "./pages/PatientPage";
import { ProgressPage } from "./pages/ProgressPage";
import { loadStoredState, saveStoredState } from "./storage";

const DEFAULT_RECOVERY_GOAL = "Reach one full smoke-free year";

function clampPreview(value: number, maxDays: number): number {
  return Math.max(0, Math.min(maxDays, Math.round(value)));
}

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
    vapeBrandName: "",
    recoveryGoal: DEFAULT_RECOVERY_GOAL,
  };
}

function normalizePage(value: string | null): AppPageId {
  if (value === "patient" || value === "progress") return value;
  return "home";
}

function pageFromHash(hash: string): AppPageId {
  const raw = hash.replace(/^#\/?/, "");
  return normalizePage(raw || "home");
}

function pageCopy(page: AppPageId, goal: string) {
  if (page === "patient") {
    return {
      eyebrow: "Patient Profile",
      title: "Keep the medical record clean, editable, and separate from the visual dashboard",
      body: "Use this page to maintain the smoking history, quit date, body profile, cigarette brand, vape brand, and recovery goal.",
    };
  }

  if (page === "progress") {
    return {
      eyebrow: "Progress Tracking",
      title: "Follow day-by-day recovery without burying it under the anatomy views",
      body: `Track the smoke-free streak, projected recovery curve, milestone badges, and goal progress. Current goal: ${goal}.`,
    };
  }
  // if (page === "home") {
    return {
      eyebrow: "Smoke-Free Lungs",
      title: "Visualize lung recovery and ask targeted questions about symptoms, function, and healing",
      body: "The home page keeps the lung artwork and medical assistant together, while the rest of the record and progress tracking live on separate pages.",
    };
  
}

export default function App() {
  const [initialState] = useState(() => loadStoredState());
  const [initialInputs] = useState<Inputs>(() => initialState?.inputs ?? defaultInputs());
  const [inputs, setInputs] = useState<Inputs>(() => initialInputs);
  const [selectedPartId, setSelectedPartId] = useState<LungPartId | null>(null);
  const [vizMode, setVizMode] = useState<"2d" | "3d">("2d");
  const [currentPage, setCurrentPage] = useState<AppPageId>(() =>
    typeof window === "undefined" ? "home" : pageFromHash(window.location.hash),
  );
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const todayKey = todayISO();
  const now = useMemo(() => parseISODateLocal(todayKey) ?? new Date(), [todayKey]);
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

  const seedKey = `${safeInputs.smokingStartDateISO}|${safeInputs.quitDateISO}|${safeInputs.cigsPerDay.toFixed(3)}|${safeInputs.cigaretteBrandId}|${safeInputs.dobISO}|${safeInputs.weightKg}|${safeInputs.heightCm}|${safeInputs.biologicalSex}|${safeInputs.vapeBrandName}`;
  const hero = pageCopy(currentPage, safeInputs.recoveryGoal);
  const dashboardStats = [
    {
      label: "Smoke-free",
      value: `${state.daysSinceQuit}d`,
      detail: safeInputs.quitDateISO,
    },
    {
      label: "Recovery",
      value: `${Math.round(state.recoveryPercent * 100)}%`,
      detail: `${state.previewDays}/${state.maxPreviewDays} tracked days`,
    },
    {
      label: "Previous rate",
      value: `${state.cigsPerDay.toFixed(1)}`,
      detail: "cigarettes/day",
    },
    {
      label: "Goal",
      value: safeInputs.recoveryGoal,
      detail: safeInputs.cigaretteBrandName,
    },
  ] as const;

  useEffect(() => {
    saveStoredState({
      schemaVersion: 2,
      inputs,
      earnedBadgeIds,
    });
  }, [inputs, earnedBadgeIds]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onHashChange = () => {
      setCurrentPage(pageFromHash(window.location.hash));
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function navigate(nextPage: AppPageId) {
    if (typeof window !== "undefined") {
      window.location.hash = nextPage;
    }
    setCurrentPage(nextPage);
  }

  function handleInputSubmit(nextInputs: Inputs) {
    setInputs(nextInputs);
    const currentDaysSinceQuit = daysSince(nextInputs.quitDateISO);
    setPreviewDays(currentDaysSinceQuit);
    setEarnedBadgeIds((persisted) =>
      mergeEarnedBadgeIds(persisted, getEarnedBadgeIds(currentDaysSinceQuit)),
    );
  }

  return (
    <main
      className={`dashboard-shell ${isSidebarOpen ? "dashboard-shell--sidebar-open" : "dashboard-shell--sidebar-collapsed"}`}
    >
      <aside className={`dashboard-sidebar ${isSidebarOpen ? "" : "dashboard-sidebar--collapsed"}`}>
        <button
          type="button"
          className="dashboard-sidebar__toggle"
          onClick={() => setIsSidebarOpen((current) => !current)}
          aria-expanded={isSidebarOpen}
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <span aria-hidden="true">{isSidebarOpen ? "←" : "→"}</span>
        </button>

        {isSidebarOpen ? (
          <div className="dashboard-sidebar__content">
            {/* <div className="dashboard-brand">
              <p className="dashboard-brand__eyebrow">Smoke-Free Lungs</p>
              <h1>Recovery Dashboard</h1>
              <p>
                Keep the visualization, patient record, and recovery tracking in one operational view.
              </p>
            </div> */}

            <section className="dashboard-sidebar__panel">
              <span className="dashboard-sidebar__label">Workspace</span>
              <AppNav currentPage={currentPage} onNavigate={navigate} />
            </section>

            <section className="dashboard-sidebar__panel dashboard-sidebar__panel--stats">
              <span className="dashboard-sidebar__label">Live snapshot</span>
              <div className="dashboard-sidebar__stats">
                <article className="dashboard-sidebar__stat">
                  <span>Days smoke-free</span>
                  <strong>{state.daysSinceQuit}</strong>
                  <small>Since {safeInputs.quitDateISO}</small>
                </article>
                <article className="dashboard-sidebar__stat">
                  <span>Projected recovery</span>
                  <strong>{Math.round(state.recoveryPercent * 100)}%</strong>
                  <small>{state.maxPreviewDays} day horizon</small>
                </article>
                <article className="dashboard-sidebar__stat">
                  <span>Current goal</span>
                  <strong>{safeInputs.recoveryGoal}</strong>
                  <small>{safeInputs.cigaretteBrandName}</small>
                </article>
              </div>
            </section>
          </div>
        ) : (
          <div className="dashboard-sidebar__collapsed-badge" aria-hidden="true">
            SFL
          </div>
        )}
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">{hero.eyebrow}</p>
            <h1>{hero.title}</h1>
            <p>{hero.body}</p>
          </div>

          <div className="dashboard-header__meta">
            <span className="dashboard-meta-pill">
              <strong>{safeInputs.quitDateISO}</strong>
              Quit date
            </span>
            <span className="dashboard-meta-pill">
              <strong>{safeInputs.cigaretteBrandName}</strong>
              Cigarette brand
            </span>
            <span className="dashboard-meta-pill">
              <strong>{safeInputs.vapeBrandName || "None"}</strong>
              Vape brand
            </span>
          </div>
        </header>

        <section className="dashboard-strip" aria-label="Key metrics">
          {dashboardStats.map((stat) => (
            <article key={stat.label} className="dashboard-strip__card">
              <span className="dashboard-strip__label">{stat.label}</span>
              <strong className="dashboard-strip__value">{stat.value}</strong>
              <small className="dashboard-strip__detail">{stat.detail}</small>
            </article>
          ))}
        </section>

        {currentPage === "patient" ? (
          <PatientPage inputs={inputs} summary={safeInputs} onSubmit={handleInputSubmit} />
        ) : null}

        {currentPage === "home" ? (
          <HomePage
            state={state}
            seedKey={seedKey}
            selectedPartId={selectedPartId}
            onSelectPart={setSelectedPartId}
            vizMode={vizMode}
            onVizModeChange={setVizMode}
            onPreviewDaysChange={setPreviewDays}
            quitDateISO={safeInputs.quitDateISO}
          />
        ) : null}

        {currentPage === "progress" ? (
          <ProgressPage
            state={state}
            summary={safeInputs}
            earnedBadgeIds={earnedBadgeIds}
          />
        ) : null}
      </section>
    </main>
  );
}
