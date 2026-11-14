# Know your own repo

For you, not for recruiters. Read a section, close the file, then say the answer out loud. Where you stumble is where to dig.

**The repo looks big. It is smaller than it looks.** Most chart sections are built from the same three step shape, so learn one and you know the rest. The real core is six files. Start there.

---

## The one sentence version

> Aralite reads DepEd's school enrollment file, cleans it, and runs a real SQL database inside the browser so anyone can explore 27 million learners with no server. It makes one argument. Senior high strand enrollment reflects what schools offer as much as what learners want.

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

One rule holds it together. **Components never write SQL.** They call a function in `lib/`. If SQL appears in a component, something has gone wrong.

**Why put a database in the browser instead of on a server?**
No server to run or pay for, nothing to break, and the data is public so there is nothing to protect. It also means every visitor gets the full 3.5 million rows instead of a prebuilt summary. The cost is a few seconds of loading on first visit.

---

## The six that matter

### `src/lib/db.ts` starts the database
Boots DuckDB-WASM, loads the two Parquet files, and exposes one `query()` function. Everything else in the app goes through it.

**Why Parquet instead of CSV?** Columnar and compressed. A query that only touches two columns reads only those two. CSV would force reading all 72.

### `src/lib/queries.ts` holds every SQL statement
The service layer. Each function takes the shared `Filters` object and returns typed rows.

**Why is all the SQL in one file?** So filtering means the same thing everywhere. When SQL is scattered across components, one chart eventually filters differently from another and nobody notices.

### `src/lib/story.ts` is the argument layer
Separate from `queries.ts` on purpose. `queries.ts` describes the data. `story.ts` makes a claim. Every figure it returns comes paired with its national equivalent.

**Why separate?** Because a number with nothing to compare it against is not a finding. Splitting them made the benchmark a structural rule instead of something I had to remember.

### `src/lib/metrics.ts` is pure maths, no SQL, no React
`largestGap`, `availabilityFrom`, `sortByMetric`, `priorityRegions`. Plain data in, plain data out.

**Why does this file exist?** The largest gap calculation was written twice, once in `DropoffSection` and once in `insights.ts`. In BARMM they disagreed on screen. One said Grade 2 and the other said Grade 7. One implementation cannot contradict itself.

### `src/lib/filters.ts` defines what filtered means
Defines the `Filters` shape, the five cascading levels, and `scopeLabel()` which turns a filter into readable text like "CARAGA".

### `src/lib/cleaning.ts` holds the browser cleaning rules
The JavaScript twin of `pipeline/clean.py`. It repairs broken letters, strips junk, squeezes spaces, labels placeholder values, and adds clean name and address columns.

**Why does cleaning exist in two languages?** Python cleans the shipped dataset once. JavaScript cleans files users upload in the browser. The rules match, with one gap. Casing is only standardized in Python.

**Why repair instead of delete?** Deleting a row loses a real school. The rules fix values and never drop anything. That is why input and output row counts match, and the quality report proves it.

---

## The UI pieces

These keep the page looking like one product.

### The bento grid in `src/index.css`
One 12 column grid for the whole page. A row is a `div` with `aralite-bento`. Each block sits in a wrapper with a span class like `bento-4` or `bento-7`, and the spans in a row add up to 12. The wrapper also has `bento-fill`, so the card inside fills its cell and blocks in one row stretch to the same height.

**Why a grid instead of stacking cards?** Stacked cards leave ragged edges and wasted space. In a grid, every row ends on the same line, and the row shapes (4 + 4 + 4, then 12, then 5 + 7, and so on) are easy to change in one place.

**Why does the wrapper always render?** So the grid keeps its shape while data loads. If the wrapper only appeared after loading, the layout would jump.

At 1100px wide, blocks go two per row. At 700px wide, everything stacks.

### `Card` and `ChartBox` in `ui.tsx`
`Card` draws every card, with a title, an optional subtitle, and optional extras. `kicker` adds a blue top border for the cards that make up the argument. `dark` gives the navy look. `ChartBox` is the chart area inside a card. It never shrinks below a minimum height and it stretches to fill the cell.

