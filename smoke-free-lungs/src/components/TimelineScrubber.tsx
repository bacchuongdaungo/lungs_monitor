import { useEffect, useState, type FocusEvent, type KeyboardEvent } from "react";
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

function toIntegerOrEmpty(value: string): number | "" {
  if (value === "") return "";
  const sanitized = value.replace(/^0+(?=\d)/, "");
  const num = Number(sanitized);
  return Number.isFinite(num) ? Math.round(num) : "";
}

function sanitizeInputDisplay(value: string): string {
  if (value === "") return "";

  const num = Number(value);
  if (!Number.isFinite(num)) return value;

  return Math.round(num).toString();
}

export function TimelineScrubber({ previewDays, actualDays, maxDays, quitDateISO, onChange }: Props) {
  const [previewInput, setPreviewInput] = useState(() => previewDays.toString());

  useEffect(() => {
    setPreviewInput(previewDays.toString());
  }, [previewDays]);

  const previewDateISO = addDaysToISO(quitDateISO, previewDays) ?? quitDateISO;
  const projected = previewDays > actualDays;

  function commitPreviewInput(rawValue: string) {
    const parsed = toIntegerOrEmpty(rawValue);

    if (parsed === "") {
      setPreviewInput("");
      return;
    }

    const clamped = clampPreview(parsed, maxDays);
    const normalized = clamped.toString();
    setPreviewInput(normalized);
    onChange(clamped);
  }

  function finalizePreviewInput(rawValue: string) {
    const sanitized = sanitizeInputDisplay(rawValue);
    if (sanitized === "") {
      setPreviewInput(previewDays.toString());
      return;
    }

    commitPreviewInput(sanitized);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    finalizePreviewInput(event.currentTarget.value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === ".") {
      event.preventDefault();
      return;
    }

    if (event.key === "Enter") {
      finalizePreviewInput(event.currentTarget.value);
      event.currentTarget.blur();
    }
  }

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    const parsed = Number(event.currentTarget.value);
    if (event.currentTarget.value !== "" && Number.isFinite(parsed) && parsed === 0) {
      event.currentTarget.select();
    }
  }

  return (
    <section>
      <h2 className="section-title">Recovery Timeline</h2>

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

      <div className="timeline-controls">
        <label className="field timeline-field" htmlFor="previewDaysInput">
          <span className="field-label">Go to day number</span>
          <input
            id="previewDaysInput"
            type="number"
            min={0}
            max={maxDays}
            step={1}
            value={previewInput}
            onChange={(event) => commitPreviewInput(event.currentTarget.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </label>

        <div className="timeline-row" aria-label="Timeline quick jumps">
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
