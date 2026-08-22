# Know your own repo

For you, not for recruiters. Read a section, close the file, then say the answer out loud. Where you stumble is where to dig.

**36 files sounds like a lot. It isn't.** Eleven are chart components built from the same three-step shape — learn one and you know all eleven. The real core is six files. Start there.

---

## The one-sentence version

> Aralite reads DepEd's school enrollment file, cleans it, and runs a real SQL database inside the browser so anyone can explore 27 million learners with no server. It makes one argument: senior-high strand enrollment reflects what schools offer as much as what learners want.

Say that first in any interview. Everything else is detail.

---

## How data moves

```
raw.xlsx  →  pipeline/clean.py  →  *.parquet  →  db.ts (DuckDB in browser)
                                                    ↓
                          queries.ts  ·  story.ts  ·  insights.ts
                                                    ↓
                         metrics.ts (pure maths)  →  components  →  screen
```

One rule holds it together: **components never write SQL.** They call a function in `lib/`. If SQL appears in a component, something has gone wrong.

**Q: Why put a database in the browser instead of on a server?**
No server to run or pay for, nothing to break, and the data is public so there's nothing to protect. It also means every visitor gets the full 3.5 million rows instead of a pre-baked summary. The cost is a few seconds of loading on first visit.

---

## The six that matter

### `src/lib/db.ts` — starts the database
Boots DuckDB-WASM, loads the two Parquet files, and exposes one `query()` function. Everything else in the app goes through it.

**Q: Why Parquet instead of CSV?** Columnar and compressed. A query that only touches two columns reads only those two. CSV would force reading all 72.

### `src/lib/queries.ts` — every SQL statement
The service layer. Each function takes the shared `Filters` object and returns typed rows.

**Q: Why is all the SQL in one file?** So filtering means the same thing everywhere. When SQL is scattered across components, one chart eventually filters differently from another and nobody notices.

### `src/lib/story.ts` — the argument layer
Separate from `queries.ts` on purpose. `queries.ts` describes the data; `story.ts` makes a claim. Every figure it returns comes paired with its national equivalent.

**Q: Why separate?** Because a number with nothing to compare it against isn't a finding. Splitting them made the benchmark a structural rule instead of something I had to remember.

### `src/lib/metrics.ts` — pure maths, no SQL, no React
`largestGap`, `availabilityFrom`, `sortByMetric`. Plain data in, plain data out.

**Q: Why does this file exist?** The largest-gap calculation was written twice — once in `DropoffSection`, once in `insights.ts`. In BARMM they disagreed on screen: one said Grade 2, the other said Grade 7. One implementation can't contradict itself.

### `src/lib/filters.ts` — what "filtered" means
Defines the `Filters` shape, the five cascading levels, and `scopeLabel()` which turns a filter into readable text like "CARAGA".

### `src/lib/cleaning.ts` — the rules
The JavaScript twin of `pipeline/clean.py`. Trims whitespace, fixes casing, standardises blanks.

**Q: Why does cleaning exist in two languages?** Python cleans the shipped dataset once. JavaScript cleans files users upload in the browser. Same rules, two places they're needed.

**Q: Why repair instead of delete?** Deleting a row loses a real school. The rules fix values and never drop anything — that's why input and output row counts match, and the quality report proves it.

---

## The chart components — learn one, know eleven

Every `*Section.tsx` does the same three things:

1. `useEffect` calls a query function when `filters` change
2. Holds `loading / error / ready` in state
3. Renders a `<Card>` with a Recharts chart inside

**Q: Why does every chart take `filters` as a prop instead of reading it itself?** So there's exactly one source of truth. `SchoolPanel` used to keep its own filter state and could silently disagree with the rest of the page. Props make that impossible.

The ones with something extra:

