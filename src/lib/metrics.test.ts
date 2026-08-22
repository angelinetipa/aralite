// src/lib/metrics.test.ts
//
// These tests assert NUMBERS, not rendering.
//
// Every bug this project has shipped was a wrong number that looked
// perfectly fine: a chart sorted by the wrong column, a subtitle naming
// the wrong grade, an axis printing "0.1M" three times. Nothing crashed,
// no existing test failed, and the page rendered beautifully while
// saying something false. The only reason each was caught is that a
// human looked at the picture and thought "that seems off".
//
// The fixtures below are real DepEd figures, verified three ways: the
// notebook, the DuckDB query the app runs, and the Excel sheet in
// analysis/strand-availability. If one of these tests fails, a number on
// the dashboard has changed meaning.

import { describe, it, expect } from 'vitest';
import { largestGap, availabilityFrom, sortByMetric, priorityRegions } from './metrics';
import { compact } from './format';

// Real enrollment by grade, SY 2023-2024.
const BARMM = [
  { grade: 'K', total: 121271 }, { grade: 'G1', total: 129346 },
  { grade: 'G2', total: 110139 }, { grade: 'G3', total: 98733 },
  { grade: 'G4', total: 94333 }, { grade: 'G5', total: 90390 },
  { grade: 'G6', total: 82085 }, { grade: 'G7', total: 67544 },
  { grade: 'G8', total: 61129 }, { grade: 'G9', total: 56885 },
  { grade: 'G10', total: 53659 }, { grade: 'G11', total: 51022 },
  { grade: 'G12', total: 44289 },
];

const REGION_IVA = [
  { grade: 'K', total: 301287 }, { grade: 'G1', total: 313465 },
  { grade: 'G2', total: 327840 }, { grade: 'G3', total: 314766 },
  { grade: 'G4', total: 286621 }, { grade: 'G5', total: 338896 },
  { grade: 'G6', total: 320857 }, { grade: 'G7', total: 263805 },
  { grade: 'G8', total: 283185 }, { grade: 'G9', total: 301322 },
  { grade: 'G10', total: 297974 }, { grade: 'G11', total: 296829 },
  { grade: 'G12', total: 289885 },
];

// Real senior-high availability by region, SY 2023-2024.
// Same figures as analysis/strand-availability/output_by_region.csv.
const REGIONS = [
  { region: 'CARAGA', schools: 485, avgStrands: 1.97, pctLearnersOneStrand: 19.56 },
  { region: 'CAR', schools: 358, avgStrands: 1.99, pctLearnersOneStrand: 16.16 },
  { region: 'BARMM', schools: 344, avgStrands: 2.00, pctLearnersOneStrand: 22.50 },
  { region: 'PSO', schools: 20, avgStrands: 2.15, pctLearnersOneStrand: 5.44 },
  { region: 'Region VIII', schools: 576, avgStrands: 2.23, pctLearnersOneStrand: 14.34 },
  { region: 'Region XII', schools: 573, avgStrands: 2.28, pctLearnersOneStrand: 9.12 },
  { region: 'Region VI', schools: 938, avgStrands: 2.30, pctLearnersOneStrand: 9.67 },
  { region: 'Region VII', schools: 1168, avgStrands: 2.35, pctLearnersOneStrand: 11.10 },
  { region: 'Region XI', schools: 628, avgStrands: 2.36, pctLearnersOneStrand: 11.74 },
  { region: 'Region II', schools: 493, avgStrands: 2.45, pctLearnersOneStrand: 8.66 },
  { region: 'Region V', schools: 977, avgStrands: 2.46, pctLearnersOneStrand: 13.28 },
  { region: 'Region X', schools: 650, avgStrands: 2.46, pctLearnersOneStrand: 8.16 },
  { region: 'Region I', schools: 810, avgStrands: 2.46, pctLearnersOneStrand: 7.91 },
  { region: 'Region IX', schools: 515, avgStrands: 2.48, pctLearnersOneStrand: 7.19 },
  { region: 'MIMAROPA', schools: 430, avgStrands: 2.53, pctLearnersOneStrand: 9.25 },
  { region: 'Region IV-A', schools: 1431, avgStrands: 2.88, pctLearnersOneStrand: 3.55 },
  { region: 'Region III', schools: 1274, avgStrands: 3.01, pctLearnersOneStrand: 4.58 },
  { region: 'NCR', schools: 901, avgStrands: 3.11, pctLearnersOneStrand: 3.85 },
];

