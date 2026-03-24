import { MethodPanel } from "../components/MethodPanel";

export function AboutPage() {
  return (
    <section className="page-panel">
      <div className="page-grid">
        <article className="card card--method">
          <MethodPanel />
        </article>
      </div>
    </section>
  );
}
