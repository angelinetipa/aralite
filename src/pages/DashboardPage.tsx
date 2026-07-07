// src/pages/DashboardPage.tsx
// The public, view-only dashboard. All data management moved to /admin.
// Location filters drive every chart and insight.

import { useEffect, useState } from 'react';
import { getDB } from '../lib/db';
import { type Filters, scopeLabel } from '../lib/filters';
import { colors } from '../constants/theme';
import NavHeader from '../components/NavHeader';
import Spinner from '../components/Spinner';
import FilterBar from '../components/FilterBar';
import StatCards from '../components/StatCards';
import InsightsSection from '../components/InsightsSection';
import DropoffSection from '../components/DropoffSection';
import GenderSection from '../components/GenderSection';
import StrandsSection from '../components/StrandsSection';
import SectorSection from '../components/SectorSection';
import RegionsSection from '../components/RegionsSection';
import StrandGenderSection from '../components/StrandGenderSection';
import OfferingSection from '../components/OfferingSection';
import AskSection from '../components/AskSection';

export default function DashboardPage() {
  const [filters, setFilters] = useState<Filters>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getDB().then(() => setReady(true)).catch(() => setReady(true));
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 2rem', color: colors.ink }}>
      <NavHeader />

      {!ready && <Spinner />}

      <div style={{ display: ready ? 'block' : 'none', marginTop: '1.5rem' }}>
        <FilterBar filters={filters} onChange={setFilters} />

        <p style={{ fontSize: 14, color: colors.inkSoft, margin: '0 0 20px' }}>
          Showing data for <strong style={{ color: colors.ink }}>{scopeLabel(filters)}</strong>
        </p>

        <StatCards filters={filters} />

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
            <StrandGenderSection filters={filters} />
            <SectorSection filters={filters} />
            <OfferingSection filters={filters} />
            <RegionsSection filters={filters} onPick={(r) => setFilters({ region: r })} />
          </div>
        </div>

        <AskSection />
      </div>

      <p style={{ color: colors.inkSoft, fontSize: 12, textAlign: 'center', margin: '8px 0 24px' }}>
        Data: DepEd Learner Information System, SY 2023–2024 · Built with DuckDB-WASM + React
      </p>
    </div>
  );
}