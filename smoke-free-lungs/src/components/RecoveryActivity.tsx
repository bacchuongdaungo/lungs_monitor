import { addDaysToISO, todayISO } from "../model";

type Props = {
  quitDateISO: string;
  currentDaysSinceQuit: number;
};

type Stage = {
  id: string;
  startDay: number;
  endDay: number;
  title: string;
  detail: string;
};

const STAGES: Stage[] = [
  {
    id: "co-clearance",
    startDay: 0,
    endDay: 2,
    title: "Gas exchange reset starts",
    detail: "Carbon monoxide washout and oxygen transport begin normalizing in early quit days.",
  },
  {
    id: "airway-reactivity",
    startDay: 3,
    endDay: 21,
    title: "Airway reactivity is recalibrating",
    detail: "Inflamed bronchi can still feel irritable as nicotine withdrawal and airway cleanup overlap.",
  },
  {
    id: "mucociliary-repair",
    startDay: 22,
    endDay: 120,
    title: "Mucociliary clearance improves",
    detail: "Cilia function and mucus handling improve, often reducing cough and chest congestion.",
  },
  {
    id: "deep-remodeling",
    startDay: 121,
    endDay: 365,
    title: "Longer airway remodeling",
    detail: "Inflammation gradually drops while airway tissue continues structural recovery.",
  },
  {
    id: "long-tail",
    startDay: 366,
    endDay: 3650,
    title: "Long-tail stabilization",
    detail: "Recovery continues at a slower pace with sustained smoke-free behavior.",
  },
];

function stageStatus(currentDays: number, stage: Stage): "done" | "active" | "next" {
  if (currentDays > stage.endDay) return "done";
  if (currentDays < stage.startDay) return "next";
  return "active";
}

export function stageForDay(day: number): Stage {
  return STAGES.find((stage) => day >= stage.startDay && day <= stage.endDay) ?? STAGES[STAGES.length - 1];
}

type RecoveryStagePreviewProps = {
  quitDateISO: string;
  selectedDaysSinceQuit: number;
  currentDaysSinceQuit: number;
};

export function RecoveryStagePreview({
  quitDateISO,
  selectedDaysSinceQuit,
  currentDaysSinceQuit,
}: RecoveryStagePreviewProps) {
  const activeStage = stageForDay(selectedDaysSinceQuit);
  const windowStart = addDaysToISO(quitDateISO, activeStage.startDay) ?? quitDateISO;
  const windowEnd = addDaysToISO(quitDateISO, activeStage.endDay) ?? quitDateISO;
  const previewDate = addDaysToISO(quitDateISO, selectedDaysSinceQuit) ?? quitDateISO;
  const projected = selectedDaysSinceQuit > currentDaysSinceQuit;
  const title =
    selectedDaysSinceQuit === currentDaysSinceQuit
      ? "What Your Lungs Are Doing Now"
      : "What Your Lungs Are Doing at This Timeline";

  return (
    <section>
      <h2 className="section-title">{title}</h2>
      <p className="section-subtitle">
        Viewing day <strong>{selectedDaysSinceQuit}</strong> since quit on <strong>{previewDate}</strong>.
        {projected ? " This is a projected stage based on the selected timeline." : " This matches the current smoke-free day."}
      </p>

      <article className={`activity activity--${stageStatus(selectedDaysSinceQuit, activeStage)}`}>
        <header className="activity-head">
          <strong>{activeStage.title}</strong>
          <span>Day {activeStage.startDay}-{activeStage.endDay}</span>
        </header>
        <p>{activeStage.detail}</p>
        <small>{windowStart} to {windowEnd}</small>
      </article>
    </section>
  );
}

export function RecoveryActivity({ quitDateISO, currentDaysSinceQuit }: Props) {
  const timestamp = todayISO();

  return (
    <section>
      <h2 className="section-title">What Your Lungs Are Doing Now</h2>
      <p className="section-subtitle">
        Timestamp: <strong>{timestamp}</strong> (today, day {currentDaysSinceQuit} since quit)
      </p>

      <div className="activity-list">
        {STAGES.map((stage) => {
          const status = stageStatus(currentDaysSinceQuit, stage);
          const windowStart = addDaysToISO(quitDateISO, stage.startDay) ?? quitDateISO;
          const windowEnd = addDaysToISO(quitDateISO, stage.endDay) ?? quitDateISO;

          return (
            <article key={stage.id} className={`activity activity--${status}`}>
              <header className="activity-head">
                <strong>{stage.title}</strong>
                <span>Day {stage.startDay}-{stage.endDay}</span>
              </header>
              <p>{stage.detail}</p>
              <small>{windowStart} to {windowEnd}</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}
