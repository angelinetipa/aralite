// src/lib/insights.ts
// The "analyst": reads the numbers for the current filter scope and
// writes plain-language findings. Everything is calculated from real
// data — no guessing — so every sentence is backed by a number.
//
// Rule for every sentence written here: it must not claim more than the
// data can carry. This file describes enrollment. It cannot describe why
// anyone enrolled, and it cannot follow a learner from one grade to the
// next, because the grain is the school and the file is one school year.

import { query } from './db';
import { type Filters, filterConditions, scopeLabel } from './filters';

export type Insight = { tone: 'alert' | 'info' | 'good'; headline: string; detail: string };

const JOIN = `
  FROM enrollment e
  JOIN schools s ON e."BEIS School ID" = s."BEIS School ID"
`;

function where(f: Filters, extra: string[] = []): string {
  const parts = [...filterConditions(f), ...extra];
  return parts.length ? 'WHERE ' + parts.join(' AND ') : '';
}

export async function getInsights(f: Filters): Promise<Insight[]> {
  const scope = scopeLabel(f);
  const out: Insight[] = [];

  // 1. Largest gap between two consecutive grade levels.
  //    NOT a dropout rate — see the caveat in the detail text. These are
  //    two different groups of students counted in the same year.
  const grades = await query<{ grade: string; total: bigint }>(`
    SELECT e.grade, SUM(e.enrollment) total ${JOIN}
    ${where(f, ["e.grade IN ('G1','G2','G3','G4','G5','G6','G7','G8','G9','G10','G11','G12')"])}
    GROUP BY e.grade
  `);
  const order = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12'];
  const byGrade = order
    .map((g) => ({ g, n: Number(grades.find((r) => r.grade === g)?.total ?? 0) }))
    .filter((x) => x.n > 0);
  let worst = { from: '', to: '', drop: 0, base: 0 };
  for (let i = 1; i < byGrade.length; i++) {
    const drop = byGrade[i - 1].n - byGrade[i].n;
    if (drop > worst.drop) {
      worst = { from: byGrade[i - 1].g, to: byGrade[i].g, drop, base: byGrade[i - 1].n };
    }
  }
  if (worst.drop > 0) {
    const pct = Math.round((worst.drop / worst.base) * 100);
    out.push({
      tone: 'alert',
      headline: `Largest gap between grade levels: ${worst.from} → ${worst.to}`,
      detail: `${worst.to} has ${worst.drop.toLocaleString()} fewer learners enrolled than ${worst.from} in ${scope} — ${pct}% smaller. These are two different groups counted in the same school year, not one group followed over time, so this is not a dropout rate. Migration, cohort size, and reporting differences can all produce the same gap. It is a signal worth checking, not a measurement.`,
    });
  }

  // 2. Gender balance in senior high.
  const g = await query<{ m: bigint; f: bigint }>(`
    SELECT SUM(CASE WHEN e.gender='Male' THEN e.enrollment ELSE 0 END) m,
           SUM(CASE WHEN e.gender='Female' THEN e.enrollment ELSE 0 END) f
    ${JOIN} ${where(f, ["e.grade IN ('G11','G12')"])}
  `);
  const m = Number(g[0]?.m ?? 0), fem = Number(g[0]?.f ?? 0);
  if (m + fem > 0) {
    const lead = m > fem ? 'boys' : 'girls';
    const gap = Math.abs(m - fem);
    const pct = Math.round((gap / (m + fem)) * 100);
    out.push({
      tone: 'info',
      headline: `Senior high has more ${lead}`,
      detail: `In ${scope}, senior high has ${gap.toLocaleString()} more ${lead} enrolled than the other — a ${pct}% gap. Worth knowing when planning facilities and gender-responsive programs.`,
    });
  }

  // 3. Largest senior-high strand by enrollment.
  //    Deliberately NOT phrased as a choice or a preference. This dataset
  //    counts enrollment, and a learner can only enrol in a strand their
  //    school actually offers — so enrollment mixes what learners want
  //    with what is available to them. The two cannot be separated here.
  const strands = await query<{ strand: string; total: bigint }>(`
    SELECT e.strand, SUM(e.enrollment) total ${JOIN}
    ${where(f, ["e.grade IN ('G11','G12')", 'e.strand IS NOT NULL'])}
    GROUP BY e.strand ORDER BY total DESC
  `);
  if (strands[0]) {
    const name = strands[0].strand.replace('ACAD - ', '').replace('ACAD ', '');
    const top = Number(strands[0].total);
    const allStrands = strands.reduce((a, r) => a + Number(r.total), 0);
    const pct = allStrands > 0 ? Math.round((top / allStrands) * 100) : 0;
    out.push({
      tone: 'info',
      headline: `Largest senior-high strand: ${name}`,
      detail: `${top.toLocaleString()} senior-high learners are enrolled in ${name} in ${scope} — ${pct}% of senior-high enrollment. This counts enrollment, not preference: a learner can only enrol in a strand their school offers, so availability is part of this number.`,
    });
  }

  // 4. Reliance on public schools.
  const sec = await query<{ sector: string; total: bigint }>(`
    SELECT s.Sector sector, SUM(e.enrollment) total ${JOIN} ${where(f)} GROUP BY s.Sector
  `);
  const totalAll = sec.reduce((a, r) => a + Number(r.total), 0);
  const pub = sec.find((r) => r.sector === 'Public');
  if (pub && totalAll > 0) {
    const pct = Math.round((Number(pub.total) / totalAll) * 100);
    out.push({
      tone: 'info',
      headline: `${pct}% of learners are in public schools`,
      detail: `In ${scope}, public schools carry ${pct}% of all enrollment. The higher this share, the more the area depends on government funding for basic education.`,
    });
  }

  return out;
}