// src/lib/queries.ts
// The service layer: every SQL query lives here, nowhere else.
// Components call these functions — they never write SQL themselves.
// (UI -> hook -> this file -> DuckDB. Same rule as Fyropy.)
//
// Each query takes an optional `region`. When set, we filter to that
// region; when null, we show the whole country. One codepath, both cases.

import { query } from './db';
import { GRADE_ORDER } from '../constants/theme';

// Build a WHERE clause only if a region is chosen. We join enrollment
// to schools because the region lives on the schools table.
function regionFilter(region: string | null): string {
  if (!region) return '';
  // Escape single quotes to keep the SQL safe.
  const safe = region.replace(/'/g, "''");
  return `WHERE s.Region = '${safe}'`;
}

// List of regions for the filter dropdown.
export async function getRegions(): Promise<string[]> {
  const rows = await query<{ Region: string }>(`
    SELECT DISTINCT Region FROM schools ORDER BY Region
  `);
  return rows.map((r) => r.Region);
}

// Total learners (one big number for the hero).
export async function getTotal(region: string | null): Promise<number> {
  const rows = await query<{ total: bigint }>(`
    SELECT SUM(e.enrollment) AS total
    FROM enrollment e
    JOIN schools s ON e.\"BEIS School ID\" = s.\"BEIS School ID\"
    ${regionFilter(region)}
  `);
  return Number(rows[0]?.total ?? 0);
}

// Enrollment per grade, in school-age order (the drop-off story).
export type GradeRow = { grade: string; total: number };
export async function getByGrade(region: string | null): Promise<GradeRow[]> {
  const rows = await query<{ grade: string; total: bigint }>(`
    SELECT e.grade, SUM(e.enrollment) AS total
    FROM enrollment e
    JOIN schools s ON e.\"BEIS School ID\" = s.\"BEIS School ID\"
    ${regionFilter(region)}
    GROUP BY e.grade
  `);
  const ordered: GradeRow[] = [];
  for (const g of GRADE_ORDER) {
    const found = rows.find((r) => r.grade === g);
    if (found) ordered.push({ grade: g, total: Number(found.total) });
  }
  return ordered;
}

// Senior-high enrollment per strand (the SHS choice-gap story).
// Only G11/G12 have strands; we clean up the labels for display.
export type StrandRow = { strand: string; total: number };
export async function getByStrand(region: string | null): Promise<StrandRow[]> {
  const rows = await query<{ strand: string; total: bigint }>(`
    SELECT e.strand, SUM(e.enrollment) AS total
    FROM enrollment e
    JOIN schools s ON e.\"BEIS School ID\" = s.\"BEIS School ID\"
    ${regionFilter(region) || 'WHERE 1=1'}
      AND e.grade IN ('G11', 'G12')
      AND e.strand IS NOT NULL
    GROUP BY e.strand
    ORDER BY total DESC
  `);
  return rows.map((r) => ({
    strand: r.strand.replace('ACAD - ', '').replace('ACAD ', ''),
    total: Number(r.total),
  }));
}

// Top regions by total enrollment (the Regions tab).
export type RegionRow = { region: string; total: number };
export async function getTopRegions(): Promise<RegionRow[]> {
  const rows = await query<{ Region: string; total: bigint }>(`
    SELECT s.Region, SUM(e.enrollment) AS total
    FROM enrollment e
    JOIN schools s ON e.\"BEIS School ID\" = s.\"BEIS School ID\"
    GROUP BY s.Region
    ORDER BY total DESC
  `);
  return rows.map((r) => ({ region: r.Region, total: Number(r.total) }));
}