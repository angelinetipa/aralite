// src/lib/filters.ts
// One shared definition of the location filter used across the whole
// app. Every chart, insight, and query reads from this single shape,
// so "filter the dashboard" means the same thing everywhere.

export type Filters = {
  region?: string;
  province?: string;
  division?: string;
  municipality?: string;
  barangay?: string;
};

// The five levels, from widest to narrowest. Order matters: picking a
// higher level clears the narrower ones below it.
export const LEVELS = ['region', 'province', 'division', 'municipality', 'barangay'] as const;
export type Level = typeof LEVELS[number];

// Map each level to its real column name in the data.
export const LEVEL_COLUMN: Record<Level, string> = {
  region: 'Region',
  province: 'Province',
  division: 'Division',
  municipality: 'Municipality',
  barangay: 'Barangay',
};

// Build a SQL condition list from the active filters. Used by every
// query so filtering behaves identically across the dashboard.
// `alias` is the schools-table alias in that query (e.g. 's').
export function filterConditions(f: Filters, alias = 's'): string[] {
  const esc = (v: string) => v.replace(/'/g, "''");
  const parts: string[] = [];
  for (const lvl of LEVELS) {
    const val = f[lvl];
    if (val) parts.push(`${alias}."${LEVEL_COLUMN[lvl]}" = '${esc(val)}'`);
  }
  return parts;
}

// Human label for the current scope, e.g. "Barangay Poblacion" or
// "the country" when nothing is selected.
export function scopeLabel(f: Filters): string {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const val = f[LEVELS[i]];
    if (val) return val;
  }
  return 'the country';
}