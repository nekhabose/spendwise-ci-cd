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
  {
    id: "other",
    label: "Other",
    helper: "Unmatched items or anything miscellaneous",
  },
];

const keywordBuckets = {
  groceries: ["market", "grocery", "whole foods", "trader joe", "aldi", "sprouts"],
  rent: ["rent", "landlord", "mortgage", "lease"],
  mobility: ["uber", "lyft", "metro", "bus", "train", "fuel", "gas", "shell"],
  care: ["clinic", "pharmacy", "hospital", "care", "therapy"],
  joy: ["cinema", "netflix", "spotify", "cafe", "coffee", "restaurant", "music"],
};

const aliasMap = defaultCategories.reduce((acc, item) => {
  acc[item.id] = item.id;
  acc[item.label.toLowerCase()] = item.id;
  acc[item.label.replace(/[^a-z]/gi, "").toLowerCase()] = item.id;
  return acc;
}, {});
const normalizeCategoryKey = (value = "") => {
  const key = value.toString().toLowerCase().trim();
  if (!key) return null;
  if (aliasMap[key]) return aliasMap[key];
  const cleaned = key.replace(/[^a-z]/g, "");
  if (aliasMap[cleaned]) return aliasMap[cleaned];
  return null;
};
const categoryLabelMap = defaultCategories.reduce((acc, item) => {
  acc[item.id] = item.label;
  return acc;
}, {});
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

let pdfLibPromise;
let pdfWorkerPromise;

const ensurePdfjs = async () => {
  if (!pdfLibPromise) {
    pdfLibPromise = import("pdfjs-dist/legacy/build/pdf.mjs");
  }
  if (!pdfWorkerPromise) {
    pdfWorkerPromise = import("pdfjs-dist/legacy/build/pdf.worker.mjs?url");
  }

  const [pdfjsLib, workerModule] = await Promise.all([pdfLibPromise, pdfWorkerPromise]);
  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      (workerModule && (workerModule.default || workerModule)) ?? "";
  }
  return pdfjsLib;
};

const extractTextFromPdf = async (file) => {
  try {
    const pdfjsLib = await ensurePdfjs();
    const data = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      pages.push(pageText);
    }
    return pages.join("\n");
  } catch (error) {
    console.error("Unable to read PDF", error);
    throw new Error("Could not read that PDF. Try downloading a text-friendly statement.");
  }
};

const isPdfFile = (file) =>
  file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

const parseTransactionsFromJson = (payload) => {
  const totals = [];
  const consume = (entry) => {
    if (!entry) return;
    const description = entry.description || entry.merchant || entry.label || entry.name;
    const amount = entry.amount ?? entry.value ?? entry.total;
    if (amount === undefined) return;
    totals.push({
      date: entry.date || entry.postedAt || "",
      description,
      amount,
      category: entry.category || entry.id,
    });
  };

  if (Array.isArray(payload)) {
    payload.forEach(consume);
  } else if (payload.transactions) {
    payload.transactions.forEach(consume);
  } else if (payload.entries) {
    payload.entries.forEach(consume);
  } else {
    Object.entries(payload).forEach(([key, value]) => {
      if (typeof value === "object" && value !== null) {
        consume({
          ...value,
          description: value.description || key,
          category: value.category || value.id || key,
        });
      } else {
        totals.push({
          date: "",
          description: key,
          amount: value,
          category: key,
        });
      }
    });
  }

  return totals;
};

const buildTransactionFromValues = (values) => {
  if (!values || values.length < 2) return null;
  let amountIndex = -1;
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const normalized = values[index].replace(/[^0-9.-]/g, "");
    if (!normalized) continue;
    const amount = Number(normalized);
    if (Number.isNaN(amount)) continue;
    amountIndex = index;
    break;
  }
  if (amountIndex === -1) return null;
  const amountValue = Number(values[amountIndex].replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(amountValue) || amountValue === 0) return null;

  const remaining = values.filter((_, idx) => idx !== amountIndex);
  if (!remaining.length) return null;

  let date = "";
  let descriptionParts = [...remaining];
  if (/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(remaining[0])) {
    date = remaining[0];
    descriptionParts = remaining.slice(1);
  }

  const description = descriptionParts.join(" ").trim();
  if (!description) return null;

  return {
    date,
    description,
    amount: amountValue,
  };
};