describe('largestGap', () => {
  // The regression this exists for: the chart subtitle hardcoded
  // G6 -> G7 while the insights panel searched for the real largest gap.
  // In BARMM they disagreed on screen.
  it('finds G1 -> G2 in BARMM, not the assumed G6 -> G7', () => {
    const gap = largestGap(BARMM);
    expect(gap).not.toBeNull();
    expect(gap!.from).toBe('G1');
    expect(gap!.to).toBe('G2');
    expect(gap!.lost).toBe(19207);
    expect(gap!.pct).toBe(15);
  });

  it('finds G6 -> G7 in Region IV-A', () => {
    const gap = largestGap(REGION_IVA);
    expect(gap!.from).toBe('G6');
    expect(gap!.to).toBe('G7');
    expect(gap!.lost).toBe(57052);
    expect(gap!.pct).toBe(18);
  });

  it('respects grade order rather than array order', () => {
    const shuffled = [...REGION_IVA].reverse();
    expect(largestGap(shuffled)).toEqual(largestGap(REGION_IVA));
  });

  it('skips missing grades instead of reading them as zero', () => {
    // A region with no senior high must not report a collapse at G10.
    const noSHS = REGION_IVA.filter((r) => !['G11', 'G12'].includes(r.grade));
    expect(largestGap(noSHS)!.to).toBe('G7');
  });

  // The second version of the SAME bug: one shared function, but the two
  // panels handed it different rows. insights.ts started at G1 while
  // DropoffSection started at K, so wherever K outranked G1 the two
  // named different grades. Both now start at K.
  it('sees a K -> G1 fall that a G1-onwards caller cannot', () => {
    const rows = [
      { grade: 'K', total: 2000 }, { grade: 'G1', total: 1000 },
      { grade: 'G2', total: 900 }, { grade: 'G3', total: 880 },
    ];
    expect(largestGap(rows)!.from).toBe('K');
    expect(largestGap(rows.filter((r) => r.grade !== 'K'))!.from).toBe('G1');
  });

  it('returns null when enrollment never falls', () => {
    expect(largestGap([
      { grade: 'G1', total: 10 }, { grade: 'G2', total: 20 }, { grade: 'G3', total: 30 },
    ])).toBeNull();
  });

  it('returns null for no data', () => {
    expect(largestGap([])).toBeNull();
  });
});

describe('availabilityFrom', () => {
  // The near-overclaim: share of SCHOOLS is not share of LEARNERS.
  // Single-strand schools are small, so the two diverge sharply.
  it('separates the share of schools from the share of learners', () => {
    const schools = [
      { strands: 1, learners: 100 },
      { strands: 1, learners: 100 },
      { strands: 4, learners: 900 },
    ];
    const a = availabilityFrom(schools);
    expect(a.pctSchoolsOneStrand).toBeCloseTo(66.67, 1);  // two of three
    expect(a.pctLearnersOneStrand).toBeCloseTo(18.18, 1); // but few learners
    expect(a.avgStrands).toBeCloseTo(2, 5);
  });

  it('reproduces the national shape: many schools, few learners', () => {
    // 3,588 of 12,571 schools run one strand (28.5%), averaging 98
    // learners against 420 elsewhere -> 8.6% of learners.
    const one = Array.from({ length: 3588 }, () => ({ strands: 1, learners: 98 }));
    const many = Array.from({ length: 8983 }, () => ({ strands: 3, learners: 420 }));
    const a = availabilityFrom([...one, ...many]);
    expect(a.schools).toBe(12571);
    expect(a.pctSchoolsOneStrand).toBeCloseTo(28.5, 1);
    expect(a.pctLearnersOneStrand).toBeCloseTo(8.5, 0);
    expect(a.pctSchoolsOneStrand).toBeGreaterThan(a.pctLearnersOneStrand * 3);
  });

  it('does not divide by zero on empty input', () => {
    const a = availabilityFrom([]);
    expect(a.avgStrands).toBe(0);
    expect(a.pctLearnersOneStrand).toBe(0);
  });
});

