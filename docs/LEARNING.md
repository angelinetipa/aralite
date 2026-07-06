# Aralite — How It Works (Learning & Interview Prep)

A plain-language guide to everything in this project. Written for a fresh grad: if you built parts with AI help and don't fully understand them yet, start here. README tells you *how to run* Aralite; this tells you *how it works*.

---

## 1. Big picture

Aralite is a website that shows Philippine school enrollment data as charts. You give it a messy government Excel file with 60,000 schools; it cleans that file, stores it in a fast format, and draws a dashboard anyone can explore. The clever part: the "database" that answers the chart questions runs *inside the web browser* — there's no server and no monthly database cost.

---

## 2. The tools we used (and why)

**React** — a library for building website screens out of small reusable pieces called *components*. We chose it because it's the industry standard and lets us split the dashboard into clean parts (each chart is its own component).

**TypeScript** — JavaScript with type-checking. It catches mistakes *before* you run the code (like passing text where a number belongs). Chosen because it prevents whole classes of bugs and is expected in most jobs.

**Vite** — the tool that runs the app while you develop and bundles it for the web. Chosen because it's very fast and the modern default.

**Recharts** — a React charting library. It turns arrays of numbers into line and bar charts. Chosen because it's simple and looks clean.

**DuckDB-WASM** — this is the star. DuckDB is a real SQL database built for analytics. *WASM* means it's compiled to run inside a browser. So the browser itself can run SQL queries over millions of rows — no server needed. Chosen because it removes server costs and limits, keeps uploaded data private, and shows a modern data-engineering skill.

**Parquet** — a file format for tables that is compressed and *columnar* (stores each column together). It's much smaller and faster to read than Excel or CSV. Our 30MB Excel becomes a few MB. Chosen because it's the standard hand-off format in data work.

**Python + pandas** — pandas is the go-to Python tool for cleaning and reshaping tables. We use it once, up front, to clean the raw DepEd file and export Parquet. Chosen because cleaning is easier and clearer in pandas than in the browser.

**Vercel** — free hosting for websites. It rebuilds and redeploys automatically when you push to GitHub. Chosen because it's free, fast, and made for this kind of app.

---

## 3. How the pieces connect

There are two "lanes." One happens once (cleaning). The other happens every time someone opens the site (dashboard).

```
CLEANING LANE (run once, on your computer)
  raw.xlsx  ──►  pipeline/clean.py (pandas)  ──►  schools.parquet
                                              └─►  enrollment.parquet

DASHBOARD LANE (in the browser, every visit)
  Parquet files ──► DuckDB-WASM ──► SQL queries ──► React components ──► charts
```

Rule we follow: **the UI never touches the database directly.** A chart calls a function in `queries.ts`, that function runs SQL through `db.ts`, and only `db.ts` talks to DuckDB. Each layer only knows the one below it. This keeps the code tidy and easy to change.

```
Component (chart)  →  queries.ts (SQL)  →  db.ts (DuckDB)  →  data
```

---

## 4. Folder structure — what lives where

```
pipeline/clean.py     The one-time Python cleaner. Fixes text, reshapes, exports Parquet.
data/                 Raw Excel + cleaned Parquet (the "master" copies).
public/data/          The Parquet files the browser is actually served.
src/App.tsx           The page shell: header, region filter, and layout of sections.
src/components/        One file per dashboard section + shared UI (Card, Spinner).
src/lib/db.ts         Boots DuckDB, loads Parquet, reshapes uploaded files.
src/lib/queries.ts    Every SQL query. Nothing else writes SQL.
src/lib/cleaning.ts   The browser cleaning rules (for user uploads).
src/constants/theme.ts  Colors and style tokens in one place.
docs/LEARNING.md      This file.
```

Why separate files? So each piece is easy to find, understand, and fix — and so it reads like professional code, not one giant file.

---

## 5. Key concepts you'll be asked about

**Component** — a reusable piece of UI. `DropoffSection` is a component that draws one chart.

