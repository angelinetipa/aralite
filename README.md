# Aralite

**In-browser SQL analytics for Philippine school enrollment — no server, no database bill.**

Aralite turns the Department of Education's raw enrollment file (60,000+ schools, 27M learners) into a clean, filterable dashboard. It runs a real SQL database *inside the browser*, so anyone can explore the data — drill from region down to a single barangay, read auto-generated findings, or even ask questions in plain English. Built as a self-learning data-engineering project.

🔗 **Live demo:** [aralite.vercel.app](https://aralite.vercel.app)

## Features

- **One-look dashboard** — total learners, the Grade 6→7 drop-off, gender balance, senior-high strand choices (and by gender), public vs private split, what schools offer, and enrollment by region.
- **Location filters** — five cascading levels (Region → Province → Division → Municipality → Barangay) drive every chart and stat.
- **Key findings** — plain-language insights auto-calculated from the data, updating with the filter.
- **Ask the data** — type a question in plain English; your own AI key (Groq or Gemini) writes the SQL, which runs read-only in the browser. The SQL is shown for trust.
- **Admin page** — separate `/admin` area to upload, clean, publish, and remove datasets.
- **Clean any dataset** — upload CSV/Excel; it's cleaned in your browser (encoding, junk, invalid values, name/address standardization) and downloadable. Nothing leaves your computer.

## Tech stack

**Frontend:** React, TypeScript, Vite, React Router, Recharts
**Data engine:** DuckDB-WASM (SQL in the browser), Parquet
**Cleaning pipeline:** Python, pandas
**AI (optional):** Groq / Gemini via bring-your-own-key
**Testing/CI:** Vitest, GitHub Actions
**Hosting:** Vercel

## Getting started

**Prerequisites**
- [Node.js](https://nodejs.org) (v18+)
- [Git](https://git-scm.com)

**1. Clone**
```bash
git clone https://github.com/angelinetipa/aralite.git
cd aralite
```

**2. Install**
```bash
npm install
```

**3. Run**
```bash
npm run dev
```
Open the printed link (usually `http://localhost:5173`). Data files ship with the repo — nothing else to set up.

**Optional — rebuild data from the raw DepEd file** (needs Python + pandas + pyarrow)
```bash
python pipeline/clean.py
```

## Testing

```bash
npm test        # run unit tests (Vitest)
npm run lint    # check code style
npm run build   # type-check + production build
```

## Project structure

```
aralite/
├── pipeline/clean.py         # Python cleaning pipeline (raw Excel → Parquet)
├── data/                     # raw + cleaned data
├── public/data/              # Parquet files served to the browser
├── src/
│   ├── App.tsx               # router (dashboard + admin)
│   ├── pages/                # DashboardPage, AdminPage
│   ├── components/           # charts, stat cards, filters, upload, ask
│   ├── lib/
│   │   ├── db.ts             # DuckDB setup + upload reshaping
│   │   ├── queries.ts        # all SQL queries
│   │   ├── insights.ts       # auto-calculated findings
│   │   ├── cleaning.ts       # browser cleaning rules (+ tests)
│   │   ├── ai.ts             # natural-language → SQL (BYOK)
│   │   └── filters.ts        # shared location-filter logic
│   └── constants/theme.ts    # colors + design tokens
└── .github/workflows/ci.yml  # lint + build + test on every push
```

## Notes

- Aralite is a self-learning project. It uses a real public DepEd dataset (SY 2023–2024) and is not affiliated with the Department of Education.
- AI features are optional and use your own API key, which stays in your browser.

---

Data: DepEd Learner Information System, SY 2023–2024.
Built by [Angeline Tipa](https://github.com/angelinetipa).