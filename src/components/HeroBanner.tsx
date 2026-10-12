// src/components/HeroBanner.tsx
// The top of the dashboard. A deep blue banner with the Aralite name and
// the page links on the first row, then the headline, two short sentences
// and three big numbers.
//
// This replaces IntroPanel. It also holds the page header, so the
// dashboard no longer draws NavHeader on its own. The Admin page still
// uses NavHeader in its light form.
//
// Color. Blue is the page frame here and nothing else. The yellow is
// decoration only: a short line under the headline and a soft glow in the
// corner. Neither color carries any meaning, and chart colors are not
// touched by this banner.
//
// The numbers are typed in on purpose. This banner shows while DuckDB and
// the parquet files load, so it cannot wait for a query. They describe
// the fixed school year 2023 to 2024 file. If the data file is replaced,
// update them.
//   schools   60,167 unique BEIS school IDs
//   learners  27,081,292 enrolled, shown as 27M
//   regions   17 Philippine regions (the PSO overseas schools are not
//             counted as a region)

import { colors } from '../constants/theme';
import NavHeader from './NavHeader';

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '12px 8px',
        borderRadius: 16,
        background: 'rgba(255,255,255,0.10)',
        border: '1px solid rgba(255,255,255,0.20)',
      }}
    >
      <div
        className="aralite-display"
        style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.05, color: '#fff' }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.78)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function HeroBanner() {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 24,
        color: '#fff',
        padding: '20px 22px 22px',
        marginBottom: 18,
        background:
          'radial-gradient(circle at 92% -10%, rgba(252,209,22,0.22), transparent 45%), ' +
          'linear-gradient(135deg, #082566 0%, #0038A8 70%, #1B52C4 100%)',
        boxShadow: '0 14px 30px rgba(8,37,102,0.28)',
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

      <div style={{ height: 1, background: 'rgba(255,255,255,0.16)', margin: '14px 0 16px' }} />

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
        <div style={{ flex: '1 1 380px', minWidth: 0 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            Where 27 million Filipino learners go to school.
          </h2>
          <div
            style={{
              width: 52, height: 4, borderRadius: 4, margin: '10px 0 10px',
              background: colors.yellow,
            }}
          />
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.86)', lineHeight: 1.55, margin: 0, maxWidth: '62ch' }}>
            Aralite turns the Department of Education&rsquo;s enrollment file for school
            year 2023 to 2024 into a dashboard. It runs entirely in your browser.
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.86)', lineHeight: 1.55, margin: '4px 0 0', maxWidth: '62ch' }}>
            Start with the main finding below. Then pick your own region to compare it with
            the country.
          </p>
        </div>

        <div
          style={{
            flex: '1 1 340px',
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
    </div>
  );
}