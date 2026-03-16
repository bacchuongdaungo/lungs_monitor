import { InputForm } from "../components/InputForm";
import type { Inputs, ValidatedInputs } from "../model";

type Props = {
  inputs: Inputs;
  summary: ValidatedInputs;
  onSubmit: (nextInputs: Inputs) => void;
};

export function PatientPage({ inputs, summary, onSubmit }: Props) {
  return (
    <section className="page-panel">
      <div className="page-grid page-grid--patient">
        <article className="card card--hero-panel">
          <h2 className="section-title">Patient Record</h2>
          <p className="section-subtitle">
            Store the smoking history, quit date, body profile, cigarette brand, vape brand, and recovery goal in one place.
          </p>

          <div className="record-grid">
            <article className="record-card">
              <span className="record-card__label">Smoking history</span>
              <strong className="record-card__value">{summary.smokingYears.toFixed(1)} years</strong>
              <p className="record-card__detail">
                {summary.consumptionQuantity} {summary.consumptionUnit} every {summary.consumptionIntervalCount} {summary.consumptionIntervalUnit}
              </p>
            </article>

            <article className="record-card">
              <span className="record-card__label">Quit date</span>
              <strong className="record-card__value">{summary.quitDateISO}</strong>
              <p className="record-card__detail">{summary.cigsPerDay.toFixed(2)} cigarettes/day before quitting</p>
            </article>

            <article className="record-card">
              <span className="record-card__label">Brands</span>
              <strong className="record-card__value">{summary.cigaretteBrandName}</strong>
              <p className="record-card__detail">{summary.vapeBrandName || "No vape brand recorded"}</p>
            </article>

            <article className="record-card">
              <span className="record-card__label">Recovery goal</span>
              <strong className="record-card__value">{summary.recoveryGoal}</strong>
              <p className="record-card__detail">Update this goal anytime from the editor below.</p>
            </article>
          </div>
        </article>

        <article className="card">
          <InputForm inputs={inputs} summary={summary} onSubmit={onSubmit} />
        </article>
      </div>
    </section>
  );
}
