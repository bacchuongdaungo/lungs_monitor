export function MethodPanel() {
  return (
    <section>
      <h2 className="section-title">Disclaimers and Limits</h2>
      <p className="section-subtitle">
        This application is educational only. It does not diagnose disease, replace a clinician, or prescribe treatment.
      </p>

      <h3 className="method-heading">Use Boundaries</h3>
      <ul className="method-list">
        <li>Do not use this app to confirm or rule out lung disease, heart disease, cancer, or any emergency condition.</li>
        <li>Do not use the visual recovery score as a medical measurement or a substitute for clinical testing.</li>
        <li>Ask-the-lungs responses are educational explanations only and must not be treated as diagnosis or treatment advice.</li>
        <li>Brand chemistry values are approximate educational ranges, not lab-certified measurements for every product or pack.</li>
      </ul>

      <h3 className="method-heading">Model Limits</h3>
      <ul className="method-list">
        <li>Smoking duration, intensity, and exposure are inferred from user-entered history rather than biomarker measurements.</li>
        <li>Recovery outputs such as tar burden, nicotine dependence, dopamine tolerance, and cilia function are heuristic proxies.</li>
        <li>The model uses generalized assumptions about metabolism, brand chemistry, and smoking behavior that may not match an individual patient.</li>
        <li>LLM answers may be incomplete, outdated, or incorrect even when a remote endpoint is available.</li>
      </ul>

      <h3 className="method-heading">Safety</h3>
      <ul className="method-list">
        <li>If there is severe chest pain, major breathing distress, coughing blood, fainting, or blue lips or fingertips, seek emergency care immediately.</li>
        <li>If symptoms persist, worsen, or feel out of proportion to the app's output, seek evaluation from a licensed clinician.</li>
      </ul>

      <h3 className="method-heading">Reference Basis</h3>
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
