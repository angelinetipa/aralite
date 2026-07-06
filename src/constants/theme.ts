// src/constants/theme.ts
// All colors in one place (same pattern as Fyropy). The palette is the
// DepEd / Philippine flag identity — this is what makes Aralite look
// like it belongs to education data, not a generic template.

export const colors = {
  blue: '#0038A8', // flag blue — primary, structure, trust
  red: '#CE1126', // flag red — alerts, the drop-off story
  yellow: '#FCD116', // flag sun — highlights, accents

  ink: '#1A1A1A',
  inkSoft: '#5F5E5A',
  line: '#E5E3DC',
  surface: '#FFFFFF',
  bg: '#FAF9F5',
} as const;

// School-age order for grades. DuckDB returns them alphabetically
// (G1, G10, G11...) which is wrong for a trend line — we sort by this.
export const GRADE_ORDER = [
  'K', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6',
  'G7', 'G8', 'G9', 'G10', 'G11', 'G12',
] as const;