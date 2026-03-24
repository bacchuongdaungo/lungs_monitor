import { Suspense, lazy } from "react";
import { LungViz } from "../LungViz";
import { BreathingDemo } from "../components/BreathingDemo";
import { LungCoach } from "../components/LungCoach";
import { TimelineScrubber } from "../components/TimelineScrubber";
import type { LungPartId } from "../lungKnowledge";
import type { RecoveryState } from "../model";

const LungsScene = lazy(async () => {
  const mod = await import("../features/lungs/LungsScene");
  return { default: mod.LungsScene };
});

type Props = {
  state: RecoveryState;
  seedKey: string;
  selectedPartId: LungPartId | null;
  onSelectPart: (partId: LungPartId | null) => void;
  vizMode: "2d" | "3d";
  onVizModeChange: (mode: "2d" | "3d") => void;
  onPreviewDaysChange: (next: number) => void;
  quitDateISO: string;
};

const VIZ_PART_BUTTONS: readonly { id: LungPartId; label: string }[] = [
  { id: "trachea", label: "Trachea" },
  { id: "bronchi", label: "Bronchi" },
  { id: "left-upper-lobe", label: "Left Upper" },
  { id: "left-lower-lobe", label: "Left Lower" },
  { id: "right-upper-lobe", label: "Right Upper" },
  { id: "right-middle-lobe", label: "Right Middle" },
  { id: "right-lower-lobe", label: "Right Lower" },
] as const;

export function HomePage({
  state,
  seedKey,
  selectedPartId,
  onSelectPart,
  vizMode,
  onVizModeChange,
  onPreviewDaysChange,
  quitDateISO,
}: Props) {
  return (
    <section className="page-panel">
      <div className="page-grid page-grid--home">
        <article className="card card--viz card--span-7">
          <section className="viz-shell">
            <div className="viz-head">
              <div>
                <h2 className="section-title">Lung Visualization</h2>
                <p className="section-subtitle">
                  Switch between the animated 2D recovery view and the 3D anatomy explorer.
                </p>
              </div>

              <div className="viz-mode-toggle">
                <button
                  type="button"
                  className={`chip ${vizMode === "2d" ? "chip--primary" : ""}`}
                  onClick={() => onVizModeChange("2d")}
                >
                  2D
                </button>
                <button
                  type="button"
                  className={`chip ${vizMode === "3d" ? "chip--primary" : ""}`}
                  onClick={() => onVizModeChange("3d")}
                >
                  3D
                </button>
              </div>
            </div>

            <div className="viz-part-buttons">
              {VIZ_PART_BUTTONS.map((part) => (
                <button
                  key={part.id}
                  type="button"
                  className={`chip ${selectedPartId === part.id ? "chip--primary" : ""}`}
                  onClick={() => onSelectPart(part.id)}
                >
                  {part.label}
                </button>
              ))}
              <button type="button" className="chip" onClick={() => onSelectPart(null)}>
                Clear
              </button>
            </div>

            {vizMode === "2d" ? (
              <LungViz
                state={state}
                seedKey={seedKey}
                selectedPartId={selectedPartId}
                onSelectPart={onSelectPart}
              />
            ) : (
              <Suspense
                fallback={
                  <div className="lungs3d-fallback lungs3d-fallback--loading">
                    Loading the 3D lung model...
                  </div>
                }
              >
                <LungsScene
                  state={state}
                  selectedPartId={selectedPartId}
                  onSelectPart={onSelectPart}
                />
              </Suspense>
            )}

            <TimelineScrubber
              previewDays={state.previewDays}
              actualDays={state.daysSinceQuit}
              maxDays={state.maxPreviewDays}
              quitDateISO={quitDateISO}
              onChange={onPreviewDaysChange}
            />
          </section>
        </article>

        <article className="card card--coach">
          <LungCoach selectedPartId={selectedPartId} state={state} />
        </article>

        <article className="card card--span-12">
          <BreathingDemo state={state} />
        </article>
      </div>
    </section>
  );
}
