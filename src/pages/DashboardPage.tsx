// src/pages/DashboardPage.tsx
// The public, view-only dashboard. All data management lives at /admin.
//
// Order is an argument, not a layout. The page runs:
//   scene    — what this is, and where the learners are
//   finding  — the one claim this dashboard makes, stated in a sentence
//   evidence — the chart that supports it, benchmarked nationally
//   context  — everything else, for a reader who wants to look around
//   limits   — what none of it can tell you
// Charts used to sit in a flat stack, which left the reader to work out
// the point. Stating it first turns the rest into support.

import { useEffect, useState } from 'react';
import { getDB } from '../lib/db';
import { type Filters, scopeLabel } from '../lib/filters';
import { colors } from '../constants/theme';
import NavHeader from '../components/NavHeader';
import Spinner from '../components/Spinner';
import IntroPanel from '../components/IntroPanel';
import FilterBar from '../components/FilterBar';
import StatCards from '../components/StatCards';
import StorySection from '../components/StorySection';
import AvailabilitySection from '../components/AvailabilitySection';
import InsightsSection from '../components/InsightsSection';
import DropoffSection from '../components/DropoffSection';
import GenderSection from '../components/GenderSection';
import StrandsSection from '../components/StrandsSection';
import SectorSection from '../components/SectorSection';
import RegionsSection from '../components/RegionsSection';
import StrandGenderSection from '../components/StrandGenderSection';
import OfferingSection from '../components/OfferingSection';
import AskSection from '../components/AskSection';
import DataNote from '../components/DataNote';

function ActLabel({ kicker, title, blurb }: { kicker: string; title: string; blurb?: string }) {
  return (
    <div style={{ margin: '34px 0 16px' }}>
      <div
        style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: colors.inkSoft, marginBottom: 6,
        }}
      >
        {kicker}
      </div>
      <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0, color: colors.ink }}>{title}</h2>
      {blurb && (
        <p style={{ fontSize: 13.5, color: colors.inkSoft, margin: '6px 0 0', maxWidth: '68ch', lineHeight: 1.6 }}>
          {blurb}
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [filters, setFilters] = useState<Filters>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getDB().then(() => setReady(true)).catch(() => setReady(true));
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 2rem', color: colors.ink }}>
      <NavHeader />

      {/* Context comes before the spinner: a visitor can read what this is
          while DuckDB and the parquet files are still loading. */}
      <div style={{ marginTop: '1.5rem' }}>
        <IntroPanel />
      </div>

      {!ready && <Spinner />}

      <div style={{ display: ready ? 'block' : 'none' }}>
        {/* ---- Scene ---------------------------------------------------- */}
        <FilterBar filters={filters} onChange={setFilters} />

        <p style={{ fontSize: 14, color: colors.inkSoft, margin: '0 0 20px' }}>
          Showing data for <strong style={{ color: colors.ink }}>{scopeLabel(filters)}</strong>
        </p>

        <StatCards filters={filters} />

        {/* ---- The finding ---------------------------------------------- */}
        <StorySection filters={filters} />

        {/* ---- The evidence --------------------------------------------- */}
        <ActLabel
          kicker="The evidence"
          title="Where strand availability is narrowest"
          blurb="This chart stays national so there is always something to compare against. Pick a region above and it is outlined here rather than isolated."
        />
        <AvailabilitySection filters={filters} />

        {/* ---- Context --------------------------------------------------- */}
        <ActLabel
          kicker="Context"
          title="The rest of the picture"
          blurb="Everything below follows your filter. These describe the dataset rather than argue the finding above — useful for looking around, not for settling the question."
        />

        <div
          style={{
            display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) 1fr',
            gap: 24, alignItems: 'start',
          }}
          className="aralite-cols"
        >
          <div style={{ position: 'sticky', top: 16 }}>
            <InsightsSection filters={filters} />
          </div>
          <div>
            <StrandsSection filters={filters} />
            <SectorSection filters={filters} />
            <OfferingSection filters={filters} />
            <DropoffSection filters={filters} />
            <GenderSection filters={filters} />
            <StrandGenderSection filters={filters} />
            <RegionsSection filters={filters} onPick={(r) => setFilters({ region: r })} />
          </div>
        </div>

        <AskSection />

        {/* ---- Limits ---------------------------------------------------- */}
        <DataNote />
      </div>

      <p style={{ color: colors.inkSoft, fontSize: 12, textAlign: 'center', margin: '8px 0 24px' }}>
        Data: DepEd Learner Information System, SY 2023–2024 · Built with DuckDB-WASM + React
      </p>
    </div>
  );
}