import { useMemo, useState, type FocusEvent, type SubmitEvent, type KeyboardEvent, type ReactNode } from "react";
import type { BrandCatalogResult, CigaretteBrand, VapeBrand } from "../cigBrands";
import {
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
  type Inputs,
  type ValidatedInputs,
  type WeightUnit,
  validateInputs,
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
  summary: ValidatedInputs;
  onSubmit: (nextInputs: Inputs) => void;
  cigaretteBrands: CigaretteBrand[];
  vapeBrands: VapeBrand[];
  brandCatalogStatus: "loading" | "ready";
  brandCatalogSource: BrandCatalogResult["source"];
};

const SEX_OPTIONS: Array<{ id: BiologicalSex; label: string }> = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "other", label: "Other" },
];

const INPUT_KEYS: ReadonlyArray<keyof Inputs> = [
  "smokingLengthMode",
  "smokingStartDateISO",
  "approxSmokingYears",
  "quitDateISO",
  "consumptionUnit",
  "consumptionQuantity",
  "consumptionIntervalUnit",
  "consumptionIntervalCount",
  "cigaretteBrandId",
  "cigaretteBrandName",
  "dobISO",
  "biologicalSex",
  "weightValue",
  "weightUnit",
  "heightValue",
  "heightUnit",
  "vapeBrandName",
  "recoveryGoal",
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

function parseIsoDate(isoDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

function smokingDurationText(startISO: string, quitISO: string): string {
  const years = smokingYearsByDates(startISO, quitISO);

  const start = parseIsoDate(startISO);
  const quit = parseIsoDate(quitISO);
  if (!start || !quit) {
    return `${years.toFixed(1)} years`;
  }

  const msPerDay = 86_400_000;
  const days = Math.max(0, Math.round((quit.getTime() - start.getTime()) / msPerDay));

  if (days < 30) {
    return `${days} day${days === 1 ? "" : "s"}`;
  }

  if (days < 365) {
    const months = Math.max(1, Math.round(days / 30.44));
    return `${months} month${months === 1 ? "" : "s"}`;
  }

  return `${years.toFixed(1)} years`;
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

function inputsEqual(a: Inputs, b: Inputs): boolean {
  return INPUT_KEYS.every((key) => a[key] === b[key]);
}

function findCigaretteBrandByName(brands: CigaretteBrand[], query: string): CigaretteBrand | null {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return null;
  return brands.find((brand) => brand.name.trim().toLowerCase() === normalizedQuery) ?? null;
}

function findVapeBrandByName(brands: VapeBrand[], query: string): VapeBrand | null {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return null;
  return brands.find((brand) => brand.name.trim().toLowerCase() === normalizedQuery) ?? null;
}

function filterBrandsByQuery<T extends { name: string }>(brands: T[], query: string): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return brands;
  return brands.filter((brand) => brand.name.trim().toLowerCase().includes(normalizedQuery));
}

function formatCountedUnit(value: number, unit: ConsumptionUnit | ConsumptionIntervalUnit): string {
  if (value === 1) {
    if (unit === "cigarettes") return "cigarette";
    if (unit === "packs") return "pack";
    if (unit === "days") return "day";
    return "week";
  }

  return unit;
}

function formatSmokingPattern(
  quantity: number,
  consumptionUnit: ConsumptionUnit,
  intervalCount: number,
  intervalUnit: ConsumptionIntervalUnit,
): string {
  return `${quantity} ${formatCountedUnit(quantity, consumptionUnit)} / ${intervalCount} ${formatCountedUnit(intervalCount, intervalUnit)}`;
}

export function InputForm({
  inputs,
  summary,
  onSubmit,
  cigaretteBrands,
  vapeBrands,
  brandCatalogStatus,
  brandCatalogSource,
}: Props) {
  const [draft, setDraft] = useState<Inputs>(inputs);
  const [isEditing, setIsEditing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cigaretteBrandQuery, setCigaretteBrandQuery] = useState("");
  const [vapeBrandQuery, setVapeBrandQuery] = useState("");

  const draftValidation = useMemo(() => validateInputs(draft), [draft]);
  const draftErrors = draftValidation.errors;
  const durationPreviewStartISO =
    draftValidation.value?.smokingStartDateISO ??
    (draft.smokingLengthMode === "exact_dates" ? draft.smokingStartDateISO : summary.smokingStartDateISO);

  const hasDraftChanges = useMemo(() => !inputsEqual(draft, inputs), [draft, inputs]);

  const estimatedDraftCigsPerDay = estimateCigsPerDay(
    draft.consumptionUnit,
    Number(draft.consumptionQuantity),
    draft.consumptionIntervalUnit,
    Number(draft.consumptionIntervalCount),
  );

  const hasHeightValue = typeof draft.heightValue === "number";
  const heightInchesValue = typeof draft.heightValue === "number" ? draft.heightValue : 0;
  const feetInches = inchesToFeetInches(heightInchesValue);
  const numericFeet = feetInches.feet;
  const numericInches = feetInches.inches;
  const feetValue: number | "" = hasHeightValue ? numericFeet : "";
  const inchesValue: number | "" = hasHeightValue ? numericInches : "";
  const selectedCigaretteBrand =
    cigaretteBrands.find((brand) => brand.id === draft.cigaretteBrandId) ?? null;
  const selectedVapeBrand =
    vapeBrands.find((brand) => brand.name === draft.vapeBrandName) ?? null;
  const filteredCigaretteBrands = useMemo(
    () => filterBrandsByQuery(cigaretteBrands, cigaretteBrandQuery),
    [cigaretteBrands, cigaretteBrandQuery],
  );
  const filteredVapeBrands = useMemo(
    () => filterBrandsByQuery(vapeBrands, vapeBrandQuery),
    [vapeBrands, vapeBrandQuery],
  );
  const brandCatalogLabel =
    brandCatalogStatus === "loading"
      ? "Refreshing brand catalog..."
      : brandCatalogSource === "remote"
        ? "Catalog source: live brand database"
        : "Catalog source: local fallback list";

  function updateDraft<K extends keyof Inputs>(key: K, value: Inputs[K]) {
    setDraft((current) => {
      if (current[key] === value) return current;
      return {
        ...current,
        [key]: value,
      };
    });
  }

  function handleEditorToggle() {
    if (isEditing) {
      setDraft(inputs);
      setCigaretteBrandQuery("");
      setVapeBrandQuery("");
      setSubmitError(null);
      setIsEditing(false);
      return;
    }

    setDraft(inputs);
    setCigaretteBrandQuery("");
    setVapeBrandQuery("");
    setSubmitError(null);
    setIsEditing(true);
  }

  function handleConsumptionUnitChange(nextUnit: ConsumptionUnit) {
    if (nextUnit === draft.consumptionUnit) return;
    updateDraft("consumptionUnit", nextUnit);
  }

  function handleConsumptionIntervalUnitChange(nextUnit: ConsumptionIntervalUnit) {
    if (nextUnit === draft.consumptionIntervalUnit) return;
    updateDraft("consumptionIntervalUnit", nextUnit);
  }

  function handleWeightUnitChange(nextUnit: WeightUnit) {
    if (nextUnit === draft.weightUnit) return;

    const converted = convertNumberishInput(
      draft.weightValue,
      (value) => convertWeight(value, draft.weightUnit, nextUnit),
      1,
    );

    updateDraft("weightUnit", nextUnit);
    updateDraft("weightValue", converted);
  }

  function handleHeightUnitChange(nextUnit: HeightUnit) {
    if (nextUnit === draft.heightUnit) return;

    const converted = convertNumberishInput(
      draft.heightValue,
      (value) => convertHeight(value, draft.heightUnit, nextUnit),
      nextUnit === "cm" ? 1 : 0,
    );

    updateDraft("heightUnit", nextUnit);
    updateDraft("heightValue", converted);
  }

  function handleCancel() {
    setDraft(inputs);
    setCigaretteBrandQuery("");
    setVapeBrandQuery("");
    setSubmitError(null);
    setIsEditing(false);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextValidation = validateInputs(draft);

    if (nextValidation.value == null) {
      setSubmitError("Please fix highlighted fields before submitting.");
      return;
    }

    onSubmit(draft);
    setSubmitError(null);
    setIsEditing(false);
  }

  return (
    <section>
      <h2 className="section-title">Profile</h2>
      <p className="section-subtitle">
        {/* Summary stays visible. Expand to update and submit changes. */}
      </p>

      <div className="summary-block">
        {/* <h3 className="method-heading">Summary</h3> */}
        <p className="summary-sentence">
          Smoking length: {smokingDurationText(summary.smokingStartDateISO, summary.quitDateISO)}.
        </p>
        <p className="summary-sentence">
          Pattern: {formatSmokingPattern(
            summary.consumptionQuantity,
            summary.consumptionUnit,
            summary.consumptionIntervalCount,
            summary.consumptionIntervalUnit,
          )}.
        </p>
        <p className="summary-sentence">
          Derived rate: {summary.cigsPerDay.toFixed(2)} cigarettes/day ({summary.packsPerWeek.toFixed(2)} packs/week).
        </p>
        <p className="summary-sentence">
          Current profile: {formatHeightValue(summary.heightValue, summary.heightUnit)}, {summary.weightValue} {summary.weightUnit}, {summary.ageYears.toFixed(1)} years old {summary.biologicalSex}.
        </p>
        <p className="summary-sentence">
          Cigarette brand: {summary.cigaretteBrandName}. {summary.vapeBrandName ? `Vape brand: ${summary.vapeBrandName}. ` : ""}Goal: {summary.recoveryGoal}.
        </p>
      </div>

      <div className="intake-dropdown">
        <button
          type="button"
          className="chip intake-dropdown-toggle"
          onClick={handleEditorToggle}
          aria-expanded={isEditing}
          aria-controls="smoking-history-editor"
        >
          {isEditing ? "Close Editor" : "Update Smoking History"}
        </button>
      </div>

      {isEditing ? (
        <form id="smoking-history-editor" className="intake-editor" onSubmit={handleSubmit}>
          <div className="summary-block">
            <h3 className="method-heading">Smoking length</h3>
            <div className="summary-grid">
              <div>Mode:</div>
              <strong>
                <div className="toggle-row summary-inline-toggle-row">
                  <button
                    type="button"
                    className={`chip ${draft.smokingLengthMode === "exact_dates" ? "chip--primary" : ""}`}
                    onClick={() => updateDraft("smokingLengthMode", "exact_dates")}
                  >
                    Exact dates
                  </button>
                  <button
                    type="button"
                    className={`chip ${draft.smokingLengthMode === "approx_years" ? "chip--primary" : ""}`}
                    onClick={() => updateDraft("smokingLengthMode", "approx_years")}
                  >
                    Approx years
                  </button>
                </div>
              </strong>

              {draft.smokingLengthMode === "exact_dates" ? (
                <>
                  <div>Start date:</div>
                  <strong>
                    <label className="summary-control" htmlFor="smokingStartDateISO">
                      <input
                        id="smokingStartDateISO"
                        name="smokingStartDateISO"
                        type="date"
                        aria-label="Start date"
                        value={draft.smokingStartDateISO}
                        onChange={(event) => updateDraft("smokingStartDateISO", event.target.value)}
                      />
                      {draftErrors.smokingStartDateISO ? <span className="field-error" role="alert">{draftErrors.smokingStartDateISO}</span> : null}
                    </label>
                  </strong>
                </>
              ) : (
                <>
                  <div>Approx years:</div>
                  <strong>
                    <label className="summary-control" htmlFor="approxSmokingYears">
                      <input
                        id="approxSmokingYears"
                        name="approxSmokingYears"
                        type="number"
                        step={0.25}
                        min={0}
                        aria-label="Approximate smoking years"
                        value={draft.approxSmokingYears}
                        onChange={(event) => updateDraft("approxSmokingYears", normalizeNumberChange(event.currentTarget))}
                        onKeyDown={handleKeyDown}
                        onFocus={handleFocusSelectZero}
                        onBlur={handleBlur}
                      />
                      <span className="field-hint">Range: 0 to {MAX_SMOKING_YEARS} years</span>
                      {draftErrors.approxSmokingYears ? <span className="field-error" role="alert">{draftErrors.approxSmokingYears}</span> : null}
                    </label>
                  </strong>
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
                    value={draft.quitDateISO}
                    onChange={(event) => updateDraft("quitDateISO", event.target.value)}
                  />
                  {draftErrors.quitDateISO ? <span className="field-error" role="alert">{draftErrors.quitDateISO}</span> : null}
                </label>
              </strong>
            </div>

            <p className="summary-sentence">
              Duration preview: {smokingDurationText(
                durationPreviewStartISO,
                draft.quitDateISO,
              )}
            </p>
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
                        value={draft.consumptionQuantity}
                        onChange={(event) => updateDraft("consumptionQuantity", normalizeIntegerChange(event.currentTarget))}
                        onKeyDown={handleIntegerKeyDown}
                        onFocus={handleFocusSelectZero}
                        onBlur={handleBlur}
                      />
                    </label>
                    <div className="toggle-row summary-inline-toggle-row">
                      <ToggleButton
                        active={draft.consumptionUnit === "cigarettes"}
                        label="Cigarettes"
                        icon={(
                          <svg viewBox="0 0 20 20" width="14" height="14">
                            <rect x="2" y="7" width="13" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
                            <rect x="15" y="7" width="3" height="6" rx="1" fill="currentColor" />
                          </svg>
                        )}
                        onClick={() => handleConsumptionUnitChange("cigarettes")}
                      />
                      <ToggleButton
                        active={draft.consumptionUnit === "packs"}
                        label="Packs"
                        icon={(
                          <svg viewBox="0 0 20 20" width="14" height="14">
                            <rect x="3" y="3" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                            <path d="M3 8h14" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        )}
                        onClick={() => handleConsumptionUnitChange("packs")}
                      />
                    </div>
                    <span className="field-hint">0 to {MAX_CONSUMPTION_QUANTITY}</span>
                  </div>
                  {draftErrors.consumptionQuantity ? <span className="field-error" role="alert">{draftErrors.consumptionQuantity}</span> : null}
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
                        value={draft.consumptionIntervalCount}
                        onChange={(event) => updateDraft("consumptionIntervalCount", normalizeIntegerChange(event.currentTarget))}
                        onKeyDown={handleIntegerKeyDown}
                        onFocus={handleFocusSelectZero}
                        onBlur={handleBlur}
                      />
                    </label>
                    <div className="toggle-row summary-inline-toggle-row">
                      <ToggleButton
                        active={draft.consumptionIntervalUnit === "days"}
                        label="Days"
                        icon={(
                          <svg viewBox="0 0 20 20" width="14" height="14">
                            <circle cx="10" cy="10" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
                            <path d="M10 1v3M10 16v3M1 10h3M16 10h3" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        )}
                        onClick={() => handleConsumptionIntervalUnitChange("days")}
                      />
                      <ToggleButton
                        active={draft.consumptionIntervalUnit === "weeks"}
                        label="Weeks"
                        icon={(
                          <svg viewBox="0 0 20 20" width="14" height="14">
                            <rect x="2" y="3" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                            <path d="M2 8h16M7 3v4M13 3v4" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        )}
                        onClick={() => handleConsumptionIntervalUnitChange("weeks")}
                      />
                    </div>
                    <span className="field-hint">{MIN_CONSUMPTION_INTERVAL_COUNT} to {MAX_CONSUMPTION_INTERVAL_COUNT}</span>
                  </div>
                  {draftErrors.consumptionIntervalCount ? <span className="field-error" role="alert">{draftErrors.consumptionIntervalCount}</span> : null}
                </div>
              </strong>

              <div>Derived rate:</div>
              <strong>
                {estimatedDraftCigsPerDay == null
                  ? "Let's see how much you smoked."
                  : <span className="value-unit">{estimatedDraftCigsPerDay.toFixed(2)} cigarettes/day</span>}
              </strong>
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
                    value={draft.dobISO}
                    onChange={(event) => updateDraft("dobISO", event.target.value)}
                  />
                  {draftErrors.dobISO ? <span className="field-error" role="alert">{draftErrors.dobISO}</span> : null}
                </label>
              </strong>

              <div>Sex:</div>
              <strong>
                <label className="summary-control" htmlFor="biologicalSex">
                  <select
                    id="biologicalSex"
                    name="biologicalSex"
                    aria-label="Biological sex"
                    value={draft.biologicalSex}
                    onChange={(event) => updateDraft("biologicalSex", event.target.value as BiologicalSex)}
                  >
                    {SEX_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {draftErrors.biologicalSex ? <span className="field-error" role="alert">{draftErrors.biologicalSex}</span> : null}
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
                        value={draft.weightValue}
                        onChange={(event) => updateDraft("weightValue", normalizeNumberChange(event.currentTarget))}
                        onKeyDown={handleKeyDown}
                        onFocus={handleFocusSelectZero}
                        onBlur={handleBlur}
                      />
                    </label>
                    <label className="summary-inline-field summary-inline-field--unit">
                      <select
                        aria-label="Weight unit"
                        value={draft.weightUnit}
                        onChange={(event) => handleWeightUnitChange(event.target.value as WeightUnit)}
                      >
                        <option value="kg">kg</option>
                        <option value="lb">lbs</option>
                      </select>
                    </label>
                    <span className="field-hint">Supported: {weightRangeText(draft.weightUnit)}</span>
                  </div>
                  {draftErrors.weightValue ? <span className="field-error" role="alert">{draftErrors.weightValue}</span> : null}
                </div>
              </strong>

              <div>Height:</div>
              <strong>
                <div className="summary-control">
                  <div className="summary-height-input-row">
                    {draft.heightUnit === "cm" ? (
                      <label className="summary-inline-field summary-inline-field--height-cm" htmlFor="heightValue">
                        <input
                          id="heightValue"
                          name="heightValue"
                          type="number"
                          step={1}
                          min={0}
                          aria-label="Height"
                          value={draft.heightValue}
                          style={{ width: dynamicInputWidth(draft.heightValue, 3, 6) }}
                          onChange={(event) => updateDraft("heightValue", normalizeIntegerChange(event.currentTarget))}
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
                                  updateDraft("heightValue", "");
                                } else {
                                  updateDraft("heightValue", numericInches);
                                }
                                return;
                              }
                              updateDraft("heightValue", feetInchesToTotalInches(value, numericInches));
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
                                  updateDraft("heightValue", "");
                                } else {
                                  updateDraft("heightValue", feetInchesToTotalInches(numericFeet, 0));
                                }
                                return;
                              }
                              const nextInches = typeof value === "number"
                                ? Math.min(11, Math.max(0, value))
                                : 0;
                              updateDraft("heightValue", feetInchesToTotalInches(numericFeet, nextInches));
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
                        value={draft.heightUnit}
                        onChange={(event) => handleHeightUnitChange(event.target.value as HeightUnit)}
                      >
                        <option value="cm">cm</option>
                        <option value="in">ft/in</option>
                      </select>
                    </label>
                  </div>
                  <span className="field-hint">Supported: {heightRangeText(draft.heightUnit)}</span>
                  {draftErrors.heightValue ? <span className="field-error" role="alert">{draftErrors.heightValue}</span> : null}
                </div>
              </strong>
            </div>
          </div>

          <div className="summary-block">
            <h3 className="method-heading">Brands and goals</h3>
            <div className="summary-grid">
              <div>Cigarette brand:</div>
              <strong>
                <div className="summary-control">
                  <label className="summary-control-label" htmlFor="cigaretteBrandSearch">
                    Search cigarette catalog
                  </label>
                  <input
                    id="cigaretteBrandSearch"
                    name="cigaretteBrandSearch"
                    type="text"
                    aria-label="Search cigarette catalog"
                    placeholder="Type to narrow the cigarette list"
                    value={cigaretteBrandQuery}
                    onChange={(event) => {
                      const query = event.target.value;
                      setCigaretteBrandQuery(query);
                      const matchedBrand = findCigaretteBrandByName(cigaretteBrands, query);
                      if (matchedBrand) {
                        updateDraft("cigaretteBrandId", matchedBrand.id);
                        updateDraft("cigaretteBrandName", matchedBrand.name);
                        return;
                      }
                      if (query.trim()) {
                        updateDraft("cigaretteBrandId", "");
                        updateDraft("cigaretteBrandName", "");
                      }
                    }}
                  />
                  <label className="summary-control-label" htmlFor="cigaretteBrandId">
                    Cigarette brand
                  </label>
                  <select
                    id="cigaretteBrandId"
                    name="cigaretteBrandId"
                    aria-label="Cigarette brand"
                    className="catalog-select"
                    size={7}
                    value={draft.cigaretteBrandId}
                    onChange={(event) => {
                      const selectedBrand = cigaretteBrands.find((brand) => brand.id === event.target.value) ?? null;
                      updateDraft("cigaretteBrandId", selectedBrand?.id ?? "");
                      updateDraft("cigaretteBrandName", selectedBrand?.name ?? "");
                      setCigaretteBrandQuery("");
                    }}
                  >
                    {filteredCigaretteBrands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                  <span className="field-hint">{brandCatalogLabel}</span>
                  <span className="field-hint">Type to narrow the list, or scroll the full catalog when the search is empty.</span>
                  {selectedCigaretteBrand ? (
                    <span className="field-hint">
                      {selectedCigaretteBrand.manufacturer} · {selectedCigaretteBrand.nicotineMg.toFixed(1)}mg nicotine · {selectedCigaretteBrand.tarMg.toFixed(0)}mg tar
                    </span>
                  ) : null}
                  {cigaretteBrandQuery.trim() && filteredCigaretteBrands.length === 0 ? (
                    <span className="field-hint">No cigarette brands match the current search.</span>
                  ) : null}
                  {draftErrors.cigaretteBrandId ? <span className="field-error" role="alert">{draftErrors.cigaretteBrandId}</span> : null}
                </div>
              </strong>

              <div>Vape brand:</div>
              <strong>
                <div className="summary-control">
                  <label className="summary-control-label" htmlFor="vapeBrandSearch">
                    Search vape catalog
                  </label>
                  <input
                    id="vapeBrandSearch"
                    name="vapeBrandSearch"
                    type="text"
                    aria-label="Search vape catalog"
                    placeholder="Type to narrow the vape list"
                    value={vapeBrandQuery}
                    onChange={(event) => {
                      const query = event.target.value;
                      setVapeBrandQuery(query);
                      const matchedBrand = findVapeBrandByName(vapeBrands, query);
                      if (matchedBrand) {
                        updateDraft("vapeBrandName", matchedBrand.name);
                        return;
                      }
                      if (query.trim()) {
                        updateDraft("vapeBrandName", "");
                      }
                    }}
                  />
                  <label className="summary-control-label" htmlFor="vapeBrandName">
                    Vape brand
                  </label>
                  <select
                    id="vapeBrandName"
                    name="vapeBrandName"
                    aria-label="Vape brand"
                    className="catalog-select"
                    size={6}
                    value={draft.vapeBrandName}
                    onChange={(event) => {
                      updateDraft("vapeBrandName", event.target.value);
                      setVapeBrandQuery("");
                    }}
                  >
                    <option value="">No vape brand recorded</option>
                    {filteredVapeBrands.map((brand) => (
                      <option key={brand.id} value={brand.name}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                  <span className="field-hint">Selectable from the same catalog feed as cigarette brands.</span>
                  <span className="field-hint">Type to narrow the list, or scroll the full catalog when the search is empty.</span>
                  {selectedVapeBrand ? (
                    <span className="field-hint">
                      {selectedVapeBrand.manufacturer}
                      {selectedVapeBrand.nicotineMg != null ? ` · ${selectedVapeBrand.nicotineMg.toFixed(1)}mg nicotine` : ""}
                    </span>
                  ) : null}
                  {vapeBrandQuery.trim() && filteredVapeBrands.length === 0 ? (
                    <span className="field-hint">No vape brands match the current search.</span>
                  ) : null}
                </div>
              </strong>

              <div>Recovery goal:</div>
              <strong>
                <label className="summary-control" htmlFor="recoveryGoal">
                  <input
                    id="recoveryGoal"
                    name="recoveryGoal"
                    type="text"
                    maxLength={120}
                    aria-label="Recovery goal"
                    value={draft.recoveryGoal}
                    onChange={(event) => updateDraft("recoveryGoal", event.target.value)}
                  />
                  <span className="field-hint">Example: Reach one full smoke-free year.</span>
                  {draftErrors.recoveryGoal ? <span className="field-error" role="alert">{draftErrors.recoveryGoal}</span> : null}
                </label>
              </strong>
            </div>
          </div>

          {submitError ? <p className="field-error">{submitError}</p> : null}

          <div className="intake-actions">
            <button type="button" className="chip" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="chip chip--primary" disabled={!hasDraftChanges}>
              Submit
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
