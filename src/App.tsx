// src/App.tsx
// One-page dashboard shell: header, region filter, then every section
// stacked. One region state drives all charts.

import { useEffect, useState } from 'react';
import { getRegions } from './lib/queries';
import { colors } from './constants/theme';
import StatCards from './components/StatCards';
import DropoffSection from './components/DropoffSection';
import GenderSection from './components/GenderSection';
import StrandsSection from './components/StrandsSection';
import SectorSection from './components/SectorSection';
import RegionsSection from './components/RegionsSection';

export default function App() {
  const [region, setRegion] = useState<string | null>(null);
  const [regions, setRegions] = useState<string[]>([]);

  useEffect(() => {
    getRegions().then(setRegions).catch(() => setRegions([]));
  }, []);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '2.5rem 1.5rem', color: colors.ink }}>

      {/* Header — yellow clay bar as the Aralite mark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 10, height: 40, borderRadius: 6,
          background: `linear-gradient(180deg, ${colors.yellow}, #E8B90A)`,
          boxShadow: '0 4px 10px rgba(252,209,22,0.45)',
        }} />
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Aralite
          </h1>
          <p style={{ color: colors.inkSoft, margin: 0, fontSize: 14 }}>
            DepEd enrollment · SY 2023–2024 · in-browser SQL analytics
          </p>
        </div>
      </div>

      {/* Region filter — drives every chart */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '1.6rem 0' }}>
        <label style={{ fontSize: 14, color: colors.inkSoft }}>Region</label>
        <select
          value={region ?? ''}
          onChange={(e) => setRegion(e.target.value || null)}
          style={{
            padding: '9px 14px', borderRadius: 12, fontSize: 14,
            border: '1px solid rgba(0,0,0,0.08)', background: colors.surface,
            boxShadow: '0 3px 8px rgba(31,29,26,0.06)',
          }}
        >
          <option value="">All regions (nationwide)</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        {region && (
          <button
            onClick={() => setRegion(null)}
            style={{
              padding: '9px 14px', borderRadius: 12, cursor: 'pointer', fontSize: 14,
              border: '1px solid rgba(0,0,0,0.08)', background: colors.surface,
              boxShadow: '0 3px 8px rgba(31,29,26,0.06)',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* One look, all insights */}
      <StatCards region={region} />
      <DropoffSection region={region} />
      <GenderSection region={region} />

      {/* Two smaller charts side by side on wide screens */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 0, columnGap: 20 }}>
        <StrandsSection region={region} />
        <SectorSection region={region} />
      </div>

      <RegionsSection region={region} onPick={(r) => setRegion(r)} />

      <p style={{ color: colors.inkSoft, fontSize: 12, textAlign: 'center', margin: '8px 0 24px' }}>
        Data: DepEd Learner Information System, SY 2023–2024 · Built with DuckDB-WASM + React
      </p>
    </div>
  );
}