**State** — data a component remembers that can change over time (React's `useState`). Example: which region is selected. When state changes, the screen updates automatically.

**Props** — values passed *into* a component from its parent. We pass the chosen `region` down to each chart as a prop.

**Hook** — a React function starting with `use` (like `useState`, `useEffect`) that adds behavior to a component. `useEffect` runs code when the component loads or when something changes.

**SQL** — the language for asking questions of a database. Example: `SELECT grade, SUM(enrollment) FROM enrollment GROUP BY grade` = "total learners per grade."

**Wide vs long data** — *Wide*: one row per school with 58 enrollment columns. *Long*: one row per school-grade-gender combination. Charts and SQL prefer long. Turning wide into long is called *reshaping* (or "melting").

**Aggregation** — combining many rows into a summary, like a sum or count per group. Most charts are aggregations.

**Columnar format (Parquet)** — stores data by column instead of by row, which makes "sum this one column across millions of rows" very fast.

---

## 6. Error handling

Error handling means planning for things that can go wrong so the app doesn't crash or freeze. Every data call in Aralite can be in one of four states: **loading, empty, error, or normal**. Each chart handles all four — it shows nothing while loading (a single spinner covers the page), an error message if the query fails, and the chart when data arrives. Uploads are wrapped in `try/catch` so a bad file shows a friendly message instead of breaking the page. This matters because real users upload weird files and networks fail; good apps expect that.

---

## 7. Testing

**Why test:** to prove the code works and to catch breakage when you change things later.

**Unit tests** — check one small piece in isolation (e.g. "does the cleaning function fix a broken character?").

**Mocking** — replacing a real dependency with a fake one during a test. Example: instead of running a real database, you feed the function fake rows. This makes tests fast and focused on *your* logic, not the database.

For Aralite, the highest-value tests are on `cleaning.ts` (pure functions — easy to test) and the column-parsing logic that splits `"G11 ACAD STEM Male"` into grade/strand/gender.

---

## 8. CI/CD

**CI (Continuous Integration)** — a robot that automatically checks your code every time you push to GitHub. Ours runs lint (style check) and the build (type-check). If something's broken, you find out immediately, not after deploying.

**CD (Continuous Deployment)** — automatic publishing. Vercel watches the `main` branch; every push rebuilds and redeploys the live site. You never upload files by hand.

Together: push code → CI checks it → Vercel deploys it. Fast and safe.

---

## 9. Git basics

**Git** tracks every change to your code so you can undo, compare, and collaborate.

- `git add .` — stage your changes (mark them to save)
- `git commit -m "message"` — save a snapshot with a description
- `git push` — upload snapshots to GitHub

**Commit message style** we use: `type(scope): description`, e.g. `feat(dashboard): add region filter`. Types: `feat` (new feature), `fix` (bug fix), `docs` (documentation), `style` (formatting).

**One repo per project** — Aralite is its own repository, separate from other projects.

---

## 10. Security basics

- **Environment variables (`.env`)** — a file for secret values (API keys, passwords) that you never commit to GitHub. Aralite currently needs none, but the pattern matters: secrets go in `.env`, and `.env` is listed in `.gitignore` so Git ignores it.
- **Why it matters** — committing a secret to a public repo means anyone can steal it.
- **Privacy by design** — because DuckDB runs in the browser, uploaded files never travel to a server. That's a security win: there's no server to leak them.

---

## 11. "Tell me about this project" — interview answer

> Aralite is a data dashboard for Philippine school enrollment. I took the Department of Education's raw file — about 60,000 schools and 27 million learners — and built a pipeline in Python and pandas to clean it: fixing character-encoding problems, standardizing text, and handling missing values without deleting any data. I exported it to Parquet, a compressed columnar format.
>
> The dashboard is React and TypeScript, but the interesting choice is the data engine: I used DuckDB-WASM, which runs a real SQL database inside the browser. That means the whole app is serverless — no database to pay for or maintain — and when users upload their own dataset, their file never leaves their computer, so it's private by default. DuckDB reshapes their upload from wide to long format using SQL, so millions of rows are processed in the browser without crashing it.
>
> I kept the architecture layered — components call a query layer, which calls the database layer, and only that layer touches DuckDB. It's deployed on Vercel with automatic deploys from GitHub. It started as a class activity, but I rebuilt it from scratch to actually learn the data-engineering side.

Honest notes to add if asked: it's a self-learning project; AI helped with parts I then studied (that's what this doc is for); the dataset is a real DepEd public file.

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
| pandas | Python library for cleaning/reshaping tables |
| CI/CD | Robots that check and deploy your code |
| Mocking | Using a fake dependency in a test |
| `.env` | File holding secrets, never committed |