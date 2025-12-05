import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const generateFeedback = (entries, notes) => {
  if (!entries.length) return [];
  const total = entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const sorted = [...entries].sort((a, b) => (b.amount || 0) - (a.amount || 0));
  const guidance = [];

  const top = sorted[0];
  if (top && (top.amount || 0) > total * 0.45) {
    guidance.push(
      `Focus on ${top.label}: it absorbs nearly half of your budget. Set a soft guardrail before the next cycle.`
    );
  }

  const zeroed = entries.filter((entry) => Number(entry.amount) === 0);
  if (zeroed.length) {
    guidance.push(
      `No activity in ${zeroed.map((entry) => entry.label).join(", ")}. Prune unused buckets to keep the story tight.`
    );
  }

  const joy = entries.find((entry) => entry.id === "joy");
  if (joy && joy.amount < total * 0.05) {
    guidance.push("Your Joy fund is under 5%. Add a little breathing room to avoid burnout.");
  }

  if (notes && notes.length > 12) {
    guidance.push("Notes captured — convert them into calendar nudges or reminders.");
  }

  if (!guidance.length) {
    guidance.push("Distribution looks balanced. Celebrate the win and schedule the next check-in.");
  }

  return guidance;
};

export default function Summary() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [notes, setNotes] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("spendingData");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (parsed.entries) {
        setRecords(parsed.entries);
        setNotes(parsed.notes || "");
        setUpdatedAt(parsed.updatedAt);
      } else {
        const legacyEntries = Object.entries(parsed).map(([id, amount]) => ({
          id,
          label: id[0].toUpperCase() + id.slice(1),
          helper: "Imported from legacy localStorage structure.",
          amount: Number(amount || 0),
        }));
        setRecords(legacyEntries);
      }
    } catch (error) {
      console.error("Unable to parse spending data", error);
    }
  }, []);

  const insights = useMemo(() => {
    if (!records.length) return null;

    const total = records.reduce((sum, entry) => sum + Number(entry.amount), 0);
    const topEntry = records.reduce(
      (prev, curr) => (curr.amount > prev.amount ? curr : prev),
      { amount: 0 }
    );
    const average = total / records.length;

    return {
      total,
      topEntry,
      average,
    };
  }, [records]);

  const dashboardMetrics = useMemo(() => {
    if (!records.length) return [];
    const max = Math.max(...records.map((entry) => Number(entry.amount || 0)), 1);
    return records.map((entry) => {
      const amount = Number(entry.amount || 0);
      return {
        ...entry,
        percent: Math.round((amount / max) * 100),
      };
    });
  }, [records]);

  const guidance = useMemo(() => generateFeedback(records, notes), [records, notes]);

  const handleClear = () => {
    localStorage.removeItem("spendingData");
    setRecords([]);
    setNotes("");
    setUpdatedAt(null);
  };

  if (!records.length) {
    return (
      <div className="page summary-page">
        <section className="page-card empty-state">
          <h2>No data yet</h2>
          <p>Add amounts in Categories to unlock insights.</p>
          <button
            type="button"
            className="primary-btn"
            onClick={() => navigate("/categories")}
          >
            Go to categories
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="page summary-page">
      <section className="page-card intro-card">
        <div>
          <p className="eyebrow">Step 03 · Summary</p>
          <h2>Instant spend pulse</h2>
          <p>Totals, averages, and highlights update the moment you save.</p>
        </div>
        {insights && (
          <div className="insight-list">
            <article>
              <small>Total recorded</small>
              <strong>${insights.total.toFixed(2)}</strong>
            </article>
            <article>
              <small>Top focus</small>
              <strong>{insights.topEntry.label || "—"}</strong>
            </article>
            <article>
              <small>Average per category</small>
              <strong>${insights.average.toFixed(2)}</strong>
            </article>
          </div>
        )}
      </section>

      <section className="page-card summary-grid">
        <div className="summary-list">
          {records.map((entry) => (
            <article key={entry.id} className="summary-item">
              <div>
                <h3>{entry.label}</h3>
                <p>{entry.helper || "Category summary"}</p>
              </div>
              <strong>${Number(entry.amount).toFixed(2)}</strong>
            </article>
          ))}
        </div>
        <aside className="summary-details">
          <div>
            <h3>Notes</h3>
            <p>{notes || "No extra notes this run."}</p>
          </div>
          {updatedAt && (
            <p className="timestamp">
              Updated {new Date(updatedAt).toLocaleString()}
            </p>
          )}
          <div className="summary-actions">
            <button type="button" onClick={() => navigate("/categories")}>
              Edit categories
            </button>
            <button type="button" className="ghost-btn" onClick={handleClear}>
              Clear data
            </button>
          </div>
        </aside>
      </section>

      <section className="page-card dashboard-panel">
        <header>
          <p className="eyebrow">Dashboard</p>
          <h2>Category breakdown</h2>
          <p>Bars scale to your highest spend. Hover for the exact amount.</p>
        </header>
        <div className="dashboard-grid">
          {dashboardMetrics.map((entry) => (
            <article key={entry.id}>
              <div className="dashboard-label">
                <strong>{entry.label}</strong>
                <span>${Number(entry.amount).toFixed(2)}</span>
              </div>
              <div className="progress-track" aria-hidden="true">
                <span style={{ width: `${entry.percent}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="page-card ai-panel">
        <header>
          <p className="eyebrow">LLM-style guidance</p>
          <h2>Micro advice from your numbers</h2>
        </header>
        <ul>
          {guidance.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
