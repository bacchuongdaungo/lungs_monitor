import type { InputErrors, Inputs } from "../model";

type Props = {
  inputs: Inputs;
  errors: InputErrors;
  onChange: (key: keyof Inputs, value: Inputs[keyof Inputs]) => void;
};

export function InputForm({ inputs, errors, onChange }: Props) {
  return (
    <section>
      <h2 className="section-title">Your Smoking History</h2>
      <p className="section-subtitle">Approximate values are enough for a useful visualization.</p>

      <div className="field-grid">
        <label className="field" htmlFor="yearsSmoking">
          <span className="field-label">Years smoked</span>
          <input
            id="yearsSmoking"
            name="yearsSmoking"
            type="number"
            min={0}
            max={80}
            step={0.5}
            value={inputs.yearsSmoking}
            onChange={(event) => {
              const value = event.target.value;
              onChange("yearsSmoking", value === "" ? "" : Number(value));
            }}
          />
          <span className="field-hint">Allowed range: 0 to 80 years.</span>
          {errors.yearsSmoking && (
            <span className="field-error" role="alert">
              {errors.yearsSmoking}
            </span>
          )}
        </label>

        <label className="field" htmlFor="cigsPerDay">
          <span className="field-label">Cigarettes per day</span>
          <input
            id="cigsPerDay"
            name="cigsPerDay"
            type="number"
            min={0}
            max={80}
            step={1}
            value={inputs.cigsPerDay}
            onChange={(event) => {
              const value = event.target.value;
              onChange("cigsPerDay", value === "" ? "" : Number(value));
            }}
          />
          <span className="field-hint">Allowed range: 0 to 80 cigarettes/day.</span>
          {errors.cigsPerDay && (
            <span className="field-error" role="alert">
              {errors.cigsPerDay}
            </span>
          )}
        </label>

        <label className="field" htmlFor="quitDateISO">
          <span className="field-label">Quit date</span>
          <input
            id="quitDateISO"
            name="quitDateISO"
            type="date"
            value={inputs.quitDateISO}
            onChange={(event) => onChange("quitDateISO", event.target.value)}
          />
          <span className="field-hint">The model uses calendar days since this date.</span>
          {errors.quitDateISO && (
            <span className="field-error" role="alert">
              {errors.quitDateISO}
            </span>
          )}
        </label>
      </div>
    </section>
  );
}