### `InfoTip.tsx` is the small i button
A `Card` can take a `finding` prop. When it does, the card shows a small **i** button at the right end of the title row. Click or press Enter to open a short note. Click outside or press Escape to close it. The button sets `aria-expanded` and `aria-controls`, so screen readers can follow it.

**Why hide the finding behind a button?** The finding is a sentence or two worked out from the data. Printed in full on every chart, it made the cards tall and the page long. Behind a button, the card stays short and the sentence is one click away.

### `Button.tsx` is the one button
Four variants. `primary` is the main action. `danger` is the confirm step of a destructive action. `outline` is a quiet second action. `outlineDanger` is a destructive action that still needs a confirm step.

**Why one Button component?** Before it, each page styled its own buttons and they drifted apart. Now a change in one file changes every button.

### `HeroBanner.tsx` and `ExplorePanel.tsx`
`HeroBanner` is the slim blue top of the dashboard. It holds the page header, a headline and three figures. Those figures are typed in on purpose, because the banner shows while the data loads and cannot wait for a query. `ExplorePanel` is one row with the filter on the left and the four stat tiles on the right.

### `SchoolPanel.tsx` and its empty state
Lists the largest schools in the area picked in the filter. Until a filter is set, it shows a hint card that says "Pick a region to see its schools". The list scrolls inside a fixed height.

**Why a hint card instead of nothing?** The old panel returned nothing when no filter was set, so the chart in the same row sat alone and stretched tall. A hint holds the slot. The fixed list height keeps the row short once the list fills.

---

## The Admin page

`AdminPage.tsx` uses the same bento grid. Row one has a status card and a remove card. Row two has the upload card and the cleaning report, from `UploadSection.tsx`.

- The status card shows the live dataset with a DEFAULT or CUSTOM badge.
- The remove card asks for a confirm step before it restores the default data.
- The live dataset name is kept in `liveDataset.ts`, a small module variable, so it survives leaving the page. It is not saved to disk, because the uploaded data lives in memory and disappears on refresh.

**Why a module variable and not `useState`?** React state dies when you leave the page, so coming back always showed DEFAULT even when a custom dataset was live. A module variable outlives page changes.

**Why is the xlsx library loaded with a dynamic import?** It is over 400 kB and only uploaders need it. `await import('xlsx')` runs inside the file handler, so it downloads only when someone picks a file.

**Does an upload go to your server?** No. The file is read, cleaned and queried inside the visitor's own browser. It is never sent anywhere, and it is gone on refresh.

---

## The chart sections

Most `*Section.tsx` files do the same three things.

1. `useEffect` calls a query function when `filters` change
2. They hold `loading / error / ready` in state
3. They render a `Card` with a Recharts chart inside

**Why does every chart take `filters` as a prop instead of reading it itself?** So there is exactly one source of truth. `SchoolPanel` used to keep its own filter state and could silently disagree with the rest of the page. Props make that impossible.

The ones with something extra.

- **`StorySection`** is the finding, stated first, on a dark card. It is always national and shows the share of schools against the share of learners in a small comparison. The caveat is collapsed so it does not shout.
- **`AvailabilitySection`** is the evidence. Rendered twice with different `metric` props. **It deliberately ignores the filter.** It is the benchmark, and a benchmark with one bar left is not a benchmark. It outlines your selection instead.
- **`RecommendationSection`** is the so what. The priority regions come from `priorityRegions()`, not from a typed list.
- **`DropoffSection`** finds the largest grade gap through `metrics.ts`. It refuses to call it a dropout rate.
- **`RegionsSection`** is a treemap. It stays national and sets the filter when you click a tile.
- **`AskSection`** turns plain English into SQL with the user's own API key, on a dark card. It checks the SQL is read only before anything runs, and it shows the SQL.
- **`FilterBar`** is five cascading dropdowns. One control for the whole page.

**Why is the availability chart the only evidence chart that ignores the filter?** Because its job is comparison. Filter it to CARAGA and there is one bar and nothing to judge it against.

---

## The dashboard's order

`DashboardPage.tsx` runs **banner, finding, evidence, so what, explore, background charts, then limits and ask.**

