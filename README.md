# Aralite 📊

**In-browser SQL analytics for Philippine school enrollment — no server, no database bill.**

Aralite turns the Department of Education's raw enrollment file (60,167 schools, 27M learners) into a clean, filterable dashboard. It runs a real SQL database *inside the browser*, so anyone can explore the data — drill from region down to a single barangay, or ask questions in plain English.

It also makes one argument, and everything on the page is arranged to support it:

> **The average senior high school runs 2.52 of the 8 tracks and strands on offer.** A learner in BARMM is roughly **6× more likely** than one in Region IV-A to attend a school running only one — so senior-high enrollment reflects what schools offer as much as what learners want.

The full working is in [`analysis/strand-availability/`](analysis/strand-availability/) — notebook, reproducible script, and a writeup that states what the data cannot prove.

[![CI](https://github.com/angelinetipa/aralite/actions/workflows/ci.yml/badge.svg)](https://github.com/angelinetipa/aralite/actions/workflows/ci.yml)

**Live:** [aralite.vercel.app](https://aralite.vercel.app)

![Aralite dashboard](docs/screenshot.jpeg)

## What it is

This started as a university case study in a Big Data course. The scenario: DepEd's Learner Information System collects enrollment data, but there is no dashboard on top of it — other offices have to request figures by hand, one at a time. The exercise was to design something planners could actually use.

I rebuilt it from scratch afterwards as an independent project, because the class version ran on a laptop and I wanted to learn what it takes to ship something a stranger can open.

If you want to know how any piece works, [`docs/LEARNING.md`](docs/LEARNING.md) explains every tool and decision in plain language.

## How to try it

Open the [live link](https://aralite.vercel.app). No login, no setup — the cleaned data ships with the app.

Try this: pick a region in the filter bar, then narrow to a province. Every chart, stat, and finding updates together. Then scroll to **Ask the data** and type a question in plain English — that one needs your own Groq or Gemini key, and the generated SQL is shown before it runs.

The dashboard takes a moment on first load while the SQL engine boots in your browser. The intro panel renders first on purpose, so there is something to read while it starts.

## Features

- **The finding first** — the dashboard opens with the claim stated in one sentence, benchmarked against the national figure, with its caveat attached. Filter to any region and it rewrites itself.
- **Evidence, then context** — two charts support the finding directly. Six more describing the dataset sit behind a toggle, closed by default, so the page reads as an argument rather than a wall.
- **Every scoped number carries its national equivalent.** A figure with nothing to compare it against is not a finding.
- **One filter for everything** — five cascading levels (Region → Province → Division → Municipality → Barangay) plus school search, in a single bar, driving every chart, stat, and school result at once.
- **Key findings** — plain-language insights calculated from the data, updating with the filter.
- **Ask the data** — type a question in plain English; your own AI key (Groq or Gemini) writes the SQL, which runs read-only in the browser. The SQL is shown for trust.
- **Admin page** — a separate `/admin` area to upload, clean, publish, and remove datasets.
- **Clean any dataset** — upload a CSV or Excel file; it is cleaned in your browser (encoding, junk characters, invalid values, name and address standardization) and downloadable. Nothing leaves your computer.
- **Stated limits in the product** — an "About this data" panel names the source, grain, and what the data cannot answer, so no one draws a conclusion it does not support.

## Data and method

**Source:** DepEd Learner Information System, school-level enrollment, SY 2023–2024 (as of 31 January 2024). Public data, downloaded as an Excel file.

**Shape:** 60,167 rows — one per school — with 14 descriptive columns and 58 enrollment columns. Reshaped into roughly 3.5 million rows, one per school × grade × gender.

**The governing rule was zero data loss.** The cleaning script never deletes a row or a column. It repairs values in place and adds standardized copies alongside the originals, so every published number can be traced back to the source file.

What `pipeline/clean.py` does:

| Step | What and why |
|---|---|
| Find the real header | The file opens with four rows of title text, so the actual column names sit on row 5. |
| Repair mojibake | `Ñ` saved as UTF-8 but read as Latin-1 arrives as `Ã‘`. The bad decode is reversed, not stripped — deleting would corrupt school names. |
| Strip leading junk | Stray `-`, `#`, `*`, `.` and quote marks from data entry break sorting and search. |
| Squeeze whitespace | Without this, `Bacarra  I` and `Bacarra I` group as two different divisions. |
| Standardize casing | Geographic columns arrive in all caps. Filters and joins are case-sensitive, so inconsistent casing splits real groups. School names keep their official casing. |
| Label invalid values | Placeholder entries like `N/A` and `NONE` are marked rather than silently dropped. |
| Add clean copies | Standardized school name and street address are added as new columns beside the originals. |
| **Validate, don't repair** | School IDs are asserted unique, enrollment values are parsed with errors raised rather than coerced, and negatives are asserted away. The script **stops** on a structural problem instead of quietly producing a wrong number. |
| Derive total enrollment | The raw file has no total column, so the 58 grade columns are summed into one. |
| Reshape wide to long | 58 enrollment columns become rows, each parsed into grade, strand, and gender. |
| Export with proof | Parquet files, plus `quality_report.md` recording every repair count, rows in versus out, and the total enrollment sum. |

The quality report is the point of the whole script. Anyone can claim they cleaned data; the report shows exactly what changed and proves nothing was lost.

## Tech stack

| Part | What I use |
|---|---|
| Frontend | React, TypeScript, Vite, React Router |
| Charts | Recharts |
| Data engine | DuckDB-WASM (real SQL in the browser) |
| Storage format | Parquet |
| Cleaning pipeline | Python, pandas |
| AI (optional) | Groq or Gemini, bring-your-own-key |
| Testing and CI | Vitest, GitHub Actions |
| Hosting | Vercel |

## How it works

### Two lanes

One runs once on my computer. The other runs every time someone opens the site.

```
CLEANING LANE (once, offline)
  raw.xlsx ──► pipeline/clean.py (pandas) ──► schools.parquet
                                          └─► enrollment.parquet
                                          └─► quality_report.md

DASHBOARD LANE (in the browser)
  Parquet ──► DuckDB-WASM ──► SQL ──► React components ──► charts
```

### Design decisions

**The UI never touches the database directly.** Every chart follows the same path: component → `queries.ts` → `db.ts` → data. Each layer only knows the one below it, so a SQL change never requires opening a chart file, and a chart redesign never risks breaking a query.

**Parquet plus DuckDB-WASM instead of a hosted database.** A 30MB Excel file becomes a few MB of compressed columnar data, and DuckDB runs real SQL over it inside the browser. No server means nothing to pay for or maintain — and when someone uploads their own file, it never leaves their computer. The trade-off is a slower first load while the engine downloads.

**Uploaded and shipped data look identical to the charts.** Both feed the same `schools` and `enrollment` views, so a chart never needs to know which source it is reading.

**Limits are stated in the product, not just the README.** The "About this data" panel names the source, the grain, and three things the data cannot answer. Numbers without their caveats are how a dashboard misleads people who trust it.

### Three performance fixes worth knowing

Each of these came from something that actually broke.

| Problem | Fix |
|---|---|
| Many charts loading at once each started their own DuckDB worker, freezing the browser | Cache the boot **promise**, not the instance, so every caller awaits the same boot |
| Browsers block loading a Worker straight from a CDN (CORS) | Wrap the CDN URL in a local blob so it counts as same-origin |
| A view recalculating a 58-column sum over 60,000 rows on every chart query | Materialize it as a table once at upload time instead |

## Project structure

```
aralite/
├── pipeline/clean.py           # one-time Python cleaner (raw Excel → Parquet)
├── data/                       # raw Excel + cleaned Parquet + quality_report.md
├── public/data/                # the Parquet files actually served to the browser
├── src/
│   ├── App.tsx                 # router — / dashboard, /admin data management
│   ├── pages/
│   │   ├── DashboardPage.tsx   # public view, composes every section
│   │   └── AdminPage.tsx       # upload, clean, publish, remove datasets
│   ├── components/             # StorySection (the finding), AvailabilitySection
│   │                           # (the evidence), FilterBar, SchoolPanel, StatCards,
│   │                           # InsightsSection, chart sections, AskSection,
│   │                           # DataNote, NavHeader, IntroPanel, Spinner
│   ├── lib/
│   │   ├── db.ts               # DuckDB setup + upload reshaping
│   │   ├── queries.ts          # all SQL lives here — describes the dataset
│   │   ├── story.ts            # the finding layer — every figure paired with national
│   │   ├── metrics.ts          # pure calculations, no SQL and no React
│   │   ├── metrics.test.ts     # 15 tests asserting real DepEd numbers
│   │   ├── insights.ts         # auto-calculated findings
│   │   ├── format.ts           # one adaptive number formatter for every axis
│   │   ├── cleaning.ts         # browser cleaning rules
│   │   ├── cleaning.test.ts    # unit tests for those rules
│   │   ├── ai.ts               # natural language → SQL (BYOK)
│   │   └── filters.ts          # shared location-filter logic
│   └── constants/theme.ts      # colors + design tokens
├── analysis/strand-availability/   # the finding: notebook, script, charts, writeup
├── docs/LEARNING.md            # plain-language walkthrough of the whole project
├── docs/WALKTHROUGH.md         # every file explained, with the question it answers
└── .github/workflows/ci.yml    # lint + type-check + test on push to main and every PR
```

## Run it locally

### 1. Install what you need

- **Node.js v20 or newer** — [nodejs.org](https://nodejs.org). Vite 8 and Vitest 4 will not run on Node 18.
- **Git** — [git-scm.com](https://git-scm.com)

### 2. Get the code and start it

```bash
git clone https://github.com/angelinetipa/aralite.git
cd aralite
npm install
npm run dev
```

Open the printed link, usually `http://localhost:5173`. The cleaned Parquet files ship with the repo, so there is nothing else to set up and no environment file to create.

### 3. Optional — rebuild the data from the raw DepEd file

Needs Python with pandas and pyarrow, plus `data/raw.xlsx`.

```bash
python pipeline/clean.py
cp data/schools.parquet data/enrollment.parquet public/data/
```

**The copy step is required.** `clean.py` writes to `data/`, but the browser reads from `public/data/`. Skipping it means the app keeps serving the old numbers while the report shows new ones.

Read `data/quality_report.md` afterwards to see exactly what the run repaired.

### Checks

```bash
npm test        # unit tests (Vitest)
npm run lint    # code style (ESLint)
npm run build   # type-check + production build
```

### Common problems

| Problem | Fix |
|---|---|
| `npm install` fails with an engine warning | You are on Node 18 or older. Upgrade to Node 20+ |
| Charts are empty and the console shows 404s | The Parquet files must be in `public/data/`, not only `data/` |
| Rebuilt the data but nothing changed | The copy step above was skipped |
| `clean.py` stops with an assertion error | Working as designed — the source file has a duplicate ID or a bad enrollment value. Fix the source, do not loosen the assert |
| First load feels slow | Normal. The DuckDB WASM bundle downloads once, then caches |
| An uploaded dataset vanishes on refresh | By design — uploads live in browser memory only and are never sent anywhere |

## Edit or modify it

| I want to change... | Edit this file |
|---|---|
| Colors, spacing, card styles | `src/constants/theme.ts` |
| Any SQL query describing the dataset | `src/lib/queries.ts` |
| The finding's queries and its national benchmark | `src/lib/story.ts` |
| A calculation used by more than one component | `src/lib/metrics.ts` (then update `metrics.test.ts`) |
| The auto-generated findings and their thresholds | `src/lib/insights.ts` |
| Cleaning rules for uploaded files | `src/lib/cleaning.ts` (then update `cleaning.test.ts`) |
| Cleaning rules for the source dataset | `pipeline/clean.py` |
| The AI prompt or model | `src/lib/ai.ts` |
| Filter levels or cascade logic | `src/lib/filters.ts` and `src/components/FilterBar.tsx` |
| The intro text a first-time visitor reads | `src/components/IntroPanel.tsx` |
| Data source, grain, or stated limits | `src/components/DataNote.tsx` |
| Header, nav links, tricolor strip | `src/components/NavHeader.tsx` |
| When the layout collapses to one column | the `820px` media query in `src/index.css` |
| CI steps or Node version | `.github/workflows/ci.yml` |

**To add a chart:** write the query in `queries.ts`, build a component in `components/`, then render it in `DashboardPage.tsx`. Never query DuckDB from a component.

**To swap in a different dataset:** adjust `pipeline/clean.py`, run it, copy the output into `public/data/`, and check the quality report.

## Limits

Being direct about what this data cannot answer:

- **It is a one-time snapshot**, not a live feed. One school year, so no trends over time.
- **The grain is the school, not the learner.** Aralite cannot follow individual students or explain why anyone left.
- **The largest grade-to-grade gap is not a dropout rate.** It is the difference between two grade levels within a single year, which can reflect migration, cohort size, or reporting differences as much as anything else. A signal worth investigating, not a measurement. The dashboard finds whichever gap is largest for your filter rather than assuming it is always Grade 6→7 — in BARMM it is Grade 1→2.
- **Strand availability is inferred, not stated.** The source file has no "strands offered" column, so a school counts as running a strand only if someone is enrolled in it. 222 schools DepEd classifies as senior-high-offering report zero enrollment and are excluded — 1.7% of senior high schools.
- **Enrollment is not preference.** A learner can only enrol in a strand their school runs, so these numbers mix what learners wanted with what was available. This data cannot separate the two; it can only show they are entangled.
- **Uploaded datasets live in browser memory only** and disappear on refresh, by design.

For the live-pipeline version of this idea — data that collects itself on a schedule, with validation and a run log — see [Presyo](https://github.com/angelinetipa/presyo), the sibling project to this one.

## Honest notes

**The bugs that mattered here were all wrong numbers, not crashes.** A chart sorted by raw headcount while its bars showed percentages, and generated a confident, false headline. A subtitle hardcoded Grade 6→7 while the insights panel searched for the real largest gap, so the two named different grades for the same region. An axis formatter rounded 50k, 100k and 150k all to "0.1M". Every one rendered perfectly and every one passed the existing tests.

So the 25 tests now assert **numbers**, using real DepEd figures verified three ways — in the notebook, in the app's own SQL, and in an Excel sheet anyone can rerun. Each test is a bug that actually shipped. `queries.ts` still has no direct coverage, because testing it needs DuckDB in the test environment; the calculations it feeds were pulled into `metrics.ts`, which is tested.

**The cleaned street address column is unused.** `clean.py` builds `Street Address Clean` for future mapping or geocoding work. Nothing reads it yet.

**The admin page has no authentication.** It is a client-side tool on a static site, so anything it "publishes" only affects the current browser session. It would need a real backend before it could manage a shared dataset.

**The AI feature depends on the user having a key.** Most visitors will never try it. It exists because turning a question into SQL was the part I wanted to understand, not because it is the most useful feature here.

## Credits

Data: DepEd Learner Information System, SY 2023–2024.

Aralite is an independent self-learning project. It uses real public DepEd data but is not affiliated with the Department of Education, and no part of it has been adopted or reviewed by them.

---

Built by [Angeline Tipa](https://github.com/angelinetipa).