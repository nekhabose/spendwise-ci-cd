import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
    </div>
  );
}
