// src/components/DataNote.tsx
// Provenance and limits, stated plainly in the product instead of buried
// in a README. Saying what the data cannot answer is what stops someone
// from drawing a conclusion it does not support.
//
// Layout. One compact card that fills its grid cell. The four facts sit
// in a row. The limits flow into columns, so the list stays short.

import { colors, clay } from '../constants/theme';

const FACTS = [
  { label: 'Source', value: 'DepEd Learner Information System' },
  { label: 'Coverage', value: 'School year 2023 to 2024' },
  { label: 'Rows', value: '60,167 schools' },
  { label: 'Grain', value: 'One row per school, not per learner' },
];

const LIMITS = [
  'This is a one time snapshot, not a live feed. It cannot show trends across school years.',
  'Counts are per school, so it cannot follow individual learners or say why anyone left.',
  'Strand availability is inferred from enrollment, because the source file has no column for strands offered.',
  'Enrollment is not preference. A learner can only enrol in a strand their school runs.',
  'The largest gap between grade levels compares two groups counted in the same year. It is a signal worth investigating, not a measured dropout rate.',
];

export default function DataNote() {
  return (
    <div
      className="aralite-card"
      style={{
        ...clay.card,
        padding: '0.9rem 1.1rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <h2 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 8px', color: colors.ink }}>
        About this data
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
          paddingBottom: 10,
          marginBottom: 10,
          borderBottom: `1px solid ${colors.line}`,
        }}
      >
        {FACTS.map((f) => (
          <div key={f.label}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: colors.inkSoft,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 3,
              }}
            >
              {f.label}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35 }}>{f.value}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: colors.ink,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 6,
        }}
      >
        What this data cannot tell you
      </div>

      {/* Columns of at least 240px, so the list reads in two columns on
          wide cards and one on narrow ones. */}
      <ul style={{ margin: 0, paddingLeft: 18, color: colors.inkSoft, columns: '240px', columnGap: 24 }}>
        {LIMITS.map((l) => (
          <li key={l} style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 4, breakInside: 'avoid' }}>
            {l}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 'auto', paddingTop: 8 }}>
        <p style={{ fontSize: 12.5, color: colors.inkSoft, margin: 0, lineHeight: 1.55 }}>
          <strong style={{ color: colors.ink }}>Nothing was deleted.</strong> The cleaning script only
          repairs values and adds standardized copies beside them, so any number here can be traced
          back to the source file.
        </p>
        <p style={{ fontSize: 12.5, color: colors.inkSoft, margin: '4px 0 0', lineHeight: 1.55 }}>
          Cleaned with Python and pandas, stored as Parquet, queried with DuckDB-WASM. Aralite grew out
          of a university course case study and is an independent project, not affiliated with the
          Department of Education.
        </p>
      </div>
    </div>
  );
}