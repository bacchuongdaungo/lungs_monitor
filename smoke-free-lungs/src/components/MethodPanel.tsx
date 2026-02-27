export function MethodPanel() {
  return (
    <section>
      <h2 className="section-title">How This Model Works</h2>
      <p className="section-subtitle">
        This is an educational visualization. It does not diagnose disease or predict personal risk.
      </p>

      <ul className="method-list">
        <li>Smoking exposure is represented with pack-years and a saturating exposure curve.</li>
        <li>Soot, inflammation, and mucus use different recovery time constants.</li>
        <li>Cilia function improves over time but is capped by prior exposure in this model.</li>
        <li>The lung art is cartoony; the trend direction follows evidence-informed assumptions.</li>
      </ul>

      <h3 className="method-heading">Limits</h3>
      <ul className="method-list">
        <li>Individual recovery varies by age, comorbidities, and cessation consistency.</li>
        <li>No diagnosis, prognosis, or disease-risk percentage is generated.</li>
        <li>If symptoms persist or worsen, seek evaluation from a licensed clinician.</li>
      </ul>

      <h3 className="method-heading">Source Keys</h3>
      <ul className="source-list">
        <li>
          <strong>CDC-01/02/03</strong>: CDC quit smoking health benefits timeline.
        </li>
        <li>
          <strong>NHS-01/02</strong>: NHS stop smoking body recovery milestones.
        </li>
        <li>
          <strong>WHO-01</strong>: WHO tobacco harm and cessation guidance.
        </li>
        <li>
          <strong>PAPER-01/02</strong>: peer-reviewed respiratory recovery and mucociliary function studies.
        </li>
      </ul>
    </section>
  );
}