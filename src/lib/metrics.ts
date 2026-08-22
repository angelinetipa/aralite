// src/lib/metrics.ts
// Pure calculations, kept away from SQL and away from React.
//
// Why this file exists: the largest grade-to-grade gap was implemented
// TWICE — once inside DropoffSection, once inside insights.ts. Two copies
// of one calculation is how the chart subtitle ended up naming Grade 7
// while the Key findings panel named Grade 2 for the same region. One
// implementation, used by both, cannot disagree with itself.
//
// Everything here takes plain data and returns plain data, so it can be
// tested against numbers we have independently verified in the notebook
// and in Excel — no browser, no DuckDB, no rendering.

export const GRADE_ORDER = [
  'K', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12',
] as const;

export type GradeTotal = { grade: string; total: number };

export type Gap = {
  from: string;
  to: string;
  lost: number;
  base: number;
  pct: number;
};

/**
 * The largest fall between two CONSECUTIVE grade levels.
 *
 * Returns null when nothing falls. Grades missing from the input are
 * skipped rather than treated as zero — a region with no senior high
 * should not register a fake collapse at G10 -> G11.
 *
 * This is not a dropout rate and the wording that surrounds it must
 * keep saying so: these are two different groups of learners counted in
 * the same school year.
 *
 * One function is not enough on its own. Both callers must also pass the
 * SAME grades — insights.ts once started at G1 while DropoffSection
 * started at K, and the two panels disagreed again. See insights.ts.
 */
export function largestGap(rows: GradeTotal[]): Gap | null {
  const present = GRADE_ORDER
    .map((g) => rows.find((r) => r.grade === g))
    .filter((r): r is GradeTotal => r !== undefined && r.total > 0);

  let worst: Gap | null = null;
  for (let i = 1; i < present.length; i++) {
    const lost = present[i - 1].total - present[i].total;
    if (lost > 0 && (!worst || lost > worst.lost)) {
      worst = {
        from: present[i - 1].grade,
        to: present[i].grade,
        lost,
        base: present[i - 1].total,
        pct: Math.round((lost / present[i - 1].total) * 100),
      };
    }
  }
  return worst;
}

export type SchoolStrands = { strands: number; learners: number };

export type AvailabilityStats = {
  schools: number;
  learners: number;
  avgStrands: number;
  oneStrandSchools: number;
  pctSchoolsOneStrand: number;
  pctLearnersOneStrand: number;
};

/**
 * Availability figures from a per-school list.
 *
 * The pair that matters is pctSchoolsOneStrand against
 * pctLearnersOneStrand. Nationally they are 28.5% and 8.6% — schools
 * running one strand are small, so the share of SCHOOLS badly overstates
 * the share of LEARNERS affected. Reporting the first as though it were
 * the second is the overclaim this whole analysis nearly made.
 */
export function availabilityFrom(schools: SchoolStrands[]): AvailabilityStats {
  const n = schools.length;
  const learners = schools.reduce((a, s) => a + s.learners, 0);
  const one = schools.filter((s) => s.strands === 1);
  const oneLearners = one.reduce((a, s) => a + s.learners, 0);

  return {
    schools: n,
    learners,
    avgStrands: n ? schools.reduce((a, s) => a + s.strands, 0) / n : 0,
    oneStrandSchools: one.length,
    pctSchoolsOneStrand: n ? (one.length / n) * 100 : 0,
    pctLearnersOneStrand: learners ? (oneLearners / learners) * 100 : 0,
  };
}

/**
 * Sort regions by the metric being DRAWN, worst first.
 *
 * Sorting by anything other than the plotted number is what put the
 * availability chart in the wrong order and generated a false headline
 * ("Region VII 2x PSO" instead of "BARMM 6x Region IV-A"). The metric
 * key is required so the two can never come apart.
 */
export function sortByMetric<T>(
  rows: T[],
  metric: keyof T,
  worst: 'highest' | 'lowest',
): T[] {
  return [...rows].sort((a, b) =>
    worst === 'lowest'
      ? Number(a[metric]) - Number(b[metric])
      : Number(b[metric]) - Number(a[metric]));
}

// ---- which regions to act on first ------------------------------------

export type RegionAvailability = {
  region: string;
  avgStrands: number;
  pctLearnersOneStrand: number;
  schools: number;
};

export type Priority = {
  regions: string[];    // the answer, worst first
  excluded: string[];   // regions set aside as too small to rank
  depth: number;        // how far down each ranking we looked
  minSchools: number;
};

/**
 * The regions that come out worst on BOTH availability measures.
 *
 * A recommendation needs a rule, not a hand-picked list, or it is just
 * an opinion wearing a number. The rule: take the worst `depth` regions
 * by average strands per school, take the worst `depth` by share of
 * learners in a single-strand school, and keep only the regions in both
 * lists. Two independent rankings agreeing is a far weaker claim to
 * argue with than either ranking alone.
 *
 * Small regions are set aside first. PSO — Philippine Schools Overseas,
 * 20 schools — sits fourth-worst on average strands purely because it is
 * tiny, and letting it in pushes Region VIII out of the answer. That is
 * not a finding, it is a sample size. The writeup says the same thing in
 * words; this makes the product say it in code.
 *
 * Returns the regions ordered by the learner measure, worst first: the
 * share of learners with no alternative is the sharper of the two, and
 * the one the dashboard leads with.
 */
export function priorityRegions(
  rows: RegionAvailability[],
  depth = 4,
  minSchools = 50,
): Priority {
  const big = rows.filter((r) => r.schools >= minSchools);
  const excluded = rows
    .filter((r) => r.schools < minSchools)
    .map((r) => r.region);

  const byStrands = sortByMetric(big, 'avgStrands', 'lowest')
    .slice(0, depth)
    .map((r) => r.region);

  const byLearners = sortByMetric(big, 'pctLearnersOneStrand', 'highest')
    .slice(0, depth);

  return {
    regions: byLearners
      .filter((r) => byStrands.includes(r.region))
      .map((r) => r.region),
    excluded,
    depth,
    minSchools,
  };
}