describe('sortByMetric', () => {
  // The regression: SQL ordered by a raw SUM while the bars drew a
  // percentage, so the chart ranked regions by headcount and generated
  // the headline "Region VII 2x PSO" instead of "BARMM 6x Region IV-A".
  const rows = [
    { region: 'BARMM', pct: 22.5, raw: 40000 },
    { region: 'Region VII', pct: 11.1, raw: 90000 },
    { region: 'Region IV-A', pct: 3.5, raw: 30000 },
  ];

  it('ranks by the plotted percentage, not the raw count', () => {
    const sorted = sortByMetric(rows, 'pct', 'highest');
    expect(sorted[0].region).toBe('BARMM');
    expect(sorted[sorted.length - 1].region).toBe('Region IV-A');
  });

  it('sorting by the raw count gives the WRONG order — the original bug', () => {
    const wrong = sortByMetric(rows, 'raw', 'highest');
    expect(wrong[0].region).toBe('Region VII');   // what shipped
    expect(wrong[0].region).not.toBe('BARMM');    // what was true
  });

  it('puts the lowest first when low is bad', () => {
    const byStrands = sortByMetric(
      [{ r: 'NCR', s: 3.11 }, { r: 'CARAGA', s: 1.97 }, { r: 'CAR', s: 1.99 }],
      's', 'lowest',
    );
    expect(byStrands.map((x) => x.r)).toEqual(['CARAGA', 'CAR', 'NCR']);
  });

  it('does not mutate the input', () => {
    const original = [...rows];
    sortByMetric(rows, 'pct', 'highest');
    expect(rows).toEqual(original);
  });
});

describe('priorityRegions', () => {
  // The dashboard now makes a recommendation, so the recommendation
  // needs the same treatment as every other number here: a rule that
  // can be rerun, and a test that fails if the answer quietly changes.
  it('names the four regions the writeup names', () => {
    expect(priorityRegions(REGIONS).regions)
      .toEqual(['BARMM', 'CARAGA', 'CAR', 'Region VIII']);
  });

  it('leads with the worst on the learner measure', () => {
    // BARMM is third-worst on strands per school but first on the share
    // of learners with no alternative. The learner measure orders it.
    expect(priorityRegions(REGIONS).regions[0]).toBe('BARMM');
  });

  it('sets aside regions too small to rank', () => {
    const p = priorityRegions(REGIONS);
    expect(p.excluded).toEqual(['PSO']);
    expect(p.regions).not.toContain('PSO');
  });

  it('keeping PSO in would push Region VIII out of the answer', () => {
    // PSO ranks fourth-worst on strands per school on 20 schools. That
    // is a sample size, not a finding — and it costs a real region its
    // place. This is what minSchools is for.
    const noGuard = priorityRegions(REGIONS, 4, 0);
    expect(noGuard.regions).not.toContain('Region VIII');
    expect(noGuard.regions).toHaveLength(3);
  });

  it('ignores a region that is bad on only one measure', () => {
    // Region V is fifth-worst on learners but around twelfth on strands
    // per school, so widening the search does not let it through.
    const wider = priorityRegions(REGIONS, 5);
    expect(wider.regions).not.toContain('Region V');
    expect(wider.regions).toEqual(['BARMM', 'CARAGA', 'CAR', 'Region VIII']);
  });

  it('returns nothing rather than guessing on empty input', () => {
    expect(priorityRegions([]).regions).toEqual([]);
  });
});

describe('compact', () => {
  // The regression: (v / 1_000_000).toFixed(1) collapsed 50k, 100k and
  // 150k all into "0.1M", so a filtered chart showed one axis label
  // three times.
  it('keeps small values distinct instead of rounding them together', () => {
    expect(compact(50_000)).toBe('50k');
    expect(compact(100_000)).toBe('100k');
    expect(compact(150_000)).toBe('150k');
    expect(new Set([compact(50_000), compact(100_000), compact(150_000)]).size).toBe(3);
  });

  it('switches unit with magnitude', () => {
    expect(compact(0)).toBe('0');
    expect(compact(400)).toBe('400');
    expect(compact(1_500)).toBe('1.5k');
    expect(compact(2_000_000)).toBe('2.0M');
    expect(compact(27_000_000)).toBe('27M');
  });
});