| Row | Shape | What is in it |
|---|---|---|
| Finding and evidence | 4 + 4 + 4 | Story, then two availability charts |
| So what | 12 | The recommendation strip |
| Explore | 5 + 7 | Filter and stat tiles |
| Background | 7 + 5 | Drop off and regions |
| Background | 4 + 5 + 3 | Strands, strand by gender, sector |
| Background | 5 + 7 | Offering and school list |
| Limits and ask | 7 + 5 | About this data and the ask box |

The two dark cards, the finding and the ask box, sit on opposite corners so the weight of the page stays balanced.

**Why is the finding at the top instead of the charts?** Many equal charts make the reader hunt for the point. Stating it first turns everything below into evidence.

**Why does nothing above Explore respond to the filter?** So the top of the page is the same for everyone. Only the sections below the filter change.

**Why are the tools at the bottom?** They compete with the finding for attention. Someone who wants to dig has already scrolled.

---

## Tests

`npm run test` runs 32 tests.

- `cleaning.test.ts` has 10 tests for the cleaning rules
- `metrics.test.ts` has 22 tests on **real DepEd numbers**, verified in the notebook, in DuckDB, and in Excel

**Every test is a bug that actually shipped.** `largestGap` asserts G1 to G2 in BARMM. `sortByMetric` has a test proving the old sort gave "Region VII" and the correct one gives "BARMM". `compact` asserts 50k, 100k and 150k render as three different labels, not "0.1M" three times.

**Why test numbers instead of the UI?** Every bug here rendered perfectly and said something false. Nothing crashed. A UI test would have passed.

---

## The analysis

`analysis/strand-availability/` holds the notebook, script, three charts, three CSVs, and the writeup.

**The finding.** The average senior high school runs **2.5 of the 8 tracks and strands**. A learner in **BARMM** is about **6× more likely** than one in **Region IV-A** to attend a school running only one.

**The correction that matters.** 28.5% of schools run one strand, but only **8.6% of learners** attend them. Those schools average 98 learners against 420 elsewhere. Leading with 28.5% would have overstated it badly.

**The assumption, stated and not hidden.** The raw file has no "strands offered" column, so availability is inferred from enrollment. 222 schools DepEd classifies as senior high offering report zero enrollment and are excluded. That is 1.7%.

**What would change your mind?** Whether learners cross regional boundaries for senior high. This data records where a school is, not where a learner lives. If they travel, the availability gap is real but the access gap is smaller than it looks.

**Tell me about a time you were wrong.** This one. 28.5% supported "learners have no choice" and I nearly wrote it. The learner weighted number came back at 8.6% and killed the claim. It is Finding 2 in the writeup now.

---

## Questions you should expect

**"Walk me through this project."** The one sentence version, then the finding, then the limits.

**"Why DuckDB in the browser?"** No server, full dataset, public data.

**"How do you know your numbers are right?"** Four ways. Validation assertions in the notebook that run before any result. 32 tests on real figures. An Excel sheet anyone can rerun. And the dashboard's SQL reproduces the notebook exactly, 2.5206 and not "about 2.5".

**"What is wrong with it?"** Availability is inferred, not stated. One school year, no trend. School level grain, so no learner is ever followed. Region means where the school is, not where the learner lives.

**"Did you use AI?"** Yes, and so does everyone. What is yours is which questions to ask and which claims to refuse. Then give an example. The sort order was ranking by headcount while the bars showed percentage, which produced a false headline, and you caught it by looking at the chart.

**"How did you handle performance?"** Four fixes, each from something that broke. One boot promise shared by every chart. A blob wrapper so the worker passes the CORS rule. A table instead of a view for the big sum. And a dynamic import so xlsx loads only for uploaders.

**"The build warns about chunk size. Why?"** The main chunk is about 904 kB, or 255 kB gzipped. It holds React, Recharts and DuckDB, which the dashboard needs on first load. Splitting it further would not speed up the first visit, so I left it and did not raise the limit to hide it.

---

## How to use this

Cover the answers. Read a question. Say it out loud, not in your head. The gap between "I know this" and "I can say this" only shows when you speak.

Start with the six core files. Skip the chart sections until those are solid.

Then find the file you *still* cannot explain, and tell me which one.