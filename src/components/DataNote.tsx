// src/components/DataNote.tsx
// Provenance and limits, stated plainly in the product instead of buried
// in a README. Saying what the data cannot answer is what stops someone
// from drawing a conclusion it does not support.

import { colors, clay } from '../constants/theme';

const FACTS = [
  { label: 'Source', value: 'DepEd Learner Information System' },
  { label: 'Coverage', value: 'School year 2023–2024' },
  { label: 'Rows', value: '60,171 schools' },
  { label: 'Grain', value: 'One row per school, not per learner' },
];

const LIMITS = [
  'This is a one-time snapshot, not a live feed. It cannot show trends across school years.',
  'Counts are per school, so it cannot follow individual learners or say why anyone left.',
  'The Grade 6 to 7 gap is a difference between two grade levels in one year. It is a signal worth investigating, not a measured dropout rate.',
];

export default function DataNote() {
  return (
    <div style={{ ...clay.card, padding: '1.4rem 1.5rem', margin: '28px 0 20px' }}>
      <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 14px' }}>About this data</h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          paddingBottom: 16,
          marginBottom: 16,
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
                marginBottom: 4,
              }}
            >
              {f.label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{f.value}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: colors.red,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 8,
        }}
      >
        What this data cannot tell you
      </div>

      <ul style={{ margin: 0, paddingLeft: 18, color: colors.inkSoft }}>
        {LIMITS.map((l) => (
          <li key={l} style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 6 }}>
            {l}
          </li>
        ))}
      </ul>

      <p style={{ fontSize: 12.5, color: colors.inkSoft, margin: '14px 0 0', lineHeight: 1.6 }}>
        <strong style={{ color: colors.ink }}>Nothing was deleted.</strong> The cleaning script only
        repairs values and adds standardized copies beside them, so every original figure is still
        there and any number here can be traced back to the source file.
      </p>

      <p style={{ fontSize: 12.5, color: colors.inkSoft, margin: '10px 0 0', lineHeight: 1.6 }}>
        Cleaned with Python and pandas, stored as Parquet, queried with DuckDB-WASM. Aralite grew out
        of a university course case study and is an independent project, not affiliated with the
        Department of Education.
      </p>
    </div>
  );
}