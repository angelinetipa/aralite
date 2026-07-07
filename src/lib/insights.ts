// src/lib/insights.ts
// The "analyst" of Aralite. Instead of making the user read charts and
// guess what matters, this reads the numbers and writes plain-language
// FINDINGS — a fact, a number, and why it matters.
//
// Everything here is calculated from the real data (no AI, no guessing),
// so every sentence is backed by a number the user can trust.

import { query } from './db';

export type Insight = {
  tone: 'alert' | 'info' | 'good'; // controls the color accent
  headline: string;                // the finding in one line
  detail: string;                  // why it matters / the number
};

// helper: build the region WHERE clause (or empty for nationwide)
function whereRegion(region: string | null): string {
  if (!region) return '';
  return `AND s.Region = '${region.replace(/'/g, "''")}'`;
}

const JOIN = `
  FROM enrollment e
  JOIN schools s ON e."BEIS School ID" = s."BEIS School ID"
`;

export async function getInsights(region: string | null): Promise<Insight[]> {
  const scope = region ?? 'the country';
  const insights: Insight[] = [];

  // 1. DROP-OFF: biggest fall between two consecutive grades.
  const grades = await query<{ grade: string; total: bigint }>(`
    SELECT e.grade, SUM(e.enrollment) total ${JOIN}
    WHERE e.grade IN ('G1','G2','G3','G4','G5','G6','G7','G8','G9','G10','G11','G12')
    ${whereRegion(region)} GROUP BY e.grade
  `);
  const order = ['G1','G2','G3','G4','G5','G6','G7','G8','G9','G10','G11','G12'];
  const byGrade = order
    .map((g) => ({ g, n: Number(grades.find((r) => r.grade === g)?.total ?? 0) }))
    .filter((x) => x.n > 0);
  let worst = { from: '', to: '', drop: 0 };
  for (let i = 1; i < byGrade.length; i++) {
    const drop = byGrade[i - 1].n - byGrade[i].n;
    if (drop > worst.drop) worst = { from: byGrade[i - 1].g, to: byGrade[i].g, drop };
  }
  if (worst.drop > 0) {
    insights.push({
      tone: 'alert',
      headline: `Biggest enrollment drop: ${worst.from} → ${worst.to}`,
      detail: `${worst.drop.toLocaleString()} fewer learners continue from ${worst.from} to ${worst.to} in ${scope}. This is where students are most at risk of leaving school.`,
    });
  }

  // 2. GENDER GAP in senior high (where it's widest / most policy-relevant).
  const g = await query<{ m: bigint; f: bigint }>(`
    SELECT
      SUM(CASE WHEN e.gender='Male' THEN e.enrollment ELSE 0 END) m,
      SUM(CASE WHEN e.gender='Female' THEN e.enrollment ELSE 0 END) f
    ${JOIN}
    WHERE e.grade IN ('G11','G12') ${whereRegion(region)}
  `);
  const m = Number(g[0]?.m ?? 0), f = Number(g[0]?.f ?? 0);
  if (m + f > 0) {
    const lead = m > f ? 'more boys' : 'more girls';
    const gap = Math.abs(m - f);
    const pct = Math.round((gap / (m + f)) * 100);
    insights.push({
      tone: 'info',
      headline: `Senior high has ${lead}`,
      detail: `${gap.toLocaleString()} ${lead} than the other in senior high (${pct}% gap) in ${scope}. Useful for planning gender-responsive programs.`,
    });
  }

  // 3. TOP STRAND: what senior-high students actually choose.
  const strands = await query<{ strand: string; total: bigint }>(`
    SELECT e.strand, SUM(e.enrollment) total ${JOIN}
    WHERE e.grade IN ('G11','G12') AND e.strand IS NOT NULL ${whereRegion(region)}
    GROUP BY e.strand ORDER BY total DESC LIMIT 1
  `);
  if (strands[0]) {
    const name = strands[0].strand.replace('ACAD - ', '').replace('ACAD ', '');
    insights.push({
      tone: 'good',
      headline: `Most popular senior-high track: ${name}`,
      detail: `${Number(strands[0].total).toLocaleString()} learners chose ${name} in ${scope}. Shows where demand for teachers and facilities is highest.`,
    });
  }

  // 4. PUBLIC vs PRIVATE reliance.
  const sec = await query<{ sector: string; total: bigint }>(`
    SELECT s.Sector sector, SUM(e.enrollment) total ${JOIN}
    WHERE 1=1 ${whereRegion(region)} GROUP BY s.Sector
  `);
  const totalAll = sec.reduce((a, r) => a + Number(r.total), 0);
  const pub = sec.find((r) => r.sector === 'Public');
  if (pub && totalAll > 0) {
    const pct = Math.round((Number(pub.total) / totalAll) * 100);
    insights.push({
      tone: 'info',
      headline: `${pct}% of learners rely on public schools`,
      detail: `In ${scope}, public schools carry ${pct}% of all enrollment. The higher this is, the more the region depends on government funding.`,
    });
  }

  return insights;
}