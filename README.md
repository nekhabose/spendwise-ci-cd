# SpendWise Collective

SpendWise is a React + Vite single-page application that walks residents through a narrated budgeting journey:

1. **Landing / storytelling** – a semantic, content-rich landing page that explains the mission.
2. **Categories workflow** – capture spending categories with contextual prompts and narration.
3. **Summary + dashboard** – generate insights, visualize category bars, and get instant AI-style advice.
4. **Community story** – filter and search JSON-backed initiatives for inspiration.

The UI is designed with a professional green-on-white gradient system, subtle depth, and accessible typography. Routing is handled by React Router so navigation feels like a guided studio visit.

## Getting started

```bash
npm install
npm run dev
```

Vite will print a local development URL (default `http://localhost:5173`). The root `package.json` now powers the entire repo—previous duplicate HTML files were removed.

## Available scripts

| Script           | Purpose                                              |
| ---------------- | ---------------------------------------------------- |
| `npm run dev`    | Start the Vite dev server with hot reloading.        |
| `npm run build`  | Create an optimized production build in `dist/`.     |
| `npm run preview`| Preview the production build locally.                |
| `npm run lint`   | Run ESLint using the shared config (`eslint.config`).|

### LLM-powered PDF parsing

PDF credit card statements are now parsed by a two-step Groq Llama 3.3 pipeline: the first call extracts raw line items (date, description, amount) while the second call maps those transactions onto the SpendWise categories. Payment-only rows such as “DirectPay Full Balance” are automatically filtered so totals only include real purchases. Supply your own API key or swap the model/base URL through Vite env variables:

```
cp .env.example .env
# Then edit .env:
VITE_OPENAI_API_KEY=groq_api_key
VITE_OPENAI_MODEL=llama-3.3-70b-versatile
VITE_OPENAI_BASE_URL=https://api.groq.com/openai/v1
```

The API key lives in your browser session, so only use this workflow during local development or behind your own proxy. CSV/JSON uploads continue to use the built-in heuristic parser if you prefer to avoid an API call.

## Data, storytelling, and automation

- `src/pages/Home.jsx` contains the landing narration, hero metrics, and story beats.
- `src/pages/Categories.jsx` now supports manual entry, JSON imports, CSV parsing, and LLM-powered (Groq Llama 3.3 by default) PDF statement understanding with a full statement breakdown table so users can skip manual typing.
- `src/pages/Summary.jsx` calculates totals, renders a detailed dashboard, and surfaces LLM-style guidance (rule-based hints).
- `src/pages/Community.jsx` reads from `src/data/communityProjects.json` and exposes filters for search, focus area, and city, keeping the storytelling theme alive.
- `localStorage` persists the budgeting workflow so users can refresh and still see their summary.

### Automation & intelligence

- **JSON ingestion**: upload files shaped like `{ "groceries": 120 }` or `[{"category": "rent", "amount": 900}]` to auto-fill the categories form.
- **Credit card parsing**: drop CSV or JSON exports of your transactions—or upload a PDF, which now routes through Groq Llama 3.3 (extraction + categorization) to interpret messy tables—then the parser groups spend by keywords (groceries, rent, mobility, care, joy, other) and removes payment-only rows automatically.
- **Dashboard & guidance**: the summary view plots each category and generates LLM-style feedback (powered by heuristics) highlighting imbalances or gaps.

## Deployment (GitHub Actions → Netlify)

`.github/workflows/deploy.yml` builds the React app on every push to `main` (or manual dispatch) using Node 20, runs `npm ci`, `npm run build`, and then deploys the `/dist` folder via `nwtgck/actions-netlify@v3`.

To make the workflow succeed you must configure three repository secrets in GitHub:

- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`
- (Optional) `GITHUB_TOKEN` is supplied automatically.

## Tech stack

- React 19 + React Router 7
- Vite build tooling
- CSS (custom design system, no external UI kit)
- Netlify for hosting

## Housekeeping

- Node modules and build artifacts are ignored via the root `.gitignore`.
- Run `npm install` after pulling changes to update `package-lock.json` with the `react-router-dom` dependency if it has not been regenerated automatically.

Feel free to extend the data story, add authentication, or wire the summary output into Netlify Functions for exporting PDFs. The current foundation satisfies the CI/CD + storytelling requirements in the brief.
