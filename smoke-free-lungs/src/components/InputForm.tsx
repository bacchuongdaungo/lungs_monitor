import type { FocusEvent, KeyboardEvent, ReactNode } from "react";
import {
  // ageYearsFromDOBISO,
  estimateCigsPerDay,
  MAX_CONSUMPTION_INTERVAL_COUNT,
  MAX_CONSUMPTION_QUANTITY,
  MAX_HEIGHT_CM,
  // MAX_SMOKING_YEARS,
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
  onChange: (key: keyof Inputs, value: Inputs[keyof Inputs]) => void;
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

function toNumberOrEmpty(value: string): number | "" {
  if (value === "") return "";
  const sanitized = value.replace(/^0+(?=\d)/, "");
  return Number(sanitized);
}

function toIntegerOrEmpty(value: string): number | "" {
  if (value === "") return "";
  const sanitized = value.replace(/^0+(?=\d)/, "");
  const num = Number(sanitized);
  return Number.isFinite(num) ? Math.round(num) : "";
}

function normalizeNumberChange(target: HTMLInputElement): number | "" {
  const parsed = toNumberOrEmpty(target.value);
  if (parsed !== "") {
    const normalized = parsed.toString();
    if (target.value !== normalized) {
      target.value = normalized;
    }
  }
  return parsed;
}

function normalizeIntegerChange(target: HTMLInputElement): number | "" {
  const parsed = toIntegerOrEmpty(target.value);
  if (parsed !== "") {
    const normalized = parsed.toString();
    if (target.value !== normalized) {
      target.value = normalized;
    }
  }
  return parsed;
}

function sanitizeInputDisplay(target: HTMLInputElement) {
  if (target.value !== "") {
    const num = Number(target.value);
    if (Number.isFinite(num)) {
      target.value = num.toString();
    }
  }
}

function handleBlur(event: FocusEvent<HTMLInputElement>) {
  sanitizeInputDisplay(event.target);
}

function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter") {
    sanitizeInputDisplay(event.currentTarget);
    event.currentTarget.blur();
  }
}

function handleIntegerKeyDown(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === ".") {
    event.preventDefault();
  }
  handleKeyDown(event);
}

function handleFocusSelectZero(event: FocusEvent<HTMLInputElement>) {
  const parsed = Number(event.currentTarget.value);
  if (event.currentTarget.value !== "" && Number.isFinite(parsed) && parsed === 0) {
    event.currentTarget.select();
  }
}

function dynamicInputWidth(value: number | "", minDigits = 2, maxDigits = 6): string {
  if (value === "") {
    return `calc(${minDigits}ch + 2.7rem)`;
  }

  const digits = Math.max(minDigits, Math.min(maxDigits, Math.abs(value).toString().length));
  return `calc(${digits}ch + 2.7rem)`;
}

