export function MethodPanel() {
  return (
    <section>
      <h2 className="section-title">How This Model Works</h2>
      <p className="section-subtitle">
        This is an educational visualization. It does not diagnose disease or prescribe treatment.
      </p>

      <ul className="method-list">
        <li>Smoking duration is calculated from smoking start date and quit date.</li>
        <li>Age is derived from DOB, and metabolism factor is estimated from Mifflin-St Jeor BMR using age, sex, weight, and height.</li>
        <li>Smoking intensity is derived from user-selected pattern: cigarettes or packs over days or weeks.</li>
        <li>Brand nicotine/tar values shape effective exposure, tar burden, nicotine dependence, and dopamine-tolerance proxies.</li>
        <li>Timeline projection is capped at the model day where recovery reaches 100% of its computed target.</li>
        <li>Ask-the-lungs supports optional medical LLM integration when endpoint is configured.</li>
      </ul>

      <h3 className="method-heading">Limits</h3>
      <ul className="method-list">
        <li>Brand chemistry values are approximate educational ranges, not lab-certified measurements for every pack.</li>
        <li>Dopamine and dependence outputs are proxies, not neurochemical diagnostics.</li>
        <li>LLM answers are educational explanations and may be incomplete or incorrect.</li>
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
