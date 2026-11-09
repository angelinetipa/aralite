// src/components/HeroBanner.tsx
// The top of the dashboard, kept slim. A deep blue banner with the Aralite
// name and page links on the first row, then the headline, one short line
// and three small figures on one row.
//
// This banner also holds the page header, so the dashboard does not draw
// NavHeader on its own. The Admin page still uses NavHeader in its light
// form.
//
// Color. Blue is the page frame here and nothing else. Yellow only appears
// in the tricolor strip. Chart colors are not touched by this banner.
//
// The numbers are typed in on purpose. This banner shows while DuckDB and
// the parquet files load, so it cannot wait for a query. They describe
// the fixed school year 2023 to 2024 file. If the data file is replaced,
// update them.
//   schools   60,167 unique BEIS school IDs
//   learners  27,081,292 enrolled, shown as 27M
//   regions   17 Philippine regions (PSO overseas schools are not counted)

import { colors } from '../constants/theme';
import NavHeader from './NavHeader';

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '7px 8px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.10)',
        border: '1px solid rgba(255,255,255,0.20)',
      }}
    >
      <div
        className="aralite-display"
        style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.05, color: '#fff' }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.78)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function HeroBanner() {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 20,
        color: '#fff',
        padding: '16px 18px 14px',
        marginBottom: 12,
        background: 'linear-gradient(135deg, #082566 0%, #0038A8 70%, #1B52C4 100%)',
        boxShadow: '0 12px 26px rgba(8,37,102,0.26)',
      }}
    >
      {/* Slim tricolor strip along the top edge. It evokes the Philippine
          flag without using any official logo. */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 5,
          background: `linear-gradient(90deg, ${colors.blue} 0 33%, ${colors.red} 33% 66%, ${colors.yellow} 66% 100%)`,
        }}
      />

      <NavHeader dark />

      <div style={{ height: 1, background: 'rgba(255,255,255,0.16)', margin: '10px 0' }} />

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: '1 1 360px', minWidth: 0 }}>
          <h2 style={{ fontSize: 21, fontWeight: 800, margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            Where 27 million Filipino learners go to school.
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.84)', lineHeight: 1.5, margin: '4px 0 0', maxWidth: '64ch' }}>
            Aralite turns DepEd enrollment data for school year 2023 to 2024 into a dashboard
            that runs in your browser. Start with the finding below.
          </p>
        </div>

        <div
          style={{
            flex: '0 1 330px',
            minWidth: 240,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
        >
          <Figure value="60,167" label="schools" />
          <Figure value="27M" label="learners" />
          <Figure value="17" label="regions" />
        </div>
      </div>
    </div>
  );
}