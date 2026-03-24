import { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  DEFAULT_BRAND_ID,
  getBrandCatalog,
  getBrandById,
  getCigaretteBrands,
  getVapeBrands,
  loadBrandCatalog,
  type BrandCatalogResult,
} from "./cigBrands";
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
    cigaretteBrandName: getBrandById(DEFAULT_BRAND_ID)?.name ?? "",
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
  const [brandCatalog, setBrandCatalog] = useState(() => getBrandCatalog());
  const [brandCatalogMeta, setBrandCatalogMeta] = useState<{
    status: "loading" | "ready";
    source: BrandCatalogResult["source"];
  }>({
    status: "loading",
    source: "fallback",
  });
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

  const todayKey = todayISO();
  const now = useMemo(() => parseISODateLocal(todayKey) ?? new Date(), [todayKey]);
  const safeInputs = useMemo(() => sanitizeInputs(inputs, now), [inputs, now, brandCatalog]);
  const fullRecoveryDay = useMemo(() => estimateFullRecoveryDay(safeInputs), [safeInputs]);
  const effectivePreviewDays = useMemo(
    () => clampPreview(previewDays, fullRecoveryDay),
    [previewDays, fullRecoveryDay],
  );

  const state = useMemo(
    () => computeRecoveryState(safeInputs, effectivePreviewDays, now, fullRecoveryDay),
    [safeInputs, effectivePreviewDays, now, fullRecoveryDay],
  );
  const cigaretteBrands = useMemo(() => getCigaretteBrands(), [brandCatalog]);
  const vapeBrands = useMemo(() => getVapeBrands(), [brandCatalog]);

  const seedKey = `${safeInputs.smokingStartDateISO}|${safeInputs.quitDateISO}|${safeInputs.cigsPerDay.toFixed(3)}|${safeInputs.cigaretteBrandId}|${safeInputs.cigaretteBrandName}|${safeInputs.dobISO}|${safeInputs.weightKg}|${safeInputs.heightCm}|${safeInputs.biologicalSex}|${safeInputs.vapeBrandName}`;
  const hero = pageCopy(currentPage, safeInputs.recoveryGoal);

  useEffect(() => {
    saveStoredState({
      schemaVersion: 2,
      inputs,
      earnedBadgeIds,
    });
  }, [inputs, earnedBadgeIds]);

  useEffect(() => {
    let cancelled = false;

    void loadBrandCatalog().then((result) => {
      if (cancelled) return;
      setBrandCatalog(result.brands);
      setBrandCatalogMeta({
        status: "ready",
        source: result.source,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

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
    <main className="page-shell">
      <header className="hero">
        <div className="hero__topline">
          <div>
            <p className="eyebrow">{hero.eyebrow}</p>
            <h1>{hero.title}</h1>
            <p>{hero.body}</p>
          </div>

          <aside className="hero-metrics">
            <span className="hero-metric">
              <strong>{state.daysSinceQuit}</strong>
              <span>days smoke-free</span>
            </span>
            <span className="hero-metric">
              <strong>{Math.round(state.recoveryPercent * 100)}%</strong>
              <span>toward target</span>
            </span>
          </aside>
        </div>

        <AppNav currentPage={currentPage} onNavigate={navigate} />
      </header>

      {currentPage === "patient" ? (
        <PatientPage
          inputs={inputs}
          summary={safeInputs}
          onSubmit={handleInputSubmit}
          cigaretteBrands={cigaretteBrands}
          vapeBrands={vapeBrands}
          brandCatalogStatus={brandCatalogMeta.status}
          brandCatalogSource={brandCatalogMeta.source}
        />
      ) : null}

      {currentPage === "home" ? (
        <HomePage
          state={state}
          seedKey={seedKey}
          selectedPartId={selectedPartId}
          onSelectPart={setSelectedPartId}
          vizMode={vizMode}
          onVizModeChange={setVizMode}
        />
      ) : null}

      {currentPage === "progress" ? (
        <ProgressPage
          state={state}
          summary={safeInputs}
          earnedBadgeIds={earnedBadgeIds}
          onPreviewDaysChange={setPreviewDays}
        />
      ) : null}
    </main>
  );
}
