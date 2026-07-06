# Aralite

**In-browser SQL analytics for Philippine school enrollment — no server, no database bill.**

Aralite turns the Department of Education's raw enrollment file (60,000+ schools, 27M learners) into a clean, one-page dashboard. It runs a real SQL database *inside your browser*, so anyone can explore the data — or upload and clean their own — without a backend. Built as a self-learning data project for aspiring data engineers and analysts.

## Features

- **One-look dashboard** — total learners, the Grade 6→7 drop-off, gender balance, senior-high strand choices, public vs private split, and enrollment by region, all on a single page.
- **Region filter** — pick any region and every chart updates instantly.
- **Click-to-drill** — click a region bar to filter the whole dashboard.
- **Clean your own dataset** — upload a CSV or Excel file; it's cleaned right in your browser (encoding, whitespace, missing values) and never leaves your computer.
- **Download the cleaned copy** — get a tidy CSV back with a report of exactly what was fixed.
- **Load into dashboard** — DepEd-format uploads feed the charts directly, reshaped with SQL.

## Tech stack

**Frontend:** React, TypeScript, Vite, Recharts
**Data engine:** DuckDB-WASM (SQL in the browser), Parquet
**Cleaning pipeline:** Python, pandas
**Hosting:** Vercel

## Getting started

**Prerequisites**
- [Node.js](https://nodejs.org) (v18 or newer) — runs the app
- [Git](https://git-scm.com) — clones the code

**1. Clone the repo**
```bash
git clone https://github.com/angelinetipa/aralite.git
cd aralite
```

**2. Install dependencies**
```bash
npm install
```

**3. Run the app**
```bash
npm run dev
```
Open the link it prints (usually `http://localhost:5173`).

That's it — the data files ship with the repo, so there's nothing else to set up.

**Optional — rebuild the data from the raw DepEd file**
```bash
# needs Python + pandas + pyarrow
python pipeline/clean.py
```
This reads `data/raw.xlsx`, cleans it, and writes the Parquet files the dashboard uses.

## Demo

🔗 _Live link coming soon (deploying to Vercel)._

📸 _Screenshots coming soon._

## Project structure

```
aralite/
├── pipeline/
│   └── clean.py            # Python cleaning pipeline (raw Excel → Parquet)
├── data/                   # raw + cleaned data files
├── public/data/            # Parquet files served to the browser
├── src/
│   ├── App.tsx             # page shell: header, filter, layout
│   ├── components/         # dashboard sections + shared UI
│   ├── lib/
│   │   ├── db.ts           # DuckDB setup + upload reshaping
│   │   ├── queries.ts      # all SQL queries live here
│   │   └── cleaning.ts     # browser cleaning rules
│   └── constants/theme.ts  # colors + design tokens
└── docs/
    └── LEARNING.md         # how the project works (deep dive)
```

## Testing

```bash
npm run lint        # check code style
npm run build       # type-check + production build
```

---

Data source: DepEd Learner Information System, SY 2023–2024.
Built by [Angeline Tipa](https://github.com/angelinetipa).