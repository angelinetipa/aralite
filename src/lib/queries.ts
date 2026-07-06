// src/lib/queries.ts
// Service layer: every SQL query lives here, nowhere else.
// Components never write SQL. (UI -> section -> here -> DuckDB.)
// Every query accepts an optional region filter.

import { query } from './db';
import { GRADE_ORDER } from '../constants/theme';

function regionFilter(region: string | null, alias = 's'): string {
  if (!region) return '';
  const safe = region.replace(/'/g, "''");
  return `WHERE ${alias}.Region = '${safe}'`;
}

// Shared JOIN — enrollment rows + their school info.
const JOINED = `
  FROM enrollment e
  JOIN schools s ON e."BEIS School ID" = s."BEIS School ID"
`;

export async function getRegions(): Promise<string[]> {
  const rows = await query<{ Region: string }>(
    `SELECT DISTINCT Region FROM schools ORDER BY Region`
  );
  return rows.map((r) => r.Region);
}

// ---- headline numbers -------------------------------------------------

export type Headline = {
  total: number;
  schools: number;
  shs: number;
  topRegion: string;
};

export async function getHeadline(region: string | null): Promise<Headline> {
  const where = regionFilter(region);
  const [tot, sch, shs, top] = await Promise.all([
    query<{ v: bigint }>(`SELECT SUM(e.enrollment) v ${JOINED} ${where}`),
    query<{ v: bigint }>(
      `SELECT COUNT(*) v FROM schools s ${regionFilter(region)}`
    ),
    query<{ v: bigint }>(
      `SELECT SUM(e.enrollment) v ${JOINED} ${where ? where + ' AND' : 'WHERE'} e.grade IN ('G11','G12')`
    ),
    query<{ Region: string }>(`
      SELECT s.Region, SUM(e.enrollment) t ${JOINED}
      GROUP BY s.Region ORDER BY t DESC LIMIT 1
    `),
  ]);
  return {
    total: Number(tot[0]?.v ?? 0),
    schools: Number(sch[0]?.v ?? 0),
    shs: Number(shs[0]?.v ?? 0),
    topRegion: top[0]?.Region ?? '—',
  };
}

// ---- charts ------------------------------------------------------------

export type GradeRow = { grade: string; total: number };
export async function getByGrade(region: string | null): Promise<GradeRow[]> {
  const rows = await query<{ grade: string; total: bigint }>(`
    SELECT e.grade, SUM(e.enrollment) total ${JOINED}
    ${regionFilter(region)} GROUP BY e.grade
  `);
  const out: GradeRow[] = [];
  for (const g of GRADE_ORDER) {
    const f = rows.find((r) => r.grade === g);
    if (f) out.push({ grade: g, total: Number(f.total) });
  }
  return out;
}

// Gender split per grade — two lines on one chart.
export type GenderRow = { grade: string; Male: number; Female: number };
export async function getGenderByGrade(region: string | null): Promise<GenderRow[]> {
  const rows = await query<{ grade: string; gender: string; total: bigint }>(`
    SELECT e.grade, e.gender, SUM(e.enrollment) total ${JOINED}
    ${regionFilter(region)} GROUP BY e.grade, e.gender
  `);
  const out: GenderRow[] = [];
  for (const g of GRADE_ORDER) {
    const m = rows.find((r) => r.grade === g && r.gender === 'Male');
    const f = rows.find((r) => r.grade === g && r.gender === 'Female');
    if (m || f)
      out.push({ grade: g, Male: Number(m?.total ?? 0), Female: Number(f?.total ?? 0) });
  }
  return out;
}

export type StrandRow = { strand: string; total: number };
export async function getByStrand(region: string | null): Promise<StrandRow[]> {
  const where = regionFilter(region);
  const rows = await query<{ strand: string; total: bigint }>(`
    SELECT e.strand, SUM(e.enrollment) total ${JOINED}
    ${where ? where + ' AND' : 'WHERE'} e.grade IN ('G11','G12') AND e.strand IS NOT NULL
    GROUP BY e.strand ORDER BY total DESC
  `);
  return rows.map((r) => ({
    strand: r.strand.replace('ACAD - ', '').replace('ACAD ', ''),
    total: Number(r.total),
  }));
}

// Public vs Private learners.
export type SectorRow = { sector: string; total: number };
export async function getBySector(region: string | null): Promise<SectorRow[]> {
  const rows = await query<{ Sector: string; total: bigint }>(`
    SELECT s.Sector, SUM(e.enrollment) total ${JOINED}
    ${regionFilter(region)} GROUP BY s.Sector ORDER BY total DESC
  `);
  return rows.map((r) => ({ sector: r.Sector, total: Number(r.total) }));
}

export type RegionRow = { region: string; total: number };
export async function getTopRegions(): Promise<RegionRow[]> {
  const rows = await query<{ Region: string; total: bigint }>(`
    SELECT s.Region, SUM(e.enrollment) total ${JOINED}
    GROUP BY s.Region ORDER BY total DESC
  `);
  return rows.map((r) => ({ region: r.Region, total: Number(r.total) }));
}

// Re-export so components import data-source controls from one place.
export { resetToDefault } from './db';