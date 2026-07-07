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

// ---- SCHOOL FINDER ----------------------------------------------------
// Turns Aralite into a tool: search 60k schools by name/ID + location.

export type SchoolFilters = {
  region?: string; province?: string; division?: string;
  municipality?: string; barangay?: string;
};

// Build a safe WHERE from whatever filters are set.
function schoolWhere(f: SchoolFilters, search: string): string {
  const parts: string[] = [];
  const esc = (v: string) => v.replace(/'/g, "''");
  if (f.region) parts.push(`"Region" = '${esc(f.region)}'`);
  if (f.province) parts.push(`"Province" = '${esc(f.province)}'`);
  if (f.division) parts.push(`"Division" = '${esc(f.division)}'`);
  if (f.municipality) parts.push(`"Municipality" = '${esc(f.municipality)}'`);
  if (f.barangay) parts.push(`"Barangay" = '${esc(f.barangay)}'`);
  if (search.trim()) {
    const s = esc(search.trim());
    // match school name (any part) OR exact-ish school ID
    parts.push(`(LOWER("School Name") LIKE '%${s.toLowerCase()}%' OR CAST("BEIS School ID" AS VARCHAR) LIKE '${s}%')`);
  }
  return parts.length ? 'WHERE ' + parts.join(' AND ') : '';
}

// Distinct values for one dropdown, narrowed by the filters above it.
export async function getFilterOptions(
  column: 'Region' | 'Province' | 'Division' | 'Municipality' | 'Barangay',
  f: SchoolFilters
): Promise<string[]> {
  const where = schoolWhere(f, '');
  const rows = await query<{ v: string }>(`
    SELECT DISTINCT "${column}" v FROM schools ${where}
    ORDER BY v LIMIT 2000
  `);
  return rows.map((r) => r.v).filter(Boolean);
}

export type SchoolHit = {
  id: string; name: string; region: string;
  municipality: string; sector: string; total: number;
};

// Search results — capped so the browser stays snappy.
export async function searchSchools(f: SchoolFilters, search: string): Promise<SchoolHit[]> {
  const where = schoolWhere(f, search);
  const rows = await query<{
    id: number; name: string; region: string;
    municipality: string; sector: string; total: number;
  }>(`
    SELECT "BEIS School ID" id, "School Name" name, "Region" region,
           "Municipality" municipality, "Sector" sector,
           "Total Enrollment" total
    FROM schools ${where}
    ORDER BY "Total Enrollment" DESC
    LIMIT 50
  `);
  return rows.map((r) => ({
    id: String(r.id), name: r.name, region: r.region,
    municipality: r.municipality, sector: r.sector, total: Number(r.total),
  }));
}

export type SchoolProfile = {
  info: Record<string, string>;
  total: number; male: number; female: number;
  byGrade: { grade: string; total: number }[];
};

// Full profile for one school (shown when a result is clicked).
export async function getSchoolProfile(id: string): Promise<SchoolProfile> {
  const esc = id.replace(/'/g, "''");
  const info = await query<Record<string, string>>(`
    SELECT "School Name", "BEIS School ID", "Region", "Province",
           "Division", "Municipality", "Barangay", "Street Address",
           "Sector", "School Type", "Total Enrollment"
    FROM schools WHERE CAST("BEIS School ID" AS VARCHAR) = '${esc}' LIMIT 1
  `);
  const g = await query<{ grade: string; gender: string; total: bigint }>(`
    SELECT e.grade, e.gender, SUM(e.enrollment) total
    FROM enrollment e
    WHERE CAST(e."BEIS School ID" AS VARCHAR) = '${esc}'
    GROUP BY e.grade, e.gender
  `);
  const order = ['K','G1','G2','G3','G4','G5','G6','G7','G8','G9','G10','G11','G12','Elem NG','JHS NG'];
  const byGrade = order.map((gr) => ({
    grade: gr,
    total: g.filter((r) => r.grade === gr).reduce((a, r) => a + Number(r.total), 0),
  })).filter((x) => x.total > 0);
  const male = g.filter((r) => r.gender === 'Male').reduce((a, r) => a + Number(r.total), 0);
  const female = g.filter((r) => r.gender === 'Female').reduce((a, r) => a + Number(r.total), 0);
  return {
    info: info[0] ?? {},
    total: male + female, male, female, byGrade,
  };
}