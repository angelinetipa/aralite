// src/pages/DashboardPage.tsx
// The public dashboard. All data management lives at /admin.
//
// Order is an argument, not a layout:
//   intro     what this is, in two sentences
//   finding   the one claim, always national
//   evidence  two charts that support it, beside the finding
//   so what   where to act first, as a strip under the charts
//             (finding, evidence and so what share one screen)
//   explore   one panel with the filter and four numbers, then the
//             six more charts (collapsed) and the school list
//   tools     ask the data yourself
//   limits    what none of it can tell you
//
// Everything above "Explore your area" is national and never changes
// when the filter moves. That keeps the top of the page stable. Only the
// sections below the filter respond to it.

import { useEffect, useState } from 'react';
import { getDB } from '../lib/db';
import { type Filters } from '../lib/filters';
import { colors } from '../constants/theme';
import NavHeader from '../components/NavHeader';
import Spinner from '../components/Spinner';
import IntroPanel from '../components/IntroPanel';
import ExplorePanel from '../components/ExplorePanel';
import SchoolPanel from '../components/SchoolPanel';
import StorySection from '../components/StorySection';
import AvailabilitySection from '../components/AvailabilitySection';
import RecommendationSection from '../components/RecommendationSection';
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
        {/* One panel holds the filter, the four numbers and the button
            that opens the six background charts. */}
        <ExplorePanel
          filters={filters}
          onChange={setFilters}
          showMore={showContext}
          onToggleMore={() => setShowContext((v) => !v)}
        />

        {/* ---- Context, closed by default ------------------------------- */}
        {showContext && (
          <div className="aralite-grid2 aralite-context" style={{ marginBottom: 14 }}>
            <div>
              <StrandsSection filters={filters} />
              <OfferingSection filters={filters} />
              <StrandGenderSection filters={filters} />
            </div>
            <div>
              <SectorSection filters={filters} />
              <DropoffSection filters={filters} />
              <RegionsSection filters={filters} onPick={(r) => setFilters({ region: r })} />
            </div>
          </div>
        )}

        {/* The schools in the area. Shows only once something is picked. */}
        <SchoolPanel filters={filters} />

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