const buildTransactionFromRegex = (line) => {
  const match = line.match(/-?\d[\d,]*\.\d{2}/g);
  if (!match || !match.length) return null;
  const last = match[match.length - 1];
  const amountValue = Number(last.replace(/,/g, ""));
  if (Number.isNaN(amountValue) || amountValue === 0) return null;

  const withoutAmount = line.replace(last, "").trim();
  if (!withoutAmount) return null;
  const dateMatch = withoutAmount.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/);
  let description = withoutAmount;
  let date = "";
  if (dateMatch) {
    date = dateMatch[0];
    description = withoutAmount.replace(dateMatch[0], "").trim();
  }
  if (!description) return null;
  return {
    date,
    description,
    amount: amountValue,
  };
};

const parseTransactionsFromLines = (text) => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const parsed = [];
  lines.forEach((line) => {
    const commaSplit = line.split(/,|\t|;/).map((value) => value.trim()).filter(Boolean);
    if (commaSplit.length >= 2) {
      const transaction = buildTransactionFromValues(commaSplit);
      if (transaction) {
        parsed.push(transaction);
        return;
      }
    }
    const spacedSplit = line.split(/\s{2,}/).map((value) => value.trim()).filter(Boolean);
    if (spacedSplit.length >= 2) {
      const transaction = buildTransactionFromValues(spacedSplit);
      if (transaction) {
        parsed.push(transaction);
        return;
      }
    }

    const fallback = buildTransactionFromRegex(line);
    if (fallback) {
      parsed.push(fallback);
    }
  });
  return parsed;
};

const parseTransactionsFromText = (text) => {
  if (!text || !text.trim()) return [];
  const trimmed = text.trim();
  try {
    const parsedJson = JSON.parse(trimmed);
    return parseTransactionsFromJson(parsedJson);
  } catch (error) {
    // Fall through to CSV / free-form parsing
  }
  return parseTransactionsFromLines(trimmed);
};

const callLlmProxy = async (payload) => {
  console.log("[SpendWise] LLM proxy request started:", payload.mode, {
    transactionCount: payload.transactions?.length ?? 0,
  });
  try {
    const response = await fetch("/.netlify/functions/llm-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await response.text();
      const error = new Error(message || "LLM proxy error.");
      error.status = response.status;
      console.error("[SpendWise] LLM proxy responded with error:", error.status, message);
      throw error;
    }

    const data = await response.json();
    console.log("[SpendWise] LLM proxy success:", payload.mode, data.meta || {});
    return data;
  } catch (error) {
    const normalized = error instanceof Error ? error : new Error(String(error));
    if (typeof normalized.status === "undefined") {
      normalized.status = 0;
    }
    if (normalized.message?.includes("Failed to fetch") || normalized.status === 404) {
      console.warn(
        "[SpendWise] LLM proxy unreachable. Make sure `netlify dev` is running so functions are available."
      );
    }
    console.error("[SpendWise] LLM proxy request failed:", normalized);
    throw normalized;
  }
};

