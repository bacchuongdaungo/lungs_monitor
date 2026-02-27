import type { ReactNode } from "react";
import {
  ageYearsFromDOBISO,
  estimateCigsPerDay,
  MAX_CONSUMPTION_INTERVAL_COUNT,
  MAX_CONSUMPTION_QUANTITY,
  MAX_HEIGHT_CM,
  MAX_SMOKING_YEARS,
  MAX_WEIGHT_KG,
  MIN_CONSUMPTION_INTERVAL_COUNT,
  MIN_HEIGHT_CM,
  MIN_WEIGHT_KG,
  smokingYearsByDates,
  type BiologicalSex,
  type ConsumptionIntervalUnit,
  type ConsumptionUnit,
  type HeightUnit,
  type InputErrors,
  type Inputs,
  type ValidatedInputs,
  type WeightUnit,
} from "../model";
import {
  convertConsumptionQuantityForInterval,
  convertConsumptionQuantityForUnit,
  convertHeight,
  convertNumberishInput,
  convertWeight,
  feetInchesToTotalInches,
  inchesToFeetInches,
} from "../unitConversion";

type Props = {
  inputs: Inputs;
  errors: InputErrors;
  summary: ValidatedInputs;
  isEditing: boolean;
  canSubmit: boolean;
  onChange: (key: keyof Inputs, value: Inputs[keyof Inputs]) => void;
  onSubmit: () => void;
  onEdit: () => void;
  onCancel: () => void;
};

const SEX_OPTIONS: Array<{ id: BiologicalSex; label: string }> = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "other", label: "Other" },
];

function ToggleIcon({ children }: { children: ReactNode }) {
  return <span className="toggle-icon">{children}</span>;
}

function ToggleButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`icon-toggle ${active ? "icon-toggle--active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
    >
      <ToggleIcon>{icon}</ToggleIcon>
    </button>
  );
}

function yearsText(startISO: string, quitISO: string): string {
  const years = smokingYearsByDates(startISO, quitISO);
  return `${years.toFixed(1)} years`;
}

function formatDurationFromYears(years: number): string {
  const totalDays = Math.max(0, Math.round(years * 365.25));
  if (totalDays < 30) {
    return `${totalDays} day${totalDays === 1 ? "" : "s"}`;
  }

  if (totalDays < 365) {
    const months = Math.max(1, Math.round(totalDays / 30.44));
    return `${months} month${months === 1 ? "" : "s"}`;
  }

  const wholeYears = Math.floor(totalDays / 365.25);
  const wholeYearDays = Math.round(wholeYears * 365.25);
  const remainingDays = Math.max(0, totalDays - wholeYearDays);
  const remainingMonths = Math.round(remainingDays / 30.44);

  if (remainingMonths <= 0) {
    return `${wholeYears} year${wholeYears === 1 ? "" : "s"}`;
  }

  return `${wholeYears} year${wholeYears === 1 ? "" : "s"} ${remainingMonths} month${remainingMonths === 1 ? "" : "s"}`;
}

function weightRangeText(unit: WeightUnit): string {
  if (unit === "kg") return `${MIN_WEIGHT_KG}-${MAX_WEIGHT_KG} kg`;
  return `${(MIN_WEIGHT_KG * 2.20462262).toFixed(0)}-${(MAX_WEIGHT_KG * 2.20462262).toFixed(0)} lb`;
}

function heightRangeText(unit: HeightUnit): string {
  if (unit === "cm") return `${MIN_HEIGHT_CM}-${MAX_HEIGHT_CM} cm`;
  return `${(MIN_HEIGHT_CM / 2.54).toFixed(0)}-${(MAX_HEIGHT_CM / 2.54).toFixed(0)} in total`;
}

function formatHeightValue(value: number, unit: HeightUnit): string {
  if (unit === "cm") return `${value} cm`;
  const wholeInches = Math.max(0, Math.round(value));
  const feet = Math.floor(wholeInches / 12);
  const inches = wholeInches % 12;
  return `${feet} ft ${inches} in`;
}

export function InputForm({
  inputs,
  errors,
  summary,
  isEditing,
  canSubmit,
  onChange,
  onSubmit,
  onEdit,
  onCancel,
}: Props) {
  const quantity = Number(inputs.consumptionQuantity);
  const intervalCount = Number(inputs.consumptionIntervalCount);

  const estimatedCigsPerDay = estimateCigsPerDay(
    inputs.consumptionUnit,
    quantity,
    inputs.consumptionIntervalUnit,
    intervalCount,
  );

  const ageYears = ageYearsFromDOBISO(inputs.dobISO);

  function handleConsumptionUnitChange(nextUnit: ConsumptionUnit) {
    if (nextUnit === inputs.consumptionUnit) return;

    const converted = convertNumberishInput(
      inputs.consumptionQuantity,
      (value) => convertConsumptionQuantityForUnit(value, inputs.consumptionUnit, nextUnit),
      2,
    );

    onChange("consumptionUnit", nextUnit);
    onChange("consumptionQuantity", converted);
  }

  function handleConsumptionIntervalUnitChange(nextUnit: ConsumptionIntervalUnit) {
    if (nextUnit === inputs.consumptionIntervalUnit) return;

    const converted = convertNumberishInput(
      inputs.consumptionQuantity,
      (value) => convertConsumptionQuantityForInterval(value, inputs.consumptionIntervalUnit, nextUnit),
      2,
    );

    onChange("consumptionIntervalUnit", nextUnit);
    onChange("consumptionQuantity", converted);
  }

  function handleWeightUnitChange(nextUnit: WeightUnit) {
    if (nextUnit === inputs.weightUnit) return;

    const converted = convertNumberishInput(
      inputs.weightValue,
      (value) => convertWeight(value, inputs.weightUnit, nextUnit),
      1,
    );

    onChange("weightUnit", nextUnit);
    onChange("weightValue", converted);
  }

  function handleHeightUnitChange(nextUnit: HeightUnit) {
    if (nextUnit === inputs.heightUnit) return;

    const converted = convertNumberishInput(
      inputs.heightValue,
      (value) => convertHeight(value, inputs.heightUnit, nextUnit),
      nextUnit === "cm" ? 1 : 0,
    );

    onChange("heightUnit", nextUnit);
    onChange("heightValue", converted);
  }

  if (!isEditing) {
    return (
      <section>
        <div className="intake-summary-head">
          <h2 className="section-title">Smoking History</h2>
          <button type="button" className="chip" onClick={onEdit}>
            Edit Information
          </button>
        </div>

        <div className="summary-block">
          <h3 className="method-heading">Smoking length</h3>
          <div className="summary-grid">
            {/* <div>Mode</div> */}
            {/* <div>Start / End</div>
            <strong>{summary.smokingStartDateISO} to {summary.quitDateISO}</strong> */}
            <div>Total duration:</div>
            <strong>{formatDurationFromYears(summary.smokingYears)}</strong>
          </div>
        </div>

        <div className="summary-block">
          <h3 className="method-heading">Smoking quantity/rate</h3>
          <div className="summary-grid">
            <div>Pattern:</div>
            <strong>
              {summary.consumptionQuantity} {summary.consumptionUnit} / {summary.consumptionIntervalCount} {summary.consumptionIntervalUnit}
            </strong>
            <div>Derived rate:</div>
            <strong>{summary.cigsPerDay.toFixed(2)} cigarettes/day</strong>
            <div>Equivalent:</div>
            <strong>{summary.packsPerWeek.toFixed(2)} packs/week</strong>
          </div>
        </div>

        <div className="summary-block">
          <h3 className="method-heading">Profile</h3>
          <div className="summary-grid">
            <div>Age:</div>
            <strong>{summary.ageYears.toFixed(1)} years</strong>
            <div>Sex:</div>
            <strong>{summary.biologicalSex[0].toUpperCase() + summary.biologicalSex.slice(1)}</strong>
            <div>Weight / Height:</div>
            <strong>{summary.weightValue} {summary.weightUnit} / {formatHeightValue(summary.heightValue, summary.heightUnit)}</strong>
          </div>
        </div>
      </section>
    );
  }

  const feetInches = inchesToFeetInches(typeof inputs.heightValue === "number" ? inputs.heightValue : 0);

  return (
    <section>
      <h2 className="section-title">Smoking History</h2>
      <p className="section-subtitle">Complete the sections, then submit to collapse into a one-screen summary.</p>

      <div className="intake-section">
        <h3 className="method-heading">Smoking length</h3>

        <div className="toggle-row">
          <ToggleButton
            active={inputs.smokingLengthMode === "exact_dates"}
            label="Exact start and end dates"
            icon={<svg viewBox="0 0 20 20" width="14" height="14"><rect x="2" y="3" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M2 8h16" stroke="currentColor" strokeWidth="2" /></svg>}
            onClick={() => onChange("smokingLengthMode", "exact_dates")}
          />
          <ToggleButton
            active={inputs.smokingLengthMode === "approx_years"}
            label="Approximate years"
            icon={<svg viewBox="0 0 20 20" width="14" height="14"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M10 6v5l3 2" stroke="currentColor" strokeWidth="2" fill="none" /></svg>}
            onClick={() => onChange("smokingLengthMode", "approx_years")}
          />
        </div>

        <div className="field-grid compact-grid">
          {inputs.smokingLengthMode === "exact_dates" ? (
            <>
              <label className="field" htmlFor="smokingStartDateISO">
                <span className="field-label">Start date</span>
                <input
                  id="smokingStartDateISO"
                  name="smokingStartDateISO"
                  type="date"
                  value={inputs.smokingStartDateISO}
                  onChange={(event) => onChange("smokingStartDateISO", event.target.value)}
                />
                {errors.smokingStartDateISO && <span className="field-error" role="alert">{errors.smokingStartDateISO}</span>}
              </label>

              <label className="field" htmlFor="quitDateISO">
                <span className="field-label">End date (quit)</span>
                <input
                  id="quitDateISO"
                  name="quitDateISO"
                  type="date"
                  value={inputs.quitDateISO}
                  onChange={(event) => onChange("quitDateISO", event.target.value)}
                />
                {errors.quitDateISO && <span className="field-error" role="alert">{errors.quitDateISO}</span>}
              </label>
            </>
          ) : (
            <>
              <label className="field" htmlFor="approxSmokingYears">
                <span className="field-label">Approximate smoking years</span>
                <input
                  id="approxSmokingYears"
                  name="approxSmokingYears"
                  type="number"
                  step={0.25}
                  value={inputs.approxSmokingYears}
                  onChange={(event) => {
                    const value = event.target.value;
                    onChange("approxSmokingYears", value === "" ? "" : Number(value));
                  }}
                />
                <span className="field-hint">Range: 0 to {MAX_SMOKING_YEARS} years.</span>
                {errors.approxSmokingYears && <span className="field-error" role="alert">{errors.approxSmokingYears}</span>}
              </label>

              <label className="field" htmlFor="quitDateISO">
                <span className="field-label">End date (quit)</span>
                <input
                  id="quitDateISO"
                  name="quitDateISO"
                  type="date"
                  value={inputs.quitDateISO}
                  onChange={(event) => onChange("quitDateISO", event.target.value)}
                />
                {errors.quitDateISO && <span className="field-error" role="alert">{errors.quitDateISO}</span>}
              </label>
            </>
          )}
        </div>

        <div className="derived-badge">
          Smoking length estimate: {yearsText(summary.smokingStartDateISO, summary.quitDateISO)}
        </div>
      </div>

      <div className="intake-section">
        <h3 className="method-heading">Smoking quantity/rate</h3>

        <div className="dual-box-grid">
          <label className="field metric-box" htmlFor="consumptionQuantity">
            <span className="field-label">Quantity</span>
            <input
              id="consumptionQuantity"
              name="consumptionQuantity"
              type="number"
              step={0.1}
              value={inputs.consumptionQuantity}
              onChange={(event) => {
                const value = event.target.value;
                onChange("consumptionQuantity", value === "" ? "" : Number(value));
              }}
            />
            <div className="toggle-row">
              <ToggleButton
                active={inputs.consumptionUnit === "cigarettes"}
                label="Cigarettes"
                icon={<svg viewBox="0 0 20 20" width="14" height="14"><rect x="2" y="7" width="13" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="2" /><rect x="15" y="7" width="3" height="6" rx="1" fill="currentColor" /></svg>}
                onClick={() => handleConsumptionUnitChange("cigarettes")}
              />
              <ToggleButton
                active={inputs.consumptionUnit === "packs"}
                label="Packs"
                icon={<svg viewBox="0 0 20 20" width="14" height="14"><rect x="3" y="3" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M3 8h14" stroke="currentColor" strokeWidth="2" /></svg>}
                onClick={() => handleConsumptionUnitChange("packs")}
              />
            </div>
            <span className="field-hint">0 to {MAX_CONSUMPTION_QUANTITY}</span>
            {errors.consumptionQuantity && <span className="field-error" role="alert">{errors.consumptionQuantity}</span>}
          </label>

          <label className="field metric-box" htmlFor="consumptionIntervalCount">
            <span className="field-label">Time interval</span>
            <input
              id="consumptionIntervalCount"
              name="consumptionIntervalCount"
              type="number"
              step={1}
              value={inputs.consumptionIntervalCount}
              onChange={(event) => {
                const value = event.target.value;
                onChange("consumptionIntervalCount", value === "" ? "" : Number(value));
              }}
            />
            <div className="toggle-row">
              <ToggleButton
                active={inputs.consumptionIntervalUnit === "days"}
                label="Days"
                icon={<svg viewBox="0 0 20 20" width="14" height="14"><circle cx="10" cy="10" r="5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M10 1v3M10 16v3M1 10h3M16 10h3" stroke="currentColor" strokeWidth="2" /></svg>}
                onClick={() => handleConsumptionIntervalUnitChange("days")}
              />
              <ToggleButton
                active={inputs.consumptionIntervalUnit === "weeks"}
                label="Weeks"
                icon={<svg viewBox="0 0 20 20" width="14" height="14"><rect x="2" y="3" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M2 8h16M7 3v4M13 3v4" stroke="currentColor" strokeWidth="2" /></svg>}
                onClick={() => handleConsumptionIntervalUnitChange("weeks")}
              />
            </div>
            <span className="field-hint">{MIN_CONSUMPTION_INTERVAL_COUNT} to {MAX_CONSUMPTION_INTERVAL_COUNT}</span>
            {errors.consumptionIntervalCount && <span className="field-error" role="alert">{errors.consumptionIntervalCount}</span>}
          </label>
        </div>

        <div className="derived-badge">
          {estimatedCigsPerDay == null
            ? "Enter quantity + interval to derive daily rate."
            : `Derived smoking rate: ${estimatedCigsPerDay.toFixed(2)} cigarettes/day`}
        </div>
      </div>

      <div className="intake-section">
        <h3 className="method-heading">Body metrics</h3>

        <div className="field-grid compact-grid">
          <label className="field" htmlFor="dobISO">
            <span className="field-label">Date of birth</span>
            <input
              id="dobISO"
              name="dobISO"
              type="date"
              value={inputs.dobISO}
              onChange={(event) => onChange("dobISO", event.target.value)}
            />
            <div className="derived-age">Age: {ageYears == null ? "--" : `${ageYears.toFixed(1)} years`}</div>
            {errors.dobISO && <span className="field-error" role="alert">{errors.dobISO}</span>}
          </label>

          <label className="field" htmlFor="biologicalSex">
            <span className="field-label">Biological sex</span>
            <select
              id="biologicalSex"
              name="biologicalSex"
              value={inputs.biologicalSex}
              onChange={(event) => onChange("biologicalSex", event.target.value as BiologicalSex)}
            >
              {SEX_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
            {errors.biologicalSex && <span className="field-error" role="alert">{errors.biologicalSex}</span>}
          </label>
        </div>

        <div className="dual-box-grid body-metrics-grid">
          <label className="field metric-box" htmlFor="weightValue">
            <span className="field-label">Weight</span>
            <input
              id="weightValue"
              name="weightValue"
              type="number"
              step={0.1}
              value={inputs.weightValue}
              onChange={(event) => {
                const value = event.target.value;
                onChange("weightValue", value === "" ? "" : Number(value));
              }}
            />
            <div className="unit-toggle-row">
              <button
                type="button"
                className={`unit-toggle ${inputs.weightUnit === "kg" ? "unit-toggle--active" : ""}`}
                onClick={() => handleWeightUnitChange("kg")}
              >
                kg
              </button>
              <button
                type="button"
                className={`unit-toggle ${inputs.weightUnit === "lb" ? "unit-toggle--active" : ""}`}
                onClick={() => handleWeightUnitChange("lb")}
              >
                lbs
              </button>
            </div>
            <span className="field-hint">Supported: {weightRangeText(inputs.weightUnit)}</span>
            {errors.weightValue && <span className="field-error" role="alert">{errors.weightValue}</span>}
          </label>

          <label className="field metric-box" htmlFor="heightValue">
            <span className="field-label">Height</span>
            <div className="unit-toggle-row">
              <button
                type="button"
                className={`unit-toggle ${inputs.heightUnit === "cm" ? "unit-toggle--active" : ""}`}
                onClick={() => handleHeightUnitChange("cm")}
              >
                cm
              </button>
              <button
                type="button"
                className={`unit-toggle ${inputs.heightUnit === "in" ? "unit-toggle--active" : ""}`}
                onClick={() => handleHeightUnitChange("in")}
              >
                feet-inches
              </button>
            </div>

            {inputs.heightUnit === "cm" ? (
              <input
                id="heightValue"
                name="heightValue"
                type="number"
                step={0.1}
                value={inputs.heightValue}
                onChange={(event) => {
                  const value = event.target.value;
                  onChange("heightValue", value === "" ? "" : Number(value));
                }}
              />
            ) : (
              <div className="split-input-row">
                <label className="split-input">
                  <span className="field-label">Feet</span>
                  <input
                    type="number"
                    step={1}
                    min={0}
                    value={feetInches.feet}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      onChange("heightValue", feetInchesToTotalInches(value, feetInches.inches));
                    }}
                  />
                </label>
                <label className="split-input">
                  <span className="field-label">Inches</span>
                  <input
                    type="number"
                    step={1}
                    min={0}
                    value={feetInches.inches}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      onChange("heightValue", feetInchesToTotalInches(feetInches.feet, value));
                    }}
                  />
                </label>
              </div>
            )}

            <span className="field-hint">Supported: {heightRangeText(inputs.heightUnit)}</span>
            {errors.heightValue && <span className="field-error" role="alert">{errors.heightValue}</span>}
          </label>
        </div>
      </div>

      <div className="intake-actions">
        <button type="button" className="chip" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="chip chip--primary" onClick={onSubmit} disabled={!canSubmit}>
          Submit Smoking History
        </button>
      </div>
    </section>
  );
}
