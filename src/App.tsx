// src/App.tsx
// One-page dashboard shell. The FilterBar (5 location levels) drives
// every chart and insight. `dataVersion` bumps when the data source
// changes (upload/reset), remounting sections so they re-query.

import { useEffect, useState } from 'react';
import { getDB } from './lib/db';
import { resetToDefault } from './lib/queries';
import { type Filters, scopeLabel } from './lib/filters';
import { colors } from './constants/theme';
import Spinner from './components/Spinner';
import FilterBar from './components/FilterBar';
import StatCards from './components/StatCards';
import InsightsSection from './components/InsightsSection';
import DropoffSection from './components/DropoffSection';
import GenderSection from './components/GenderSection';
import StrandsSection from './components/StrandsSection';
import SectorSection from './components/SectorSection';
import RegionsSection from './components/RegionsSection';
import FinderSection from './components/FinderSection';
import UploadSection from './components/UploadSection';

export default function App() {
  const [filters, setFilters] = useState<Filters>({});
  const [dataVersion, setDataVersion] = useState(0);
  const [source, setSource] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Warm up DuckDB once, then reveal the whole dashboard together.
  useEffect(() => {
    setReady(false);
    getDB().then(() => setReady(true)).catch(() => setReady(true));
  }, [dataVersion]);

  function handleDataLoaded(name: string) {
    setSource(name);
    setFilters({});
    setDataVersion((v) => v + 1);
  }

  async function handleReset() {
    await resetToDefault();
    setSource(null);
    setFilters({});
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

      {/* Uploaded-data banner */}
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

      {!ready && <Spinner />}

      <div key={dataVersion} style={{ display: ready ? 'block' : 'none', marginTop: '1.5rem' }}>

        {/* Main control: location filters drive everything below */}
        <FilterBar filters={filters} onChange={setFilters} />

        {/* Scope note */}
        <p style={{ fontSize: 14, color: colors.inkSoft, margin: '0 0 20px' }}>
          Showing data for <strong style={{ color: colors.ink }}>{scopeLabel(filters)}</strong>
        </p>

        <StatCards filters={filters} />

        {/* Findings (sticky) left, charts right */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) 1fr',
          gap: 24, alignItems: 'start',
        }} className="aralite-cols">
          <div style={{ position: 'sticky', top: 16 }}>
            <InsightsSection filters={filters} />
          </div>
          <div>
            <DropoffSection filters={filters} />
            <GenderSection filters={filters} />
            <StrandsSection filters={filters} />
            <SectorSection filters={filters} />
            <RegionsSection
              filters={filters}
              onPick={(r) => setFilters({ region: r })}
            />
          </div>
        </div>

        <FinderSection />
      </div>

      <UploadSection onDataLoaded={handleDataLoaded} />

      <p style={{ color: colors.inkSoft, fontSize: 12, textAlign: 'center', margin: '8px 0 24px' }}>
        Data: DepEd Learner Information System, SY 2023–2024 · Built with DuckDB-WASM + React
      </p>
    </div>
  );
}