const parseUploadedTransactions = async (file) => {
  const isPdf = isPdfFile(file);
  const text = isPdf ? await extractTextFromPdf(file) : await file.text();
  if (!isPdf) {
    return {
      transactions: parseTransactionsFromText(text),
      source: "heuristic",
    };
  }

  let extractionError;
  let baseTransactions = [];
  let llmExtractionAttempted = false;
  let llmExtractionSucceeded = false;
  try {
    llmExtractionAttempted = true;
    baseTransactions = await parseTransactionsWithLlm(text);
    if (baseTransactions.length) {
      llmExtractionSucceeded = true;
    }
  } catch (error) {
    extractionError = error instanceof Error ? error : new Error(String(error));
  }

  if (!baseTransactions.length) {
    baseTransactions = parseTransactionsFromText(text);
  } else if (baseTransactions.length === 1) {
    const fallbackCandidates = parseTransactionsFromText(text);
    if (fallbackCandidates.length > baseTransactions.length) {
      baseTransactions = fallbackCandidates;
      llmExtractionSucceeded = false;
    }
  }

  baseTransactions = baseTransactions.map((transaction) => ({
    ...transaction,
    description: (transaction.description || transaction.merchant || "").trim(),
  }));

  let categoryAssignments = {};
  let categoryError;
  let llmCategorizationSucceeded = false;
  if (llmExtractionSucceeded && baseTransactions.length) {
    try {
      categoryAssignments = await categorizeTransactionsWithLlm(baseTransactions);
      if (Object.keys(categoryAssignments).length > 0) {
        llmCategorizationSucceeded = true;
      }
    } catch (error) {
      categoryError = error instanceof Error ? error : new Error(String(error));
    }
  }

  const merged = baseTransactions.map((transaction, index) => ({
    ...transaction,
    category: categoryAssignments[index],
  }));

  if (llmExtractionSucceeded && llmCategorizationSucceeded) {
    return { transactions: merged, source: "llm" };
  }

  if (llmExtractionAttempted && !llmExtractionSucceeded) {
    return {
      transactions: merged,
      source: "pdf-no-llm",
      warning: extractionError?.message || "LLM proxy unavailable. Using fallback parser.",
    };
  }

  return {
    transactions: merged,
    source: llmExtractionSucceeded ? "fallback" : "pdf-no-llm",
    warning:
      (categoryError || extractionError)?.message ||
      "LLM categorization unavailable. Using fallback parser.",
  };
};

const sanitizeJsonOutput = (raw = "") => {
  const trimmed = raw.trim();
  const matchObject = trimmed.match(/\{[\s\S]*\}/);
  if (matchObject) {
    try {
      return JSON.parse(matchObject[0]);
    } catch (error) {
      // continue to the array fallback
    }
  }
  const matchArray = trimmed.match(/\[[\s\S]*\]/);
  if (matchArray) {
    try {
      return JSON.parse(matchArray[0]);
    } catch (error) {
      return null;
    }
  }
  return null;
};

const normalizeLlmTransactions = (payload) => {
  if (!payload) return [];
  const collection = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.transactions)
      ? payload.transactions
      : [];
  return collection
    .map((entry) => ({
      date: entry.date || entry.posted_at || entry.postedAt || "",
      description: entry.description || entry.summary || entry.merchant || entry.label || "",
      merchant: entry.merchant || entry.vendor || entry.payee || "",
      amount: entry.amount ?? entry.value ?? entry.total ?? entry.debit ?? entry.credit,
    }))
    .filter((entry) => entry.description && entry.amount !== undefined)
    .map((entry) => ({
      ...entry,
      amount: Number(entry.amount),
    }))
    .filter((entry) => !Number.isNaN(entry.amount) && entry.amount !== 0);
};

const normalizeLlmCategoryAssignments = (payload) => {
  if (!payload) return {};
  const collection = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.assignments)
      ? payload.assignments
      : Array.isArray(payload.transactions)
        ? payload.transactions
        : [];
  return collection.reduce((acc, entry) => {
    const indexValue = entry.idx ?? entry.index ?? entry.id ?? entry.transaction_index;
    const idx = Number(indexValue);
    if (!Number.isInteger(idx) || idx < 0) return acc;
    const bucket = normalizeCategoryKey(entry.bucket || entry.category || entry.name || entry.id);
    if (bucket) {
      acc[idx] = bucket;
    }
    return acc;
  }, {});
};

