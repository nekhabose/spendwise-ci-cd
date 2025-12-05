# SpendWise Collective

## Project overview

SpendWise is a guided budgeting studio for households. The landing page introduces the idea in plain language, then routes visitors into categories, summaries, and storytelling sections that feel cohesive rather than disconnected screens. Users can:

1. **Understand the mission** — a semantic, content-rich landing page sets the tone.
2. **Collect spending data** — upload credit-card PDFs or key in values, then review every line item in a structured table.
3. **Summarize & reflect** — the summary dashboard highlights totals, trends, and next steps.
4. **Browse community wins** — JSON-backed projects show how neighbors stretch their budgets.

The UI uses a professional green-on-white gradient palette with generous spacing and typography that stays readable on any device. React Router keeps navigation smooth so each section feels like part of the same story instead of isolated views.

## Technologies used

- **Framework:** React 19 with Vite for a fast dev loop and lean production bundles.
- **Routing:** React Router 7 for page-to-page navigation.
- **Styling:** Hand-crafted CSS (no heavy UI kits) for consistent gradients, buttons, and cards.
- **PDF intelligence:** A Groq-hosted Llama 3.3 model called through a Netlify/server proxy.
- **Build & deploy:** GitHub Actions build the app and trigger Netlify deployments.
- **State & storage:** Local component state plus `localStorage` persistence for in-progress budgets.

## Link
https://spendwize-fintech.netlify.app/



### LLM-powered PDF parsing

PDF credit card statements are now parsed by a two-step Groq Llama 3.3 pipeline: the first call extracts raw line items (date, description, amount) while the second call maps those transactions onto the SpendWise categories. Payment-only rows such as “DirectPay Full Balance” are automatically filtered so totals only include real purchases. Supply your own API key or swap the model/base URL through environment variables consumed by both the local proxy and the Netlify function:


## Data, storytelling, and automation

- `src/pages/Home.jsx` contains the landing narration, hero metrics, and story beats.
- `src/pages/Categories.jsx` now supports manual entry, JSON imports, CSV parsing, and LLM-powered (Groq Llama 3.3 by default) PDF statement understanding with a full statement breakdown table so users can skip manual typing.
- `netlify/functions/llm-proxy.js` keeps the Groq API key server-side and exposes a simple POST endpoint used by the client when parsing/categorizing PDFs.
- `src/pages/Summary.jsx` calculates totals, renders a detailed dashboard, and surfaces LLM-style guidance (rule-based hints).
- `src/pages/Community.jsx` reads from `src/data/communityProjects.json` and exposes filters for search, focus area, and city, keeping the storytelling theme alive.
- `localStorage` persists the budgeting workflow so users can refresh and still see their summary.

### Automation & intelligence

- **JSON ingestion**: upload files shaped like `{ "groceries": 120 }` or `[{"category": "rent", "amount": 900}]` to auto-fill the categories form.
- **Credit card parsing**: drop CSV or JSON exports of your transactions—or upload a PDF, which now routes through Groq Llama 3.3 (extraction + categorization) to interpret messy tables—then the parser groups spend by keywords (groceries, rent, mobility, care, joy, other) and removes payment-only rows automatically.
- **Dashboard & guidance**: the summary view plots each category and generates LLM-style feedback (powered by heuristics) highlighting imbalances or gaps.


## Tech stack

- React 19 + React Router 7
- Vite build tooling
- CSS (custom design system, no external UI kit)
- Netlify for hosting
- Groq API (proxied) for PDF interpretation

## Lessons learned

- **Grounding AI output** — raw LLM responses were noisy until we split the workflow into extraction and categorization prompts, filtered zero-value rows, and logged each proxy step. Detailed console logs sped up debugging both locally and on Netlify.
- **Client secrets stay server-side** — building a lightweight proxy (Node locally, Netlify Functions remotely) prevented leaks that previously tripped Netlify’s secret scanner.
- **UI polish matters** — aligning every button style, simplifying copy, and removing AI jargon made the experience feel trustworthy. Small details like rounding category amounts or disabling calendar pickers had outsized impact.
- **Local-first persistence** — saving to `localStorage` means testers can refresh without losing LLM output, which is essential when tweaking prompts or styling.

## Future scope

- **Automated tests & audits** — add Vitest/RTL coverage plus accessibility and performance checks (axe, Lighthouse) to fully satisfy the “best practices” mandate.
- **Data export** — generate CSV or PDF summaries so residents can share their budget snapshot.
- **Account sync** — connect banks or budgeting apps to refresh data automatically instead of manual uploads.
- **Collaboration** — invite partners or roommates to co-edit the same month’s plan, backed by a lightweight backend store.

