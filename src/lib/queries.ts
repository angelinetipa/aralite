// src/lib/queries.ts
// Service layer. Every SQL query lives here and components never write
// SQL. (UI -> section -> here -> DuckDB.) Every query takes the shared
// Filters object, so location filtering works the same everywhere.

import { query } from './db';
import { GRADE_ORDER } from '../constants/theme';
import { type Filters, filterConditions, LEVEL_COLUMN, type Level } from './filters';

const JOINED = `
  FROM enrollment e
  JOIN schools s ON e."BEIS School ID" = s."BEIS School ID"
`;

// Turn active filters into a WHERE clause (or '' when none).
function where(f: Filters, extra: string[] = []): string {
  const parts = [...filterConditions(f), ...extra];
  return parts.length ? 'WHERE ' + parts.join(' AND ') : '';
}

// ---- headline numbers -------------------------------------------------

// Only the two counts StatCards draws. The strand figures come from
// story.ts, which pairs them with the national benchmark.
//
// This used to return eleven fields, then five. The rest were left over
// from cards that were removed, and each one cost a SQL query on every
// filter change. A field nothing reads is also a field that can quietly
// be wrong. The old privatePct was 100 minus publicPct, which counted
// SUCs/LUCs and PSO as private. SectorSection draws all four sectors
// properly from getBySector.
export type Headline = { total: number; schools: number };

export async function getHeadline(f: Filters): Promise<Headline> {
  const [tot, sch] = await Promise.all([
    query<{ v: bigint }>(`SELECT SUM(e.enrollment) v ${JOINED} ${where(f)}`),
    query<{ v: bigint }>(`SELECT COUNT(*) v FROM schools s ${where(f)}`),
  ]);
  return {
    total: Number(tot[0]?.v ?? 0),
    schools: Number(sch[0]?.v ?? 0),
  };
}

// ---- charts ------------------------------------------------------------

export type GradeRow = { grade: string; total: number };
export async function getByGrade(f: Filters): Promise<GradeRow[]> {
  const rows = await query<{ grade: string; total: bigint }>(`
    SELECT e.grade, SUM(e.enrollment) total ${JOINED} ${where(f)} GROUP BY e.grade
  `);
  const out: GradeRow[] = [];
  for (const g of GRADE_ORDER) {
    const r = rows.find((x) => x.grade === g);
    if (r) out.push({ grade: g, total: Number(r.total) });
  }
  return out;
}

export type GenderRow = { grade: string; Male: number; Female: number };
export async function getGenderByGrade(f: Filters): Promise<GenderRow[]> {
  const rows = await query<{ grade: string; gender: string; total: bigint }>(`
    SELECT e.grade, e.gender, SUM(e.enrollment) total ${JOINED} ${where(f)}
    GROUP BY e.grade, e.gender
  `);
  const out: GenderRow[] = [];
  for (const g of GRADE_ORDER) {
    const m = rows.find((r) => r.grade === g && r.gender === 'Male');
    const fem = rows.find((r) => r.grade === g && r.gender === 'Female');
    if (m || fem) out.push({ grade: g, Male: Number(m?.total ?? 0), Female: Number(fem?.total ?? 0) });
  }
  return out;
}

export type StrandRow = { strand: string; total: number };
export async function getByStrand(f: Filters): Promise<StrandRow[]> {
  const rows = await query<{ strand: string; total: bigint }>(`
    SELECT e.strand, SUM(e.enrollment) total ${JOINED}
    ${where(f, ["e.grade IN ('G11','G12')", 'e.strand IS NOT NULL'])}
    GROUP BY e.strand ORDER BY total DESC
  `);
  return rows.map((r) => ({
    strand: r.strand.replace('ACAD - ', '').replace('ACAD ', ''),
    total: Number(r.total),
  }));
}

export type SectorRow = { sector: string; total: number };
export async function getBySector(f: Filters): Promise<SectorRow[]> {
  const rows = await query<{ Sector: string; total: bigint }>(`
    SELECT s.Sector, SUM(e.enrollment) total ${JOINED} ${where(f)}
    GROUP BY s.Sector ORDER BY total DESC
  `);
  return rows.map((r) => ({ sector: r.Sector, total: Number(r.total) }));
}

// The regions chart ignores the region filter itself, because it always
// shows every region to click. It is the top level picker.
export type RegionRow = { region: string; total: number };
export async function getTopRegions(): Promise<RegionRow[]> {
  const rows = await query<{ Region: string; total: bigint }>(`
    SELECT s.Region, SUM(e.enrollment) total ${JOINED}
    GROUP BY s.Region ORDER BY total DESC
  `);
  return rows.map((r) => ({ region: r.Region, total: Number(r.total) }));
}

// ---- location filter dropdown options ---------------------------------
// Each dropdown's choices are narrowed by the filters above it.
export async function getLevelOptions(level: Level, f: Filters): Promise<string[]> {
  const col = LEVEL_COLUMN[level];
  const rows = await query<{ v: string }>(`
    SELECT DISTINCT "${col}" v FROM schools s ${where(f)} ORDER BY v LIMIT 2000
  `);
  return rows.map((r) => r.v).filter(Boolean);
}

