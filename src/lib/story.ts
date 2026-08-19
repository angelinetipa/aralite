// src/lib/story.ts
// The finding layer.
//
// Every other query module answers "what is in the data". This one
// answers one specific question: does senior-high strand enrollment
// reflect what learners want, or what their school happens to run?
//
// It is separate from queries.ts on purpose. queries.ts describes the
// dataset; this file makes an argument, and an argument needs a
// benchmark. Every figure here is returned alongside its national
// equivalent, because a number with nothing to compare it against is
// not a finding.
//
// Full working: analysis/strand-availability/

import { query } from './db';
import { type Filters, filterConditions } from './filters';

// A school "runs" a strand if at least one learner is enrolled in it.
// The source file has no offerings column, so availability has to be
// inferred from enrollment — see the limits in the writeup.
const SHS = `
  e.grade IN ('G11','G12') AND e.enrollment > 0 AND e.strand IS NOT NULL
`;

export type Availability = {
  schools: number;          // schools running senior high in scope
  learners: number;         // senior-high learners in scope
  avgStrands: number;       // average distinct strands run per school
  oneStrandSchools: number;
  pctSchoolsOneStrand: number;
  pctLearnersOneStrand: number;
};

type Raw = {
  schools: bigint; learners: bigint; avg_strands: number;
  one_schools: bigint; one_learners: bigint;
};

function shape(r: Raw | undefined): Availability {
  const schools = Number(r?.schools ?? 0);
  const learners = Number(r?.learners ?? 0);
  const oneSchools = Number(r?.one_schools ?? 0);
  const oneLearners = Number(r?.one_learners ?? 0);
  return {
    schools,
    learners,
    avgStrands: Number(r?.avg_strands ?? 0),
    oneStrandSchools: oneSchools,
    pctSchoolsOneStrand: schools ? (oneSchools / schools) * 100 : 0,
    pctLearnersOneStrand: learners ? (oneLearners / learners) * 100 : 0,
  };
}

function availabilitySQL(conditions: string[]): string {
  const scope = conditions.length ? 'AND ' + conditions.join(' AND ') : '';
  return `
    WITH per_school AS (
      SELECT e."BEIS School ID" AS id,
             COUNT(DISTINCT e.strand) AS strands,
             SUM(e.enrollment)        AS learners
      FROM enrollment e
      JOIN schools s ON e."BEIS School ID" = s."BEIS School ID"
      WHERE ${SHS} ${scope}
      GROUP BY 1
    )
    SELECT COUNT(*)                                            AS schools,
           SUM(learners)                                       AS learners,
           AVG(strands)                                        AS avg_strands,
           SUM(CASE WHEN strands = 1 THEN 1 ELSE 0 END)        AS one_schools,
           SUM(CASE WHEN strands = 1 THEN learners ELSE 0 END) AS one_learners
    FROM per_school
  `;
}

/**
 * Availability for the current filter scope, paired with the national
 * figure so the UI always has something to compare against.
 */
export async function getAvailability(
  f: Filters,
): Promise<{ scope: Availability; national: Availability }> {
  const [scoped, national] = await Promise.all([
    query<Raw>(availabilitySQL(filterConditions(f))),
    query<Raw>(availabilitySQL([])),
  ]);
  return { scope: shape(scoped[0]), national: shape(national[0]) };
}

export type AvailabilityRegionRow = {
  region: string;
  avgStrands: number;
  pctLearnersOneStrand: number;
  learners: number;
};

/**
 * Every region, always national in scope — this chart is the benchmark,
 * so filtering it to one region would defeat its purpose. The active
 * filter highlights a bar instead of removing the others.
 */
export async function getAvailabilityByRegion(): Promise<AvailabilityRegionRow[]> {
  const rows = await query<{
    region: string; avg_strands: number; learners: bigint; one_learners: bigint;
  }>(`
    WITH per_school AS (
      SELECT e."BEIS School ID" AS id,
             s.Region           AS region,
             COUNT(DISTINCT e.strand) AS strands,
             SUM(e.enrollment)        AS learners
      FROM enrollment e
      JOIN schools s ON e."BEIS School ID" = s."BEIS School ID"
      WHERE ${SHS}
      GROUP BY 1, 2
    )
    SELECT region,
           AVG(strands)  AS avg_strands,
           SUM(learners) AS learners,
           SUM(CASE WHEN strands = 1 THEN learners ELSE 0 END) AS one_learners
    FROM per_school
    GROUP BY region
    ORDER BY 4 DESC
  `);

  return rows.map((r) => {
    const learners = Number(r.learners);
    return {
      region: r.region,
      avgStrands: Number(r.avg_strands),
      learners,
      pctLearnersOneStrand: learners ? (Number(r.one_learners) / learners) * 100 : 0,
    };
  });
}