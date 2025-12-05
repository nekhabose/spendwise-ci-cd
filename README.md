# SpendWise Collective

SpendWise is a React + Vite single-page application that walks residents through a narrated budgeting journey:

1. **Landing / storytelling** – a semantic, content-rich landing page that explains the mission.
2. **Categories workflow** – capture spending categories with contextual prompts and narration.
3. **Summary** – generate insights with totals, averages, and persisted notes.
4. **Community story** – filter and search JSON-backed initiatives with a published schema.

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

## Data, storytelling, and filtering

- `src/pages/Home.jsx` contains the landing narration, hero metrics, and story beats.
- `src/pages/Community.jsx` reads from `src/data/communityProjects.json` and exposes filters for search, focus area, and city.
- A JSON schema (`src/data/communityProjects.schema.json`) documents the data structure used in the app and by external dashboards.
- `localStorage` persists the budgeting workflow so users can refresh and still see their summary.

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
