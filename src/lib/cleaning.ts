// src/lib/cleaning.ts
// ALL browser cleaning rules in one file — the JS twin of
// pipeline/clean.py. Read top to bottom to learn each rule and why.
// Rules REPAIR values but never delete rows or columns (zero data loss).

export type CleanReport = {
  rows: number;
  cols: number;
  mojibakeFixed: number;    // Ã‘ -> Ñ style repairs
  junkStripped: number;     // leading -, #, *, quotes removed
  whitespaceFixed: number;  // trimmed / double spaces collapsed
  invalidLabeled: number;   // 'N/A', 'NONE', '-', blanks -> "Not Provided"
  namesStandardized: number; // ES -> Elementary School (new column)
};

// RULE 1 — Fix mojibake. Text saved as UTF-8 but read as Latin-1 turns
// "Ñ" into "Ã‘". We reverse the bad decode instead of deleting.
function fixMojibake(text: string): string {
  if (!/[ÃÂ]/.test(text)) return text;
  try {
    return decodeURIComponent(escape(text));
  } catch {
    return text;
  }
}

// RULE 2 — Strip leading junk characters (-, #, *, ., quotes) that are
// data-entry noise, then normalize whitespace so "A  B" == "A B".
function tidy(text: string): string {
  return text.replace(/^[-#*.'"\s]+/, '').replace(/\s+/g, ' ').trim();
}

// RULE 3 — Replace invalid/placeholder text with an explicit label.
// 'N/A', 'NONE', '-' etc. are noise pretending to be data. An explicit
// "Not Provided" is honest and filterable. (Numbers are untouched —
// a 0 enrollment is real information.)
const INVALID = new Set(['N/A', 'NA', 'N.A.', 'N / A', '-', '*', '0', '.', "'", 'NONE', 'NULL', '']);
const EMPTY_LABEL = 'Not Provided';

// RULE 4 — Standardize school-name abbreviations into a NEW column
// ("School Name Clean") so the official name is never altered.
const ABBREV: [RegExp, string][] = [
  [/\bE\/S\b/g, 'Elementary School'],
  [/\bElem\.?\b/g, 'Elementary School'],
  [/\bES\b/g, 'Elementary School'],
  [/\bNHS\b/g, 'National High School'],
  [/\bCES\b/g, 'Central Elementary School'],
  [/\bCS\b/g, 'Central School'],
  [/\bP\/S\b/g, 'Primary School'],
  [/\bPS\b/g, 'Primary School'],
  [/\bHS\b/g, 'High School'],
  [/\bLC\b/g, 'Learning Center'],
  [/\bSch\.\B/g, 'School'],
  [/\bMem\.\B/g, 'Memorial'],
  [/\bIncorporated\b/g, 'Inc.'],
];

function expandName(name: string): string {
  let out = name;
  for (const [pat, repl] of ABBREV) out = out.replace(pat, repl);
  return out.replace(/\s+/g, ' ').trim();
}

// RULE 4b — Clean Street Address into a NEW column (future-ready for
// maps/geocoding). Free-text, so we only do safe tidying; original kept.
function cleanAddress(addr: string): string {
  let a = addr.replace(/^[-#*.'"\s]+/, '');   // strip leading junk
  a = a.replace(/,(\S)/g, ', $1');             // space after commas
  a = a.replace(/\bBrgy\.?/gi, 'Barangay');
  a = a.replace(/\bSt\.(?=\s|$)/gi, 'Street');
  a = a.replace(/\s+/g, ' ').trim();
  if (a === a.toUpperCase() && /[A-Z]/.test(a)) {
    a = a.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }
  if (INVALID.has(a.toUpperCase()) || a === '') return EMPTY_LABEL;
  return a;
}

// Run all rules over a table (array of row objects from CSV/Excel).
// Returns the cleaned table + a report — proof, never "trust me".
export function cleanTable(
  rows: Record<string, unknown>[]
): { cleaned: Record<string, unknown>[]; report: CleanReport } {
  let mojibakeFixed = 0, junkStripped = 0, whitespaceFixed = 0;
  let invalidLabeled = 0, namesStandardized = 0;

  const cleaned = rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'string') {
        const v = fixMojibake(value);
        if (v !== value) mojibakeFixed++;
        const hadJunk = /^[-#*.'"\s]/.test(v) && !INVALID.has(v.trim().toUpperCase());
        const t = tidy(v);
        if (hadJunk) junkStripped++;
        else if (t !== v) whitespaceFixed++;
        if (INVALID.has(t.toUpperCase())) {
          out[key] = EMPTY_LABEL;
          invalidLabeled++;
        } else {
          out[key] = t;
        }
      } else if (value === null || value === undefined) {
        out[key] = EMPTY_LABEL;
        invalidLabeled++;
      } else {
        out[key] = value; // numbers pass through untouched
      }
    }
    // RULE 4 applies only when a School Name column exists.
    if (typeof out['School Name'] === 'string') {
      const clean = expandName(out['School Name'] as string);
      out['School Name Clean'] = clean;
      if (clean !== out['School Name']) namesStandardized++;
    }
    // RULE 4b — future-ready cleaned address column.
    if (typeof out['Street Address'] === 'string') {
      out['Street Address Clean'] = cleanAddress(out['Street Address'] as string);
    }
    return out;
  });

  return {
    cleaned,
    report: {
      rows: cleaned.length,
      cols: cleaned[0] ? Object.keys(cleaned[0]).length : 0,
      mojibakeFixed, junkStripped, whitespaceFixed,
      invalidLabeled, namesStandardized,
    },
  };
}

// Detect if a file matches the DepEd enrollment format.
export function looksLikeDepEd(rows: Record<string, unknown>[]): boolean {
  if (!rows[0]) return false;
  const cols = Object.keys(rows[0]);
  return ['Region', 'BEIS School ID', 'School Name'].every((c) => cols.includes(c));
}

// Turn the cleaned table back into a CSV string for download.
export function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows[0]) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.join(',')];
  for (const row of rows) lines.push(cols.map((c) => esc(row[c])).join(','));
  return lines.join('\n');
}