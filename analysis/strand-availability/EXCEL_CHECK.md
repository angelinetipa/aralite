# Checking Aralite's numbers in Excel

A way to verify the strand-availability figures without trusting the code. Open the raw DepEd file — `SY 2023-2024 School Level Data on Official Enrollment.xlsx` — and work directly in it.

**Why this works.** The raw file is *wide*: one row per school, with 32 senior-high columns (8 strands × 2 grades × 2 genders). So "how many strands does this school run?" is answerable on a single row, and Excel can do the whole thing with two helper columns.

## Setup

Headers sit on **row 5**, data runs **row 6 to row 60172**. Column **A** is Region. The senior-high block runs **AO to BT**.

Each strand has 4 columns, split across two blocks — G11 first, G12 sixteen columns later:

| Strand | G11 (M, F) | G12 (M, F) |
|---|---|---|
| ABM | AO, AP | BE, BF |
| HUMSS | AQ, AR | BG, BH |
| STEM | AS, AT | BI, BJ |
| GAS | AU, AV | BK, BL |
| PBM | AW, AX | BM, BN |
| TVL | AY, AZ | BO, BP |
| Sports | BA, BB | BQ, BR |
| Arts | BC, BD | BS, BT |

## Two helper columns

Leave BU blank as a spacer. In **BV5** type `Strands run`, in **BW5** type `SHS learners`.

**BV6** — how many of the 8 strands this school actually runs. `N()` turns each TRUE into a 1:

```excel
=N(SUM(AO6:AP6,BE6:BF6)>0)+N(SUM(AQ6:AR6,BG6:BH6)>0)+N(SUM(AS6:AT6,BI6:BJ6)>0)+N(SUM(AU6:AV6,BK6:BL6)>0)+N(SUM(AW6:AX6,BM6:BN6)>0)+N(SUM(AY6:AZ6,BO6:BP6)>0)+N(SUM(BA6:BB6,BQ6:BR6)>0)+N(SUM(BC6:BD6,BS6:BT6)>0)
```

**BW6** — total senior-high learners at this school:

```excel
=SUM(AO6:BT6)
```

Select BV6:BW6 and double-click the fill handle to copy both down to row 60172.

## The checks

Put these anywhere empty. Each should land on the number in the right-hand column.

| # | What | Formula | Should give |
|---|---|---|---|
| 1 | Schools running senior high | `=COUNTIF(BW6:BW60172,">0")` | **12,571** |
| 2 | Senior-high learners | `=SUM(BW6:BW60172)` | **4,130,076** |
| 3 | Average strands per school | `=AVERAGEIF(BW6:BW60172,">0",BV6:BV60172)` | **2.5206** |
| 4 | Schools running one strand | `=COUNTIFS(BV6:BV60172,1,BW6:BW60172,">0")` | **3,588** |
| 5 | — as % of schools | `=D4/D1` *(point at your own cells)* | **28.5%** |
| 6 | Learners in single-strand schools | `=SUMIFS(BW6:BW60172,BV6:BV60172,1)` | **353,533** |
| 7 | — as % of learners | `=D6/D2` | **8.56%** |

Checks 5 and 7 are the pair that matters. **28.5% of schools, but only 8.6% of learners** — single-strand schools are small. If those two came out the same, the finding would have been very different.

## Regional checks

Swap the region name to test any of the 18:

```excel
Average strands       =AVERAGEIFS(BV6:BV60172,A6:A60172,"CARAGA",BW6:BW60172,">0")
% learners, 1 strand  =SUMIFS(BW6:BW60172,A6:A60172,"BARMM",BV6:BV60172,1)/SUMIFS(BW6:BW60172,A6:A60172,"BARMM",BW6:BW60172,">0")
```

| Region | Avg strands | % learners in single-strand schools |
|---|---|---|
| CARAGA | **1.97** | 19.6% |
| BARMM | **2.00** | **22.5%** |
| NCR | **3.11** | 3.9% |

BARMM 22.5% against Region IV-A 3.5% is the six-fold gap in the dashboard headline.

## If a number does not match

Work through these in order:

1. **Off by a few rows** — check the fill reached row 60172, not further. Excel sometimes stops at a blank.
2. **Average is wrong but counts are right** — you probably used `AVERAGE` instead of `AVERAGEIF`. Schools with no senior high have 0 strands and would drag the average down. They must be excluded.
3. **Everything is zero** — the helper columns are misaligned. Check that AO5 reads `G11 ACAD - ABM Male`.
4. **Regional figures are off** — check for trailing spaces in the Region column. `TRIM()` fixes it.

## Worth knowing

This checks the arithmetic, not the assumption. The raw file has no "strands offered" column, so both Excel and the app infer availability the same way: a school runs a strand if someone is enrolled in it. If that assumption is wrong, both will be wrong together and agree with each other perfectly. Matching numbers prove the sums are right — not that the question was framed right.
