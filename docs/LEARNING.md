# Aralite — How It Works (Learning & Interview Prep)

Plain-language guide to everything in this project. Written for a fresh grad: if AI helped build parts you don't fully understand yet, start here. README tells you *how to run* Aralite; this tells you *how it works*.

---

## 1. Big picture

Aralite is a website that shows Philippine school enrollment data as charts. You give it a messy government Excel file (60,000 schools); it cleans that file, stores it in a fast format, and draws a dashboard anyone can explore — filtering from region down to a single barangay, reading auto-generated insights, or asking questions in plain English. The clever part: the "database" answering the chart questions runs *inside the browser*. No server, no monthly database cost.

---

## 2. The tools we used (and why)

**React** — builds the screen from small reusable pieces called *components*. Industry standard.

**TypeScript** — JavaScript with type-checking; catches mistakes before you run the code.

**Vite** — runs the app in development and bundles it for the web. Very fast.

**React Router** — gives the app two pages with real URLs: `/` (dashboard) and `/admin` (data management).

**Recharts** — turns arrays of numbers into charts.

**DuckDB-WASM** — the star. DuckDB is a real SQL analytics database; *WASM* means it runs inside the browser. So the browser runs SQL over millions of rows — no server. Removes cost/limits and keeps uploaded data private.

**Parquet** — a compressed, columnar table format. Smaller and faster than Excel/CSV. Our 30MB Excel becomes a few MB.

**Python + pandas** — used once, up front, to clean the raw file and export Parquet. Cleaning is clearer in pandas.

**Groq / Gemini (BYOK)** — optional AI for the "Ask the data" feature. BYOK = bring your own key; the key stays in the browser.

**Vitest** — the test runner. Reuses Vite, so little setup.

**GitHub Actions** — runs checks automatically on every push (CI).

**Vercel** — free hosting; redeploys automatically when you push.

---

## 3. How the pieces connect

Two "lanes." One runs once (cleaning). The other runs every visit (dashboard).

```
CLEANING LANE (once, on your computer)
  raw.xlsx ──► pipeline/clean.py (pandas) ──► schools.parquet
                                          └─► enrollment.parquet

DASHBOARD LANE (in the browser)
  Parquet ──► DuckDB-WASM ──► SQL queries ──► React components ──► charts
```

Rule we follow: **the UI never touches the database directly.**

```
Component (chart) → queries.ts (SQL) → db.ts (DuckDB) → data
```

Each layer only knows the one below it. Keeps code tidy and easy to change.

---

## 4. Folder structure — what lives where

```
pipeline/clean.py     One-time Python cleaner. Fixes text, reshapes, exports Parquet.
data/                 Raw Excel + cleaned Parquet.
public/data/          Parquet files served to the browser.
src/App.tsx           Router: sends you to the dashboard or admin page.
src/pages/            DashboardPage (view-only) + AdminPage (data management).
src/components/        Charts, stat cards, filter bar, upload, ask — one file each.
src/lib/db.ts         Boots DuckDB, loads Parquet, reshapes uploaded files.
src/lib/queries.ts    Every SQL query. Nothing else writes SQL.
src/lib/insights.ts   Turns numbers into plain-language findings.
src/lib/cleaning.ts   Browser cleaning rules (has tests next to it).
src/lib/ai.ts         Plain English → SQL, with a read-only safety gate.
src/lib/filters.ts    Shared location-filter logic used everywhere.
src/constants/theme.ts  Colors and style tokens.
```

---

## 5. Key concepts you'll be asked about

**Component** — a reusable piece of UI.

