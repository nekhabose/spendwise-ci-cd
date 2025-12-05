export default function About() {
  return (
    <div className="page about-page">
      <section className="page-card about-panel">
        <p className="eyebrow">Why</p>
        <h2>SpendWise is a short-form brand story.</h2>
        <p>
          It proves you can pitch a community finance product with a single
          scroll, strong gradients, and live data.
        </p>
        <ul className="about-list">
          <li>React + Vite + React Router → instant routing.</li>
          <li>localStorage + JSON schema → portable data.</li>
          <li>Netlify via GitHub Actions → automated releases.</li>
          <li>Community feed → search + filters out of the box.</li>
        </ul>
        <p>Less copy, more intention. That is the SpendWise tone.</p>
      </section>
    </div>
  );
}
