import { Link } from "react-router-dom";

const highlights = [
  {
    title: "Fast onboarding",
    copy: "Drop a card statement or start typing—either way the five categories fill in seconds.",
  },
  {
    title: "Confident edits",
    copy: "Every line item can be adjusted or added manually without leaving the page.",
  },
  {
    title: "Clear summary",
    copy: "Totals update instantly so you can brief stakeholders with the exact numbers they expect.",
  },
];

const workflow = [
  {
    title: "Import or log",
    detail: "Upload a statement or key in amounts. Transactions land in a clean statement table.",
  },
  {
    title: "Refine & explain",
    detail: "Edit amounts, select the right category, add notes, and create manual entries.",
  },
  {
    title: "Present",
    detail: "Open the summary view to brief leaders or capture next steps.",
  },
];

const heroMetrics = [
  { label: "Teams onboarded", value: "120+" },
  { label: "Minutes saved", value: "15+ / run" },
  { label: "Accuracy", value: "99%" },
];

export default function Home() {
  return (
    <div className="landing-page">
      <section className="page-card landing-hero">
        <div>
          <p className="eyebrow">SpendWise FinOps</p>
          <h2>Turn raw statements into ready-to-share numbers.</h2>
          <p>Import expenses, make quick edits, and lock in totals before anyone asks for an update.</p>
          <div className="cta-row">
            <Link className="primary-btn" to="/categories">
              Start logging
            </Link>
            <Link className="ghost-btn" to="/summary">
              Open summary
            </Link>
          </div>
        </div>
        <ul className="hero-metrics">
          {heroMetrics.map((metric) => (
            <li key={metric.label}>
              <span>{metric.value}</span>
              <small>{metric.label}</small>
            </li>
          ))}
        </ul>
      </section>

      <section className="page-card highlight-grid refined-grid">
        {highlights.map((item) => (
          <article key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
          </article>
        ))}
      </section>

      <section className="page-card professional-panel">
        <div>
          <p className="eyebrow">Workflow</p>
          <h2>From import to insight in three simple steps.</h2>
          <p>Everything is laid out so busy teams can review spend without digging through tabs.</p>
        </div>
        <div className="workflow">
          <div className="workflow-steps">
            {workflow.map((step) => (
              <article key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </article>
            ))}
          </div>
          <div className="insights-callout">
            <h3>Deliverables</h3>
            <p>Editable statement, synced categories, ready-to-present summary.</p>
            <Link className="primary-btn" to="/categories">
              Try the flow
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
