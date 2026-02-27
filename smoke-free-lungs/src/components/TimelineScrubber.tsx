import { addDaysToISO, MAX_PREVIEW_DAYS } from "../model";

type Props = {
  previewDays: number;
  actualDays: number;
  quitDateISO: string;
  onChange: (next: number) => void;
};

const QUICK_JUMPS = [30, 90, 180, 365, 730];

function clampPreview(value: number): number {
  return Math.max(0, Math.min(MAX_PREVIEW_DAYS, Math.round(value)));
}

export function TimelineScrubber({ previewDays, actualDays, quitDateISO, onChange }: Props) {
  const previewDateISO = addDaysToISO(quitDateISO, previewDays) ?? quitDateISO;
  const projected = previewDays > actualDays;

  return (
    <section>
      <h2 className="section-title">Recovery Timeline</h2>
      <p className="section-subtitle">
        Scrub through day 0 to day {MAX_PREVIEW_DAYS} to preview how lungs may clear over time.
      </p>

      <label className="timeline-range" htmlFor="previewDays">
        <span>Viewing day {previewDays} since quit</span>
        <input
          id="previewDays"
          aria-label="Recovery timeline preview"
          type="range"
          min={0}
          max={MAX_PREVIEW_DAYS}
          step={1}
          value={previewDays}
          onChange={(event) => onChange(clampPreview(Number(event.target.value)))}
        />
      </label>

      <div className="timeline-row">
        <button type="button" className="chip" onClick={() => onChange(clampPreview(actualDays))}>
          Today
        </button>
        {QUICK_JUMPS.map((days) => (
          <button
            key={days}
            type="button"
            className="chip"
            onClick={() => onChange(clampPreview(actualDays + days))}
          >
            +{days}d
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
    </section>
  );
}