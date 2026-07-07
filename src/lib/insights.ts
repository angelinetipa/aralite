// src/lib/insights.ts
// The "analyst": reads the numbers for the current filter scope and
// writes plain-language findings. Everything is calculated from real
// data — no guessing — so every sentence is backed by a number.

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

  // 1. Biggest drop between consecutive grades.
  const grades = await query<{ grade: string; total: bigint }>(`
    SELECT e.grade, SUM(e.enrollment) total ${JOIN}
    ${where(f, ["e.grade IN ('G1','G2','G3','G4','G5','G6','G7','G8','G9','G10','G11','G12')"])}
    GROUP BY e.grade
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
    out.push({
      tone: 'alert',
      headline: `Biggest enrollment drop: ${worst.from} → ${worst.to}`,
      detail: `${worst.drop.toLocaleString()} fewer learners continue from ${worst.from} to ${worst.to} in ${scope}. This is where students are most at risk of leaving school.`,
    });
  }

  // 2. Gender gap in senior high.
  const g = await query<{ m: bigint; f: bigint }>(`
    SELECT SUM(CASE WHEN e.gender='Male' THEN e.enrollment ELSE 0 END) m,
           SUM(CASE WHEN e.gender='Female' THEN e.enrollment ELSE 0 END) f
    ${JOIN} ${where(f, ["e.grade IN ('G11','G12')"])}
  `);
  const m = Number(g[0]?.m ?? 0), fem = Number(g[0]?.f ?? 0);
  if (m + fem > 0) {
    const lead = m > fem ? 'more boys' : 'more girls';
    const gap = Math.abs(m - fem);
    const pct = Math.round((gap / (m + fem)) * 100);
    out.push({
      tone: 'info',
      headline: `Senior high has ${lead}`,
      detail: `${gap.toLocaleString()} ${lead} than the other in senior high (${pct}% gap) in ${scope}. Useful for planning gender-responsive programs.`,
    });
  }

  // 3. Most popular senior-high track.
  const strands = await query<{ strand: string; total: bigint }>(`
    SELECT e.strand, SUM(e.enrollment) total ${JOIN}
    ${where(f, ["e.grade IN ('G11','G12')", 'e.strand IS NOT NULL'])}
    GROUP BY e.strand ORDER BY total DESC LIMIT 1
  `);
  if (strands[0]) {
    const name = strands[0].strand.replace('ACAD - ', '').replace('ACAD ', '');
    out.push({
      tone: 'good',
      headline: `Most popular senior-high track: ${name}`,
      detail: `${Number(strands[0].total).toLocaleString()} learners chose ${name} in ${scope}. Shows where demand for teachers and facilities is highest.`,
    });
  }

  // 4. Public reliance.
  const sec = await query<{ sector: string; total: bigint }>(`
    SELECT s.Sector sector, SUM(e.enrollment) total ${JOIN} ${where(f)} GROUP BY s.Sector
  `);
  const totalAll = sec.reduce((a, r) => a + Number(r.total), 0);
  const pub = sec.find((r) => r.sector === 'Public');
  if (pub && totalAll > 0) {
    const pct = Math.round((Number(pub.total) / totalAll) * 100);
    out.push({
      tone: 'info',
      headline: `${pct}% of learners rely on public schools`,
      detail: `In ${scope}, public schools carry ${pct}% of all enrollment. The higher this is, the more the area depends on government funding.`,
    });
  }

  return out;
}