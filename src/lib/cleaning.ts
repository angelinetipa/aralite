// src/lib/cleaning.ts
// ALL cleaning rules in one file — the browser version of pipeline/clean.py.
// Read top to bottom to learn what each rule does and why.
// These rules are GENERIC: they repair values but never delete rows
// or columns (the zero-data-loss rule).

export type CleanReport = {
  rows: number;
  cols: number;
  mojibakeFixed: number;   // Ã‘ -> Ñ style repairs
  whitespaceFixed: number; // trimmed / double spaces collapsed
  emptiesFilled: number;   // blank cells -> "Not Provided"
};

// RULE 1 — Fix mojibake.
// Text saved as UTF-8 but read as Latin-1 turns "Ñ" into "Ã‘".
// We reverse the bad decode instead of deleting the weird characters —
// deleting would corrupt real place names.
function fixMojibake(text: string): string {
  if (!/[ÃÂ]/.test(text)) return text; // cheap check first
  try {
    // escape() gives Latin-1 style bytes; decodeURIComponent reads
    // them back as UTF-8 — the same round-trip as Python's
    // .encode('latin-1').decode('utf-8').
    const repaired = decodeURIComponent(escape(text));
    return repaired;
  } catch {
    return text; // not mojibake — leave untouched
  }
}

// RULE 2 — Normalize whitespace.
// "Bacarra  I" and "Bacarra I" must count as ONE value in groupings.
// We trim the edges and collapse repeated spaces.
function squeezeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

// RULE 3 — Fill empty cells with an explicit label.
// An explicit "Not Provided" is honest and filterable; a silent blank
// hides missing data. We never drop the row.
const EMPTY_LABEL = 'Not Provided';

// Run all rules over a table (array of row objects from CSV/Excel).
// Returns the cleaned table plus a report you can show the user —
// a data engineer proves what changed, never says "trust me".
export function cleanTable(
  rows: Record<string, unknown>[]
): { cleaned: Record<string, unknown>[]; report: CleanReport } {
  let mojibakeFixed = 0;
  let whitespaceFixed = 0;
  let emptiesFilled = 0;

  const cleaned = rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (value === null || value === undefined || value === '') {
        out[key] = EMPTY_LABEL;
        emptiesFilled++;
      } else if (typeof value === 'string') {
        let v = fixMojibake(value);
        if (v !== value) mojibakeFixed++;
        const squeezed = squeezeWhitespace(v);
        if (squeezed !== v) whitespaceFixed++;
        out[key] = squeezed;
      } else {
        out[key] = value; // numbers pass through untouched
      }
    }
    return out;
  });

  return {
    cleaned,
    report: {
      rows: cleaned.length,
      cols: cleaned[0] ? Object.keys(cleaned[0]).length : 0,
      mojibakeFixed,
      whitespaceFixed,
      emptiesFilled,
    },
  };
}

// Detect if an uploaded file matches the DepEd enrollment format —
// used to decide whether "Load into dashboard" is safe to offer.
export function looksLikeDepEd(rows: Record<string, unknown>[]): boolean {
  if (!rows[0]) return false;
  const cols = Object.keys(rows[0]);
  const required = ['Region', 'BEIS School ID', 'School Name'];
  return required.every((c) => cols.includes(c));
}

// Turn the cleaned table back into a CSV string for download.
// Quotes any value containing commas/quotes/newlines (CSV rules).
export function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows[0]) return '';
  const cols = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.join(',')];
  for (const row of rows) {
    lines.push(cols.map((c) => escape(row[c])).join(','));
  }
  return lines.join('\n');
}