// src/components/IntroPanel.tsx
// The first thing a visitor sees. A slim banner with the headline and two
// short sentences on the left, and three big numbers on the right.
//
// The numbers are typed in on purpose. This banner shows while DuckDB and
// the parquet files load, so it cannot wait for a query. They describe
// the fixed school year 2023 to 2024 file. If the data file is replaced,
// update them.
//   schools   60,167 unique BEIS school IDs
//   learners  27,081,292 enrolled, shown as 27M
//   regions   17 Philippine regions (the PSO overseas schools are not
//             counted as a region)

import type { ReactNode } from 'react';
import { colors, clay } from '../constants/theme';

function Figure({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '10px 8px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.75)',
        border: `1px solid ${colors.line}`,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.05, color: colors.ink }}>
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: colors.inkSoft, marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function IntroPanel() {
  return (
    <div
      style={{
        ...clay.card,
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F1F4FB 100%)',
        padding: '1rem 1.2rem',
        marginBottom: 14,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div style={{ flex: '1 1 340px', minWidth: 0 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
          }}
        >
          Where 27 million Filipino learners go to school.
        </h2>

        <p style={{ fontSize: 14, color: colors.inkSoft, lineHeight: 1.55, margin: '6px 0 0', maxWidth: '62ch' }}>
          Aralite turns the Department of Education&rsquo;s enrollment file for school
          year 2023 to 2024 into a dashboard. It runs entirely in your browser.
        </p>

        <p style={{ fontSize: 14, color: colors.inkSoft, lineHeight: 1.55, margin: '4px 0 0', maxWidth: '62ch' }}>
          Start with the main finding below. Then pick your own region to compare it with
          the country.
        </p>
      </div>

      <div
        style={{
          flex: '1 1 320px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
        }}
      >
        <Figure value="60,167" label="schools" />
        <Figure value="27M" label="learners" />
        <Figure value="17" label="regions" />
      </div>
    </div>
  );
}