const parseTransactionsWithLlm = async (statementText) => {
  const snippet = statementText.length > 18000 ? statementText.slice(0, 18000) : statementText;
  const payload = await callLlmProxy({ mode: "extract", statement: snippet });
  const rawContent = payload.content;
  if (!rawContent) {
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch (error) {
    parsed = sanitizeJsonOutput(rawContent);
  }

  return normalizeLlmTransactions(parsed);
};

const categorizeTransactionsWithLlm = async (transactions) => {
  if (!transactions.length) return {};
  const payload = await callLlmProxy({
    mode: "categorize",
    transactions: transactions.map((transaction) => ({
      description: transaction.description || transaction.merchant || "",
      amount: Number(transaction.amount || transaction.total || transaction.value || 0),
      date: transaction.date || "",
    })),
    categories: defaultCategories,
  });

  const rawContent = payload.content;
  if (!rawContent) {
    return {};
  }

  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch (error) {
    parsed = sanitizeJsonOutput(rawContent);
  }

  return normalizeLlmCategoryAssignments(parsed);
};

export default function Categories() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState(
    defaultCategories.reduce(
      (acc, item) => ({ ...acc, [item.id]: "" }),
      { notes: "" }
    )
  );
  const [status, setStatus] = useState({ type: "info", message: "" });
  const [importNote, setImportNote] = useState("");
  const [parsedTransactions, setParsedTransactions] = useState([]);

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
    setImportNote("");
  };

  const applyImportedTotals = (bucketTotals) => {
    setFormState((prev) => {
      const next = { ...prev };
      Object.entries(bucketTotals).forEach(([id, amount]) => {
        if (typeof amount === "number" && !Number.isNaN(amount)) {
          next[id] = amount.toString();
        }
      });
      return next;
    });
  };

  const handleJsonUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const totals = {};

      const accumulate = (key, value) => {
        const id = normalizeCategoryKey(key);
        if (!id) return;
        const amount = Number(value);
        if (Number.isNaN(amount)) return;
        totals[id] = (totals[id] || 0) + amount;
      };

      if (Array.isArray(parsed)) {
        parsed.forEach((entry) => {
          accumulate(entry.id || entry.category || entry.label, entry.amount || entry.value);
        });
      } else if (parsed.entries) {
        parsed.entries.forEach((entry) => {
          accumulate(entry.id || entry.category || entry.label, entry.amount);
        });
      } else {
        Object.entries(parsed).forEach(([key, value]) => {
          if (typeof value === "object" && value !== null) {
            accumulate(value.id || key, value.amount ?? value.value);
          } else {
            accumulate(key, value);
          }
        });
      }

      if (Object.keys(totals).length === 0) {
        throw new Error("No matching categories found in JSON.");
      }

      applyImportedTotals(totals);
      setParsedTransactions([]);
      setImportNote("JSON imported successfully. Review the values before saving.");
      event.target.value = "";
    } catch (error) {
      console.error("Unable to import JSON", error);
      setImportNote("Could not parse that JSON file. Make sure it contains category + amount pairs.");
      event.target.value = "";
      setParsedTransactions([]);
    }
  };

  const categorizeTransaction = (description) => {
    if (!description) return null;
    const normalized = description.toLowerCase();
    for (const [bucket, keywords] of Object.entries(keywordBuckets)) {
      if (keywords.some((keyword) => normalized.includes(keyword))) {
        return bucket;
      }
    }
    return null;
  };

  const resolveBucketForTransaction = (transaction) => {
    const fromCategory = normalizeCategoryKey(transaction.category);
    if (fromCategory) return fromCategory;
    const guessed = categorizeTransaction(transaction.description || transaction.merchant);
    if (guessed) return guessed;
    return "other";
  };

  const paymentKeywords = [
    "full balance",
    "directpay",
    "autopay",
    "auto pay",
    "payment thank you",
    "thank you payment",
    "credit payment",
    "bill payment",
    "statement payment",
    "balance transfer",
    "autopayment",
    "payment - thank you",
  ];

  const isPaymentTransaction = (description = "") => {
    const normalized = description.toLowerCase();
    return paymentKeywords.some((keyword) => normalized.includes(keyword));
  };

  const handleBillUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      console.log("[SpendWise] Starting bill upload parsing:", file.name);
      const result = await parseUploadedTransactions(file);
      console.log("[SpendWise] Parser result metadata:", {
        source: result.source,
        warning: result.warning,
        transactionCount: result.transactions.length,
      });
      const transactions = result.transactions;
      if (!transactions.length) {
        throw new Error("No transactions detected");
      }

      const decorated = transactions
        .map((tx) => ({
          ...tx,
          bucket: resolveBucketForTransaction(tx),
        }))
        .filter((tx) => !isPaymentTransaction(tx.description));

      const totals = {};
      decorated.forEach((tx) => {
        const amount = Math.abs(Number(tx.amount || tx.total || tx.value));
        if (Number.isNaN(amount) || amount === 0) return;
        totals[tx.bucket] = (totals[tx.bucket] || 0) + amount;
      });

      if (Object.keys(totals).length === 0) {
        throw new Error("No billable purchases detected after filtering payments.");
      }

      applyImportedTotals(totals);
      setParsedTransactions(
        decorated.map((tx, index) => ({
          id: `${tx.description || "transaction"}-${index}`,
          date: tx.date || "",
          description: tx.description || tx.merchant || "Unlabeled transaction",
          amount: Number(tx.amount || tx.total || tx.value),
          bucket: tx.bucket,
        }))
      );
      if (result.source === "llm") {
        setImportNote("PDF statement parsed and categorized with your LLM. Totals auto-filled below.");
      } else if (result.source === "pdf-no-llm") {
        setImportNote("PDF parsed with fallback rules. Add your LLM API key for richer extraction.");
      } else if (result.source === "fallback" && result.warning) {
        setImportNote(
          `Used fallback parser after LLM error (${result.warning}). Numbers are ready to review.`
      );
      } else {
        setImportNote("Credit card bill parsed. Numbers are ready to review.");
      }
      event.target.value = "";
    } catch (error) {
      console.error("Unable to parse bill", error);
      setImportNote("Could not recognize that statement. Try a CSV, JSON, or PDF export from your bank.");
      event.target.value = "";
      setParsedTransactions([]);
    }
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

      <section className="page-card import-panel">
        <div>
          <p className="eyebrow">Smart imports</p>
          <h2>Skip typing entirely.</h2>
          <p>Drop CSV/JSON exports from your budgeting app or credit card.</p>
        </div>
        <div className="import-actions">
          <label className="import-card">
            <span>Upload spending JSON</span>
            <small>Keys like "groceries": 220 will auto-fill the form.</small>
            <input type="file" accept="application/json" onChange={handleJsonUpload} />
          </label>
          <label className="import-card">
            <span>Upload credit card bill</span>
            <small>CSV, JSON, or PDF statements with descriptions + amounts supported.</small>
            <input
              type="file"
              accept=".csv,.json,.txt,.pdf,application/pdf"
              onChange={handleBillUpload}
            />
          </label>
          {importNote && <p className="import-note">{importNote}</p>}
        </div>
      </section>

      {parsedTransactions.length > 0 && (
        <section className="page-card statement-panel">
          <div>
            <p className="eyebrow">Statement breakdown</p>
            <h2>Every line item from your bill.</h2>
            <p>Anything we cannot classify automatically falls under “Other” for you to review.</p>
          </div>
          <div className="statement-table" aria-live="polite">
            <table>
              <caption className="sr-only">Parsed credit card transactions</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Description</th>
                  <th scope="col">Bucket</th>
                  <th scope="col">Amount</th>
                </tr>
              </thead>
              <tbody>
                {parsedTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td data-label="Date">{transaction.date || "—"}</td>
                    <td data-label="Description" className="description-cell">
                      {transaction.description}
                    </td>
                    <td data-label="Bucket">{categoryLabelMap[transaction.bucket] || "Other"}</td>
                    <td data-label="Amount">
                      {currencyFormatter.format(Number(transaction.amount || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