**State** — data a component remembers that can change (React's `useState`). When it changes, the screen updates.

**Props** — values passed *into* a component from its parent (we pass `filters` down to every chart).

**Hook** — a `use...` function adding behavior. `useEffect` runs code when the component loads or when something changes.

**SQL** — the language for asking questions of a database.

**Wide vs long data** — *Wide*: one row per school with 58 enrollment columns. *Long*: one row per school-grade-gender. Charts/SQL prefer long. Turning wide into long is *reshaping* (melting).

**Aggregation** — summarizing many rows into totals/counts per group. Most charts are aggregations.

**Columnar format (Parquet)** — stores data by column, making "sum this column over millions of rows" fast.

**Client-side routing** — React Router changes the page without reloading. A `vercel.json` rewrite makes refreshes work on the live site.

---

## 6. Error handling

Planning for things that go wrong so the app doesn't crash. Every data call has four states: **loading, empty, error, normal** — each chart handles all four (a single spinner covers loading; an error message if a query fails). Uploads and AI calls are wrapped in `try/catch` so a bad file or wrong key shows a friendly message instead of breaking the page.

---

## 7. Testing

**Why:** prove the code works and catch breakage when you change things.

**Unit tests** — check one small piece in isolation. We test `cleaning.ts` (pure functions — easy and high-value): mojibake repair, junk stripping, invalid-value labeling, name standardization, zero-data-loss, CSV quoting.

**Run:** `npm test` (Vitest). Tests live next to the code as `*.test.ts`.

**Mocking** — replacing a real dependency with a fake during a test. Our cleaning tests need no mocks because the functions are pure (input in, output out).

---

## 8. CI/CD

**CI (Continuous Integration)** — a robot (GitHub Actions) checks your code on every push: lint → build (type-check) → test. If anything fails, the commit goes red so you catch it early. Config: `.github/workflows/ci.yml`.

**CD (Continuous Deployment)** — Vercel watches `main` and redeploys automatically. Push → CI checks → Vercel deploys.

---

## 9. Git basics

- `git add .` — stage changes
- `git commit -m "message"` — save a snapshot
- `git push` — upload to GitHub

**Message style:** `type(scope): description` (e.g. `feat(admin): add data management page`). Types: `feat`, `fix`, `docs`, `test`, `chore`, `style`.

**One repo per project.**

---

## 10. Security basics

- **Environment variables (`.env`)** — file for secrets, never committed (listed in `.gitignore`).
- **BYOK** — the AI feature uses *your* API key, kept in the browser and never stored or sent to a server.
- **Read-only AI SQL** — generated SQL is checked to be a plain SELECT; anything that could change data (DELETE, DROP…) is blocked before running.
- **Privacy by design** — DuckDB runs in the browser, so uploaded files never travel to a server.

---

## 11. "Tell me about this project" — interview answer

> Aralite is a data dashboard for Philippine school enrollment — about 60,000 schools and 27 million learners. I built a Python/pandas pipeline to clean the raw DepEd file: fixing character-encoding problems, stripping junk characters, labeling invalid placeholder values, and standardizing school names and addresses into new columns without deleting any data. I exported to Parquet, a compressed columnar format.
>
> The app is React and TypeScript, but the key choice is the data engine: DuckDB-WASM, which runs a real SQL database inside the browser. That makes it serverless — nothing to pay for or maintain — and when users upload their own dataset, their file never leaves their computer, so it's private by default. DuckDB reshapes uploads from wide to long format using SQL, so millions of rows process in the browser without crashing it.
>
> On top I added five-level location filters that drive the whole dashboard, auto-calculated insights, and an "ask the data" feature where a user's own AI key turns plain-English questions into read-only SQL. It's split into a public dashboard and an admin page using React Router, has unit tests with Vitest, and runs lint/build/test in GitHub Actions on every push. It's deployed on Vercel.
>
> It started as a class activity, but I rebuilt it from scratch to learn the data-engineering side properly.

Honest notes if asked: self-learning project; AI helped with parts I then studied (this doc is the proof); real public DepEd dataset; not affiliated with DepEd.

---

## 12. Glossary

| Term | Plain meaning |
|---|---|
| Component | A reusable piece of UI |
| State | Data a component remembers and can change |
| Props | Values passed into a component |
| Hook | A `use...` function that adds React behavior |
| SQL | Language for asking questions of a database |
| DuckDB-WASM | A SQL database that runs in the browser |
| Parquet | Compressed, columnar table file format |
| Wide/Long | Two shapes of table data; charts prefer long |
| Reshaping (melt) | Turning wide data into long |
| Aggregation | Summarizing rows into totals/counts per group |
| BYOK | Bring your own (AI) key; stays in the browser |
| Routing | Switching pages without reloading |
| Mocking | Using a fake dependency in a test |
| CI/CD | Robots that check and deploy your code |
| `.env` | File holding secrets, never committed |