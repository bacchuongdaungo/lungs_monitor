import { addDaysToISO } from "../model";

type Props = {
  previewDays: number;
  actualDays: number;
  maxDays: number;
  quitDateISO: string;
  onChange: (next: number) => void;
};

const QUICK_JUMPS: Array<{ id: string; label: string; deltaDays: number | "recovery" }> = [
  { id: "today", label: "Today", deltaDays: 0 },
  { id: "plus-30", label: "+30d", deltaDays: 30 },
  { id: "plus-6m", label: "+6m", deltaDays: 182 },
  { id: "plus-1y", label: "+1y", deltaDays: 365 },
  { id: "recovery-date", label: "+Recovery date", deltaDays: "recovery" },
];

function clampPreview(value: number, maxDays: number): number {
  return Math.max(0, Math.min(maxDays, Math.round(value)));
}

export function TimelineScrubber({ previewDays, actualDays, maxDays, quitDateISO, onChange }: Props) {
  const previewDateISO = addDaysToISO(quitDateISO, previewDays) ?? quitDateISO;
  const projected = previewDays > actualDays;

  return (
    <section>
      <h2 className="section-title">Recovery Timeline</h2>
      <p className="section-subtitle">
        Projection is capped at your model's full-recovery day ({maxDays}) where recovery reaches 100%.
      </p>

      <label className="timeline-range" htmlFor="previewDays">
        <span>Viewing day {previewDays} since quit</span>
        <input
          id="previewDays"
          aria-label="Recovery timeline preview"
          type="range"
          min={0}
          max={maxDays}
          step={1}
          value={previewDays}
          onChange={(event) => onChange(clampPreview(Number(event.target.value), maxDays))}
        />
      </label>

      <label className="field" htmlFor="previewDaysInput">
        <span className="field-label">Go to day number</span>
        <input
          id="previewDaysInput"
          type="number"
          min={0}
          max={maxDays}
          step={1}
          value={previewDays}
          onChange={(event) => onChange(clampPreview(Number(event.target.value), maxDays))}
        />
      </label>

      <div className="timeline-row">
        {QUICK_JUMPS.map((jump) => (
          <button
            key={jump.id}
            type="button"
            className="chip"
            onClick={() => {
              if (jump.deltaDays === "recovery") {
                onChange(maxDays);
                return;
              }

              if (jump.deltaDays === 0) {
                onChange(clampPreview(actualDays, maxDays));
                return;
              }

              onChange(clampPreview(actualDays + jump.deltaDays, maxDays));
            }}
          >
            {jump.label}
          </button>
        ))}
      </div>

      <div className="timeline-meta">
        <span>Preview date: {previewDateISO}</span>
        {projected ? (
          <span className="pill projected">Projected view</span>
        ) : (
          <span className="pill current">Current day</span>
        )}
      </div>
      <div className="timeline-meta timeline-meta--secondary">
        <span>Full recovery target: day {maxDays}</span>
      </div>
    </section>
  );
}