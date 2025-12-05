import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const defaultCategories = [
  {
    id: "groceries",
    label: "Groceries",
    helper: "Fresh food, markets, bulk staples",
  },
  {
    id: "rent",
    label: "Rent or housing",
    helper: "Mortgage, utilities, repairs",
  },
  {
    id: "mobility",
    label: "Mobility",
    helper: "Transit passes, rideshare, bike tune ups",
  },
  {
    id: "care",
    label: "Care & wellness",
    helper: "Medical, childcare, community care",
  },
  {
    id: "joy",
    label: "Joy & experiments",
    helper: "Entertainment, creative sprints, hobbies",
  },
];

export default function Categories() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState(
    defaultCategories.reduce(
      (acc, item) => ({ ...acc, [item.id]: "" }),
      { notes: "" }
    )
  );
  const [status, setStatus] = useState({ type: "info", message: "" });

  const totals = useMemo(() => {
    const entries = Object.entries(formState).filter(([key]) => key !== "notes");
    const total = entries.reduce((sum, [, value]) => sum + Number(value || 0), 0);
    return {
      total,
      hasValues: total > 0,
    };
  }, [formState]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!totals.hasValues) {
      setStatus({
        type: "error",
        message: "Please record at least one amount before saving.",
      });
      return;
    }

    const payload = {
      updatedAt: new Date().toISOString(),
      entries: defaultCategories.map((category) => ({
        id: category.id,
        label: category.label,
        helper: category.helper,
        amount: Number(formState[category.id] || 0),
      })),
      notes: formState.notes.trim(),
    };

    localStorage.setItem("spendingData", JSON.stringify(payload));
    setStatus({
      type: "success",
      message: "Spending data saved. Jump to the summary view to review insights.",
    });
  };

  return (
    <div className="page categories-page">
      <section className="page-card intro-card">
        <div>
          <p className="eyebrow">Step 02 · Categories</p>
          <h2>Log fast, keep context.</h2>
          <p>Five slots, one notes field, zero friction.</p>
        </div>
        <div className="insight-list">
          <article>
            <small>Total this run</small>
            <strong>${totals.total.toFixed(2)}</strong>
          </article>
          <article>
            <small>Autosave timestamp</small>
            <strong>{new Date().toLocaleDateString()}</strong>
          </article>
          <article>
            <small>Next step</small>
            <strong>View summary</strong>
          </article>
        </div>
      </section>

      <section className="page-card category-section">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          <fieldset>
            <legend>Spending categories</legend>
            {defaultCategories.map((category) => (
              <label key={category.id} className="category-row">
                <div>
                  <span>{category.label}</span>
                  <p>{category.helper}</p>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name={category.id}
                  value={formState[category.id]}
                  onChange={handleChange}
                  aria-label={`${category.label} amount`}
                />
              </label>
            ))}
          </fieldset>
          <label className="notes-field">
            <span>Notes & narration</span>
            <textarea
              name="notes"
              rows="3"
              placeholder="Record commitments, shared bills, or ideas to explore later."
              value={formState.notes}
              onChange={handleChange}
            />
          </label>

          <div className="form-actions">
            <button type="submit" className="primary-btn">
              Save spending data
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => navigate("/summary")}
              disabled={!totals.hasValues}
            >
              Review summary
            </button>
          </div>
        </form>

        {status.message && (
          <div className={`status-banner status-${status.type}`}>
            <p>{status.message}</p>
            {status.type === "success" && (
              <button
                type="button"
                onClick={() => navigate("/summary")}
                className="link-btn"
              >
                Open summary →
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
