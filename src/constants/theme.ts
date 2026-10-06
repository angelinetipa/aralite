// src/constants/theme.ts
// One source of truth for the Aralite identity.
//
// COLOR RULES (each color means ONE thing):
//   gray      -> default. Every bar/line starts here.
//   highlight -> the one thing the reader should look at.
//   worse     -> worse than the national figure. Nothing else is red.
//   better    -> better than the national figure.
//
// The flag colors (blue, red, yellow) stay for the brand strip and
// badges. Charts should use the semantic tokens below, not raw colors.

export const colors = {
  // Brand
  blue: '#0038A8',
  blueSoft: '#9BB4DB',
  red: '#CE1126',
  yellow: '#FCD116',

  // Text and surfaces
  ink: '#1F1D1A',
  inkSoft: '#6B6862',
  line: '#E7E3D8',
  surface: '#FFFFFF',

  // Chart roles
  gray: '#C9C5BA',       // default bar
  grayDark: '#8C887E',   // second neutral (e.g. two series, no emphasis)
  highlight: '#0038A8',  // the one thing to look at
  worse: '#CE1126',      // worse than national
  better: '#9BB4DB',     // better than national
} as const;

// Claymorphism-lite: rounded, soft drop shadow, faint top highlight.
export const clay = {
  card: {
    background: 'linear-gradient(180deg, #FFFFFF 0%, #FBFAF6 100%)',
    border: '1px solid rgba(0,0,0,0.05)',
    borderRadius: 20,
    boxShadow:
      '0 10px 24px rgba(31,29,26,0.08), 0 2px 6px rgba(31,29,26,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
  },
} as const;

export const GRADE_ORDER = [
  'K', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6',
  'G7', 'G8', 'G9', 'G10', 'G11', 'G12',
] as const;