export function InputForm({ inputs, errors, summary, onChange }: Props) {
  const quantity = Number(inputs.consumptionQuantity);
  const intervalCount = Number(inputs.consumptionIntervalCount);

  const estimatedCigsPerDay = estimateCigsPerDay(
    inputs.consumptionUnit,
    quantity,
    inputs.consumptionIntervalUnit,
    intervalCount,
  );

  // const ageYears = ageYearsFromDOBISO(inputs.dobISO);

  function handleConsumptionUnitChange(nextUnit: ConsumptionUnit) {
    if (nextUnit === inputs.consumptionUnit) return;

    onChange("consumptionUnit", nextUnit);
  }

  function handleConsumptionIntervalUnitChange(nextUnit: ConsumptionIntervalUnit) {
    if (nextUnit === inputs.consumptionIntervalUnit) return;

    onChange("consumptionIntervalUnit", nextUnit);
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

  const hasHeightValue = typeof inputs.heightValue === "number";
  const heightInchesValue = typeof inputs.heightValue === "number" ? inputs.heightValue : 0;
  const feetInches = inchesToFeetInches(heightInchesValue);
  const numericFeet = feetInches.feet;
  const numericInches = feetInches.inches;
  const feetValue: number | "" = hasHeightValue ? numericFeet : "";
  const inchesValue: number | "" = hasHeightValue ? numericInches : "";

  return (
    <section>
      <h2 className="section-title">Smoking History</h2>
      <p className="section-subtitle">Edit directly in this summary view. Changes apply instantly.</p>

      <div className="summary-block">
        <h3 className="method-heading">Smoking length</h3>
        <div className="summary-grid">
          {/* <div>Mode:</div>
          <strong>
            <div className="toggle-row">
              <ToggleButton
                active={inputs.smokingLengthMode === "exact_dates"}
                label="Exact start and end dates"
                icon={
                  <svg viewBox="0 0 20 20" width="14" height="14">
                    <rect x="2" y="3" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M2 8h16" stroke="currentColor" strokeWidth="2" />
                  </svg>
                }
                onClick={() => onChange("smokingLengthMode", "exact_dates")}
              />
              <ToggleButton
                active={inputs.smokingLengthMode === "approx_years"}
                label="Approximate years"
                icon={
                  <svg viewBox="0 0 20 20" width="14" height="14">
                    <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M10 6v5l3 2" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                }
                onClick={() => onChange("smokingLengthMode", "approx_years")}
              />
            </div>
          </strong> */}

          {inputs.smokingLengthMode === "exact_dates" ? (
            <>
              <div>Start date:</div>
              <strong>
                <label className="summary-control" htmlFor="smokingStartDateISO">
                  <input
                    id="smokingStartDateISO"
                    name="smokingStartDateISO"
                    type="month"
                    aria-label="Start date"
                    value={inputs.smokingStartDateISO}
                    onChange={(event) => onChange("smokingStartDateISO", event.target.value)}
                  />
                  {errors.smokingStartDateISO ? <span className="field-error" role="alert">{errors.smokingStartDateISO}</span> : null}
                </label>
              </strong>
            </>
          ) : (
            <>
              {/* <div>Approx. years:</div>
              <strong>
                <label className="summary-control" htmlFor="approxSmokingYears">
                  <input
                    id="approxSmokingYears"
                    name="approxSmokingYears"
                    type="number"
                    step={0.25}
                    aria-label="Approximate smoking years"
                    value={inputs.approxSmokingYears}
                    onChange={(event) => onChange("approxSmokingYears", normalizeNumberChange(event.currentTarget))}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocusSelectZero}
                    onBlur={handleBlur}
                  />
                  <span className="field-hint">Range: 0 to {MAX_SMOKING_YEARS} years.</span>
                  {errors.approxSmokingYears ? <span className="field-error" role="alert">{errors.approxSmokingYears}</span> : null}
                </label>
              </strong> */}
            </>
          )}

          <div>End date (quit):</div>
          <strong>
            <label className="summary-control" htmlFor="quitDateISO">
              <input
                id="quitDateISO"
                name="quitDateISO"
                type="date"
                aria-label="End date (quit)"
                value={inputs.quitDateISO}
                onChange={(event) => onChange("quitDateISO", event.target.value)}
              />
              {errors.quitDateISO ? <span className="field-error" role="alert">{errors.quitDateISO}</span> : null}
            </label>
          </strong>
        </div>

        <p className="summary-sentence">Smoking length estimate: {yearsText(summary.smokingStartDateISO, summary.quitDateISO)}</p>
      </div>

      <div className="summary-block">
        <h3 className="method-heading">Smoking quantity/rate</h3>
        <div className="summary-grid">
          <div>Quantity:</div>
          <strong>
            <div className="summary-control">
              <div className="summary-inline-control-row">
                <label className="summary-inline-field" htmlFor="consumptionQuantity">
                <input
                  id="consumptionQuantity"
                  name="consumptionQuantity"
                  type="number"
                  step={1}
                  min={0}
                  aria-label="Quantity"
                  value={inputs.consumptionQuantity}
                  onChange={(event) => onChange("consumptionQuantity", normalizeIntegerChange(event.currentTarget))}
                  onKeyDown={handleIntegerKeyDown}
                  onFocus={handleFocusSelectZero}
                  onBlur={handleBlur}
                />
                </label>
                <div className="toggle-row summary-inline-toggle-row">
                  <ToggleButton
                    active={inputs.consumptionUnit === "cigarettes"}
                    label="Cigarettes"
                    icon={
                      <svg viewBox="0 0 20 20" width="14" height="14">
                        <rect x="2" y="7" width="13" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
                        <rect x="15" y="7" width="3" height="6" rx="1" fill="currentColor" />
                      </svg>
                    }
                    onClick={() => handleConsumptionUnitChange("cigarettes")}
                  />
                  <ToggleButton
                    active={inputs.consumptionUnit === "packs"}
                    label="Packs"
                    icon={
                      <svg viewBox="0 0 20 20" width="14" height="14">
                        <rect x="3" y="3" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                        <path d="M3 8h14" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    }
                    onClick={() => handleConsumptionUnitChange("packs")}
                  />
                </div>
                <span className="field-hint">0 to {MAX_CONSUMPTION_QUANTITY}</span>
              </div>
              {errors.consumptionQuantity ? <span className="field-error" role="alert">{errors.consumptionQuantity}</span> : null}
            </div>
          </strong>

          <div>Time interval:</div>
          <strong>
            <div className="summary-control">
              <div className="summary-inline-control-row">
                <label className="summary-inline-field" htmlFor="consumptionIntervalCount">
                <input
                  id="consumptionIntervalCount"
                  name="consumptionIntervalCount"
                  type="number"
                  step={1}
                  min={0}
                  aria-label="Time interval"
                  value={inputs.consumptionIntervalCount}
                  onChange={(event) => onChange("consumptionIntervalCount", normalizeNumberChange(event.currentTarget))}
                  onKeyDown={handleIntegerKeyDown}
                  onFocus={handleFocusSelectZero}
                  onBlur={handleBlur}
                />
                </label>
                <div className="toggle-row summary-inline-toggle-row">
                  <ToggleButton
                    active={inputs.consumptionIntervalUnit === "days"}
                    label="Days"
                    icon={
                      <svg viewBox="0 0 20 20" width="14" height="14">
                        <circle cx="10" cy="10" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
                        <path d="M10 1v3M10 16v3M1 10h3M16 10h3" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    }
                    onClick={() => handleConsumptionIntervalUnitChange("days")}
                  />
                  <ToggleButton
                    active={inputs.consumptionIntervalUnit === "weeks"}
                    label="Weeks"
                    icon={
                      <svg viewBox="0 0 20 20" width="14" height="14">
                        <rect x="2" y="3" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                        <path d="M2 8h16M7 3v4M13 3v4" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    }
                    onClick={() => handleConsumptionIntervalUnitChange("weeks")}
                  />
                </div>
                <span className="field-hint">{MIN_CONSUMPTION_INTERVAL_COUNT} to {MAX_CONSUMPTION_INTERVAL_COUNT}</span>
              </div>
              {errors.consumptionIntervalCount ? <span className="field-error" role="alert">{errors.consumptionIntervalCount}</span> : null}
            </div>
          </strong>

          <div>Derived rate:</div>
          <strong>
            {estimatedCigsPerDay == null
              ? "Enter quantity + interval to derive daily rate."
              : <span className="value-unit">{estimatedCigsPerDay.toFixed(2)} cigarettes/day</span>}
          </strong>
          <div>Equivalent:</div>
          <strong><span className="value-unit">{summary.packsPerWeek.toFixed(2)} packs/week</span></strong>
        </div>
      </div>

      <div className="summary-block">
        <h3 className="method-heading">Profile</h3>
        <div className="summary-grid">
          <div>DOB:</div>
          <strong>
            <label className="summary-control" htmlFor="dobISO">
              <input
                id="dobISO"
                name="dobISO"
                type="date"
                aria-label="Date of birth"
                value={inputs.dobISO}
                onChange={(event) => onChange("dobISO", event.target.value)}
              />
              {/* <span className="field-hint">Age: {ageYears == null ? "--" : `${ageYears.toFixed(1)} years`}</span> */}
              {errors.dobISO ? <span className="field-error" role="alert">{errors.dobISO}</span> : null}
            </label>
          </strong>

          <div>Sex:</div>
          <strong>
            <label className="summary-control" htmlFor="biologicalSex">
              <select
                id="biologicalSex"
                name="biologicalSex"
                aria-label="Biological sex"
                value={inputs.biologicalSex}
                onChange={(event) => onChange("biologicalSex", event.target.value as BiologicalSex)}
              >
                {SEX_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.biologicalSex ? <span className="field-error" role="alert">{errors.biologicalSex}</span> : null}
            </label>
          </strong>

          <div>Weight:</div>
          <strong>
            <div className="summary-control">
              <div className="summary-inline-control-row">
                <label className="summary-inline-field" htmlFor="weightValue">
                  <input
                    id="weightValue"
                    name="weightValue"
                    type="number"
                    step={0.1}
                    aria-label="Weight"
                    value={inputs.weightValue}
                    onChange={(event) => onChange("weightValue", normalizeNumberChange(event.currentTarget))}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocusSelectZero}
                    onBlur={handleBlur}
                  />
                </label>
                <label className="summary-inline-field summary-inline-field--unit">
                  <select
                    aria-label="Weight unit"
                    value={inputs.weightUnit}
                    onChange={(event) => handleWeightUnitChange(event.target.value as WeightUnit)}
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lbs</option>
                  </select>
                </label>
                <span className="field-hint">Supported: {weightRangeText(inputs.weightUnit)}</span>
              </div>
              {errors.weightValue ? <span className="field-error" role="alert">{errors.weightValue}</span> : null}
            </div>
          </strong>

          <div>Height:</div>
          <strong>
            <div className="summary-control">
              <div className="summary-height-input-row">
                {inputs.heightUnit === "cm" ? (
                  <label className="summary-inline-field summary-inline-field--height-cm" htmlFor="heightValue">
                    <input
                      id="heightValue"
                      name="heightValue"
                      type="number"
                      step={1}
                      min={0}
                      aria-label="Height"
                      value={inputs.heightValue}
                      style={{ width: dynamicInputWidth(inputs.heightValue, 3, 6) }}
                      onChange={(event) => onChange("heightValue", normalizeIntegerChange(event.currentTarget))}
                      onKeyDown={handleIntegerKeyDown}
                      onFocus={handleFocusSelectZero}
                      onBlur={handleBlur}
                    />
                  </label>
                ) : (
                  <div className="summary-inline-field summary-inline-field--double summary-inline-field--double-compact">
                    <label className="split-input split-input--inline" htmlFor="heightFeet">
                      <input
                        id="heightFeet"
                        type="number"
                        step={1}
                        min={0}
                        aria-label="Height feet"
                        value={feetValue}
                        style={{ width: dynamicInputWidth(feetValue, 2, 6) }}
                        onChange={(event) => {
                          const value = normalizeIntegerChange(event.currentTarget);
                          if (value === "") {
                            if (numericInches === 0) {
                              onChange("heightValue", "");
                            } else {
                              onChange("heightValue", numericInches);
                            }
                            return;
                          }
                          onChange("heightValue", feetInchesToTotalInches(value, numericInches));
                        }}
                        onKeyDown={handleIntegerKeyDown}
                        onFocus={handleFocusSelectZero}
                        onBlur={handleBlur}
                      />
                      <span className="split-unit">ft</span>
                    </label>
                    <label className="split-input split-input--inline" htmlFor="heightInches">
                      <input
                        id="heightInches"
                        type="number"
                        step={1}
                        min={0}
                        max={11}
                        aria-label="Height inches"
                        value={inchesValue}
                        style={{ width: dynamicInputWidth(inchesValue, 2, 4) }}
                        onChange={(event) => {
                          const value = normalizeIntegerChange(event.currentTarget);
                          if (value === "") {
                            if (numericFeet === 0) {
                              onChange("heightValue", "");
                            } else {
                              onChange("heightValue", feetInchesToTotalInches(numericFeet, 0));
                            }
                            return;
                          }
                          const nextInches = typeof value === "number"
                            ? Math.min(11, Math.max(0, value))
                            : 0;
                          onChange("heightValue", feetInchesToTotalInches(numericFeet, nextInches));
                        }}
                        onKeyDown={handleIntegerKeyDown}
                        onFocus={handleFocusSelectZero}
                        onBlur={handleBlur}
                      />
                      <span className="split-unit">in</span>
                    </label>
                  </div>
                )}

                <label className="summary-inline-field summary-inline-field--unit">
                  <select
                    aria-label="Height unit"
                    value={inputs.heightUnit}
                    onChange={(event) => handleHeightUnitChange(event.target.value as HeightUnit)}
                  >
                    <option value="cm">cm</option>
                    <option value="in">ft/in</option>
                  </select>
                </label>
              </div>
              <span className="field-hint">Supported: {heightRangeText(inputs.heightUnit)}</span>
              {errors.heightValue ? <span className="field-error" role="alert">{errors.heightValue}</span> : null}
            </div>
          </strong>

          {/* <div>Current profile:</div>
          <strong>
            <span className="value-unit">{formatHeightValue(summary.heightValue, summary.heightUnit)}</span>
            {", "}
            <span className="value-unit">{summary.weightValue} {summary.weightUnit}</span>
            {", "}
            <span className="value-unit">{summary.ageYears.toFixed(1)} years old</span>
            {" "}
            {summary.biologicalSex}
          </strong> */}
        </div>
      </div>
      <div className="summary-block">
        <h3 className="method-heading">Summary</h3>
        <div className="summary-grid"></div>
        <div>Current profile:</div>
          <strong>
            <span className="value-unit">{formatHeightValue(summary.heightValue, summary.heightUnit)}</span>
            {", "}
            <span className="value-unit">{summary.weightValue} {summary.weightUnit}</span>
            {", "}
            <span className="value-unit">{summary.ageYears.toFixed(1)} years old</span>
            {" "}
            {summary.biologicalSex} smoked for {yearsText(summary.smokingStartDateISO, summary.quitDateISO)} at a rate of {estimatedCigsPerDay == null ? "--" : `${estimatedCigsPerDay.toFixed(2)} cigarettes/day`}.
          </strong>
      </div>
    </section>
  );
}
