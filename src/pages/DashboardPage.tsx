// src/pages/DashboardPage.tsx
// The public dashboard. All data management lives at /admin.
//
// Order is an argument, not a layout:
//   intro     what this is, in two sentences
//   finding   the one claim, always national
//   evidence  two charts that support it, beside the finding
//   so what   where to act first, as a strip under the charts
//             (finding, evidence and so what share one screen)
//   explore   the filter, and everything that follows it
//   context   six more charts, collapsed by default
//   tools     ask the data yourself
//   limits    what none of it can tell you
//
// Everything above "Explore your area" is national and never changes
// when the filter moves. That keeps the top of the page stable. Only the
// sections below the filter respond to it.

import { useEffect, useState } from 'react';
import { getDB } from '../lib/db';
import { type Filters, scopeLabel } from '../lib/filters';
import { colors } from '../constants/theme';
import NavHeader from '../components/NavHeader';
import Spinner from '../components/Spinner';
import IntroPanel from '../components/IntroPanel';
import FilterBar from '../components/FilterBar';
import SchoolPanel from '../components/SchoolPanel';
import StatCards from '../components/StatCards';
import StorySection from '../components/StorySection';
import AvailabilitySection from '../components/AvailabilitySection';
import RecommendationSection from '../components/RecommendationSection';
import InsightsSection from '../components/InsightsSection';
import DropoffSection from '../components/DropoffSection';
import StrandsSection from '../components/StrandsSection';
import SectorSection from '../components/SectorSection';
import RegionsSection from '../components/RegionsSection';
import StrandGenderSection from '../components/StrandGenderSection';
import OfferingSection from '../components/OfferingSection';
import AskSection from '../components/AskSection';
import DataNote from '../components/DataNote';

function ActLabel({ kicker, title, blurb }: { kicker: string; title: string; blurb?: string }) {
  return (
    <div style={{ margin: '22px 0 10px' }}>
      <div
        style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: colors.inkSoft, marginBottom: 3,
        }}
      >
        {kicker}
      </div>
      <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0, color: colors.ink }}>{title}</h2>
      {blurb && (
        <p style={{ fontSize: 13.5, color: colors.inkSoft, margin: '3px 0 0', maxWidth: '62ch', lineHeight: 1.6 }}>
          {blurb}
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [filters, setFilters] = useState<Filters>({});
  const [showContext, setShowContext] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getDB().then(() => setReady(true)).catch(() => setReady(true));
  }, []);

  const scope = scopeLabel(filters);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.2rem 1.5rem', color: colors.ink }}>
      <NavHeader />

      {/* Shown before the spinner, so a visitor can read what this is
          while DuckDB and the parquet files load. */}
      <div style={{ marginTop: '0.8rem' }}>
        <IntroPanel />
      </div>

      {!ready && <Spinner />}

      <div style={{ display: ready ? 'block' : 'none' }}>
        {/* ---- Finding, evidence and so what (national) ------------------ */}
        {/* One screen. The finding on the left, the two evidence charts
            beside it, and the priority regions as a strip underneath. */}
        <div className="aralite-top">
          <div className="aralite-top-story">
            <StorySection />
          </div>
          <AvailabilitySection filters={filters} metric="avgStrands" />
          <AvailabilitySection filters={filters} metric="pctLearnersOneStrand" />
        </div>
        <RecommendationSection filters={filters} />

        {/* ---- Explore your area (responds to the filter) --------------- */}
        <ActLabel
          kicker="Explore your area"
          title="Compare your area with the country"
          blurb="Pick a region to compare it with the country. You can go down to a single barangay."
        />
        <FilterBar filters={filters} onChange={setFilters} />
        <p style={{ fontSize: 14, color: colors.inkSoft, margin: '0 0 12px' }}>
          Showing data for <strong style={{ color: colors.ink }}>{scope}</strong>
        </p>
        <StatCards filters={filters} />
        <SchoolPanel filters={filters} />

        {/* ---- Context, closed by default ------------------------------- */}
        <div style={{ margin: '4px 0 0' }}>
          <button
            onClick={() => setShowContext((v) => !v)}
            aria-expanded={showContext}
            style={{
              width: '100%', textAlign: 'left', cursor: 'pointer',
              padding: '0.7rem 1rem', borderRadius: 16,
              border: `1px dashed ${colors.line}`, background: 'transparent',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
            }}
          >
            <span>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: colors.ink }}>
                {showContext ? 'Hide the rest of the data' : 'Show the rest of the data'}
              </span>
              <span style={{ display: 'block', fontSize: 13, color: colors.inkSoft, marginTop: 3 }}>
                Six more charts for {scope}. They add background and do not argue the finding.
              </span>
            </span>
            <span style={{ fontSize: 20, color: colors.inkSoft, lineHeight: 1 }}>
              {showContext ? '−' : '+'}
            </span>
          </button>
        </div>

        {showContext && (
          <div
            style={{
              display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) 1fr',
              gap: 14, alignItems: 'start', marginTop: 12,
            }}
            className="aralite-cols aralite-context"
          >
            <div style={{ position: 'sticky', top: 16 }}>
              <InsightsSection filters={filters} />
            </div>
            <div>
              <StrandsSection filters={filters} />
              <SectorSection filters={filters} />
              <OfferingSection filters={filters} />
              <DropoffSection filters={filters} />
              <StrandGenderSection filters={filters} />
              <RegionsSection filters={filters} onPick={(r) => setFilters({ region: r })} />
            </div>
          </div>
        )}

        {/* ---- Tools ---------------------------------------------------- */}
        <ActLabel
          kicker="Ask it yourself"
          title="Put a question to the data"
          blurb="Plain English in, SQL and results out. It queries the whole dataset and ignores the filter above."
        />
        <AskSection />

        {/* ---- Limits --------------------------------------------------- */}
        <DataNote />
      </div>

      <p style={{ color: colors.inkSoft, fontSize: 12, textAlign: 'center', margin: '4px 0 12px' }}>
        Data: DepEd Learner Information System, SY 2023–2024 · Built with DuckDB-WASM + React
      </p>
    </div>
  );
}