// ---- schools in scope --------------------------------------------------
//
// A name/ID search box used to live here. It was removed instead of
// repaired. It searched "School Name" and ignored "School Name Clean", so
// typing "elementary school" missed 17,494 schools recorded as "ES". It
// also ranked matches by enrollment, so a small school could not be found
// by name at all. A search box that hides what you searched for is worse
// than no search box, because the reader concludes the school is not in
// the data.
//
// The location filter already reaches a single barangay, which is slower
// but honest. What remains is a plain list of what the filter selects.

export type SchoolHit = {
  id: string; name: string; region: string;
  municipality: string; sector: string; total: number;
};

// How many rows the panel renders. The TOTAL is returned alongside so the
// heading can say "the 50 largest of 2,687" instead of "50+".
export const SCHOOLS_SHOWN = 50;

export async function getSchools(
  f: Filters,
): Promise<{ hits: SchoolHit[]; total: number }> {
  const scope = where(f);
  const [rows, counted] = await Promise.all([
    query<{
      id: number; name: string; region: string;
      municipality: string; sector: string; total: number;
    }>(`
      SELECT "BEIS School ID" id, "School Name" name, "Region" region,
             "Municipality" municipality, "Sector" sector, "Total Enrollment" total
      FROM schools s ${scope}
      ORDER BY "Total Enrollment" DESC LIMIT ${SCHOOLS_SHOWN}
    `),
    query<{ v: bigint }>(`SELECT COUNT(*) v FROM schools s ${scope}`),
  ]);
  return {
    hits: rows.map((r) => ({
      id: String(r.id), name: r.name, region: r.region,
      municipality: r.municipality, sector: r.sector, total: Number(r.total),
    })),
    total: Number(counted[0]?.v ?? 0),
  };
}

export type SchoolProfile = {
  info: Record<string, string>;
  total: number; male: number; female: number;
  byGrade: { grade: string; total: number }[];
};

export async function getSchoolProfile(id: string): Promise<SchoolProfile> {
  const esc = id.replace(/'/g, "''");
  const info = await query<Record<string, string>>(`
    SELECT "School Name", "BEIS School ID", "Region", "Province", "Division",
           "Municipality", "Barangay", "Street Address", "Sector",
           "School Type", "Total Enrollment"
    FROM schools WHERE CAST("BEIS School ID" AS VARCHAR) = '${esc}' LIMIT 1
  `);
  const g = await query<{ grade: string; gender: string; total: bigint }>(`
    SELECT e.grade, e.gender, SUM(e.enrollment) total FROM enrollment e
    WHERE CAST(e."BEIS School ID" AS VARCHAR) = '${esc}' GROUP BY e.grade, e.gender
  `);
  const order = ['K', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12', 'Elem NG', 'JHS NG'];
  const byGrade = order.map((gr) => ({
    grade: gr,
    total: g.filter((r) => r.grade === gr).reduce((a, r) => a + Number(r.total), 0),
  })).filter((x) => x.total > 0);
  const male = g.filter((r) => r.gender === 'Male').reduce((a, r) => a + Number(r.total), 0);
  const female = g.filter((r) => r.gender === 'Female').reduce((a, r) => a + Number(r.total), 0);
  return { info: info[0] ?? {}, total: male + female, male, female, byGrade };
}

export { resetToDefault } from './db';

// Strand x gender, showing the gender split within each senior high strand.
export type StrandGenderRow = { strand: string; Male: number; Female: number };
export async function getStrandByGender(f: Filters): Promise<StrandGenderRow[]> {
  const rows = await query<{ strand: string; gender: string; total: bigint }>(`
    SELECT e.strand, e.gender, SUM(e.enrollment) total ${JOINED}
    ${where(f, ["e.grade IN ('G11','G12')", 'e.strand IS NOT NULL'])}
    GROUP BY e.strand, e.gender
  `);
  const map = new Map<string, StrandGenderRow>();
  for (const r of rows) {
    const name = r.strand.replace('ACAD - ', '').replace('ACAD ', '');
    const row = map.get(name) ?? { strand: name, Male: 0, Female: 0 };
    if (r.gender === 'Male') row.Male = Number(r.total);
    else row.Female = Number(r.total);
    map.set(name, row);
  }
  return [...map.values()].sort((a, b) => (b.Male + b.Female) - (a.Male + a.Female));
}

// School offering (Modified COC), the levels each school provides.
export type OfferingRow = { offering: string; schools: number };
export async function getByOffering(f: Filters): Promise<OfferingRow[]> {
  const rows = await query<{ coc: string; n: bigint }>(`
    SELECT "Modified COC" coc, COUNT(*) n FROM schools s ${where(f)}
    GROUP BY "Modified COC" ORDER BY n DESC
  `);
  return rows.map((r) => ({ offering: r.coc, schools: Number(r.n) }));
}