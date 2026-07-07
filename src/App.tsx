// src/App.tsx
// One-page dashboard shell: header, optional "using your data" banner,
// region filter, then every section stacked. One region state drives
// all charts. `dataVersion` bumps whenever the data source changes
// (upload or reset) — bumping it remounts the sections so they re-query.

import { useEffect, useState } from 'react';
import { getRegions, resetToDefault } from './lib/queries';
import { getDB } from './lib/db';
import { colors } from './constants/theme';
import Spinner from './components/Spinner';
import StatCards from './components/StatCards';
import InsightsSection from './components/InsightsSection';
import DropoffSection from './components/DropoffSection';
import GenderSection from './components/GenderSection';
import StrandsSection from './components/StrandsSection';
import SectorSection from './components/SectorSection';
import RegionsSection from './components/RegionsSection';
import UploadSection from './components/UploadSection';

export default function App() {
  const [region, setRegion] = useState<string | null>(null);
  const [regions, setRegions] = useState<string[]>([]);
  const [dataVersion, setDataVersion] = useState(0);
  const [source, setSource] = useState<string | null>(null); // uploaded file name
  const [ready, setReady] = useState(false);

  // Warm up DuckDB + load region list once, THEN reveal the dashboard.
  // This way the whole page appears together instead of six sections
  // each flashing their own loading text.
  useEffect(() => {
    setReady(false);
    getDB()
      .then(() => getRegions())
      .then((r) => { setRegions(r); setReady(true); })
      .catch(() => { setRegions([]); setReady(true); });
  }, [dataVersion]);

  function handleDataLoaded(name: string) {
    setSource(name);
    setRegion(null);
    setDataVersion((v) => v + 1); // remounts sections -> re-query new data
  }

  async function handleReset() {
    await resetToDefault();
    setSource(null);
    setRegion(null);
    setDataVersion((v) => v + 1);
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 2rem', color: colors.ink }}>

      {/* Header */}
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

      {/* Banner shown only when viewing an uploaded dataset */}
      {source && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          margin: '1.2rem 0', padding: '10px 16px', borderRadius: 12,
          background: '#EAF0FB', border: `1px solid ${colors.blueSoft}`,
        }}>
          <span style={{ fontSize: 14, color: colors.blue }}>
            Showing your uploaded data: <strong>{source}</strong>
          </span>
          <button
            onClick={handleReset}
            style={{
              padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
              border: 'none', background: colors.blue, color: '#fff', fontWeight: 600,
            }}
          >
            Back to DepEd data
          </button>
        </div>
      )}

      {/* Region filter */}
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

      {/* One spinner while DuckDB warms up; then all sections at once */}
      {!ready && <Spinner />}

      {/* Sections keyed by dataVersion so they re-query on data change */}
      <div key={dataVersion} style={{ display: ready ? 'block' : 'none' }}>
        <StatCards region={region} />

        {/* Two columns on desktop: findings (sticky) left, charts right.
            Stacks to one column on narrow screens via CSS grid auto-fit. */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 340px) 1fr',
          gap: 24,
          alignItems: 'start',
        }}
        className="aralite-cols">
          {/* Sticky = stays on screen while the charts scroll past */}
          <div style={{ position: 'sticky', top: 16 }}>
            <InsightsSection region={region} />
          </div>

          <div>
            <DropoffSection region={region} />
            <GenderSection region={region} />
            <StrandsSection region={region} />
            <SectorSection region={region} />
            <RegionsSection region={region} onPick={(r) => setRegion(r)} />
          </div>
        </div>
      </div>

      <UploadSection onDataLoaded={handleDataLoaded} />

      <p style={{ color: colors.inkSoft, fontSize: 12, textAlign: 'center', margin: '8px 0 24px' }}>
        Data: DepEd Learner Information System, SY 2023–2024 · Built with DuckDB-WASM + React
      </p>
    </div>
  );
}