- **`StorySection`** — the finding, stated first. Rewrites itself per filter, always shows the national figure alongside. The caveat is collapsed so it doesn't shout.
- **`AvailabilitySection`** — the evidence. Rendered twice with different `metric` props. **Deliberately ignores the filter** — it's the benchmark, and a benchmark with one bar left isn't a benchmark. It outlines your selection instead.
- **`DropoffSection`** — finds the largest grade gap via `metrics.ts`. Refuses to call it a dropout rate.
- **`AskSection`** — plain English → SQL via the user's own API key. Read-only check before anything runs, and it shows the SQL.
- **`FilterBar`** — five cascading dropdowns. One control for the whole page.

**Q: Why is the availability chart the only one that ignores the filter?** Because its job is comparison. Filter it to CARAGA and there's one bar and nothing to judge it against.

---

## The dashboard's order

`DashboardPage.tsx` runs: **scene → finding → evidence → context (collapsed) → tools → limits.**

**Q: Why is the finding at the top instead of the charts?** Seven equal charts make the reader hunt for the point. Stating it first turns everything below into evidence.

**Q: Why is the context section collapsed by default?** It was a wall. Closed, the page reads as an argument with an appendix — and six chart queries don't run unless someone opens it, so the page loads faster.

**Q: Why are the tools at the bottom?** They compete with the finding for attention. Someone who wants to dig has already scrolled.

---

## Tests

`npm run test` → 32 tests.

- `cleaning.test.ts` (10) — the cleaning rules
- `metrics.test.ts` (15) — **real DepEd numbers**, verified in the notebook, in DuckDB, and in Excel

**Every test is a bug that actually shipped.** `largestGap` asserts G1→G2 in BARMM. `sortByMetric` has a test proving the old sort gave "Region VII" and the correct one gives "BARMM". `compact` asserts 50k/100k/150k render as three different labels, not "0.1M" three times.

**Q: Why test numbers instead of the UI?** Every bug here rendered perfectly and said something false. Nothing crashed. A UI test would have passed.

---

## The analysis

`analysis/strand-availability/` — notebook, script, three charts, three CSVs, writeup.

**The finding:** the average senior high school runs **2.5 of the 8 tracks and strands**. A learner in **BARMM** is about **6× more likely** than one in **Region IV-A** to attend a school running only one.

**The correction that matters:** 28.5% of schools run one strand, but only **8.6% of learners** attend them — those schools average 98 learners against 420 elsewhere. Leading with 28.5% would have overstated it badly.

**The assumption, stated not hidden:** the raw file has no "strands offered" column, so availability is inferred from enrollment. 222 schools DepEd classifies as senior-high-offering report zero enrollment and are excluded — 1.7%.

**Q: What would change your mind?** Whether learners cross regional boundaries for senior high. This data records where a school is, not where a learner lives. If they travel, the availability gap is real but the access gap is smaller than it looks.

**Q: Tell me about a time you were wrong.** This one. 28.5% supported "learners have no choice" and I nearly wrote it. The learner-weighted number came back at 8.6% and killed the claim. It's Finding 2 in the writeup now.

---

## Questions you should expect

**"Walk me through this project."** → The one-sentence version, then the finding, then the limits.

**"Why DuckDB in the browser?"** → No server, full dataset, public data.

**"How do you know your numbers are right?"** → Four ways. Validation assertions in the notebook that run before any result. 32 tests on real figures. An Excel sheet anyone can rerun. And the dashboard's SQL reproduces the notebook exactly — 2.5206, not "about 2.5".

**"What's wrong with it?"** → Availability is inferred, not stated. One school year, no trend. School-level grain, so no learner is ever followed. Region means where the school is, not where the learner lives.

**"Did you use AI?"** → Yes, and so does everyone. What's yours is which questions to ask and which claims to refuse. Then give an example: the sort order was ranking by headcount while the bars showed percentage, which produced a false headline — you caught it by looking at the chart.

---

## How to use this

Cover the answers. Read a question. Say it out loud — **out loud**, not in your head; the gap between "I know this" and "I can say this" only shows when you speak.

Start with the six core files. Skip the chart components until those are solid.

Then find the file you *still* can't explain, and tell me which one.