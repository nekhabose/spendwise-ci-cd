import { Link } from "react-router-dom";

const highlights = [
  {
    title: "Voice + visuals",
    copy: "A single hero block blends narration, CTA, and data pulses.",
  },
  {
    title: "Snap routing",
    copy: "React Router keeps the story flowing without page reloads.",
  },
  {
    title: "Actionable data",
    copy: "Inputs sync to localStorage and feed filtering views instantly.",
  },
];

const storyBeats = [
  {
    label: "Beat 01",
    title: "Listen",
    detail: "Arrive, feel the vibe, absorb the mission in one glance.",
  },
  {
    label: "Beat 02",
    title: "Log",
    detail: "Drop in the categories that define your month.",
  },
  {
    label: "Beat 03",
    title: "Share",
    detail: "Compare with the community feed and publish insights.",
  },
];

const heroMetrics = [
  { label: "Households", value: "1,240+" },
  { label: "Playbooks", value: "87" },
  { label: "Cities", value: "12" },
];

export default function Home() {
  return (
    <div className="landing-page">
      <section className="page-card landing-hero">
        <div>
          <p className="eyebrow">SpendWise Pulse</p>
          <h2>Budget clarity in seconds.</h2>
          <p>Pick a path and start logging.</p>
          <div className="cta-row">
            <Link className="primary-btn" to="/categories">
              Enter your spending
            </Link>
            <Link className="ghost-btn" to="/community">
              Explore live stories
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

      <section className="page-card highlight-grid">
        {highlights.map((item) => (
          <article key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
          </article>
        ))}
      </section>

      <section className="page-card narrative-panel">
        <header>
          <p className="eyebrow">Storyline</p>
          <h2>Short beats, clear purpose</h2>
          <p>Every section mirrors a moment in the budgeting journey.</p>
        </header>
        <div className="storyline">
          {storyBeats.map((beat) => (
            <article key={beat.label} className="story-card">
              <small>{beat.label}</small>
              <h3>{beat.title}</h3>
              <p>{beat.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-card flow-panel">
        <div>
          <h2>Navigation that just flows</h2>
          <p>Cards, CTAs, and routing stay consistent across the app.</p>
        </div>
        <div>
          <ul className="flow-steps">
            <li>
              <strong>1. Listen on the landing page.</strong> Absorb the story,
              the mission, and the CTA.
            </li>
            <li>
              <strong>2. Log what matters.</strong> Categories capture nuanced
              spending in accessible cards.
            </li>
            <li>
              <strong>3. Summarize & compare.</strong> The summary view reveals
              insights instantly and links to community data for inspiration.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
