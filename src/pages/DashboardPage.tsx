// src/pages/DashboardPage.tsx
// The public dashboard. All data management lives at /admin.
//
// Order is an argument, not a layout:
//   banner    the page header and what this is, kept slim
//   finding   the one claim, always national, on a dark card
//   evidence  two charts that support it, beside the finding
//   so what   where to act first, one full width strip
//   explore   one panel with the filter and four numbers, then the
//             six more charts (collapsed) and the school list
//   tools     ask the data yourself
//   limits    what none of it can tell you
//
// Everything above "Explore your area" is national and never changes
// when the filter moves. That keeps the top of the page stable. Only the
// sections below the filter respond to it.
//
// The top uses the 12 column bento grid from index.css. Each block sits
// in a wrapper with a span class. The wrapper always renders, so the grid
// keeps its shape while the data loads.
//
// Rows below the filter still use the old layout. They move to the grid
// in the next steps.

import { useEffect, useState } from 'react';
import { getDB } from '../lib/db';
import { type Filters } from '../lib/filters';
import { colors } from '../constants/theme';
import Spinner from '../components/Spinner';
import HeroBanner from '../components/HeroBanner';
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

export default function DashboardPage() {
  const [filters, setFilters] = useState<Filters>({});
  const [showContext, setShowContext] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getDB().then(() => setReady(true)).catch(() => setReady(true));
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem 1.5rem', color: colors.ink }}>
      {/* The banner holds the page header and the intro. It shows before
          the spinner, so a visitor can read what this is while DuckDB and
          the parquet files load. */}
      <HeroBanner />

      {!ready && <Spinner />}

      <div style={{ display: ready ? 'block' : 'none' }}>
        {/* ---- Finding, evidence and so what (national) ------------------ */}
        {/* Row one is 4 + 4 + 4. Row two is one full width strip. */}
        <div className="aralite-bento">
          <div className="bento-4 bento-full-md bento-fill">
            <StorySection />
          </div>
          <div className="bento-4 bento-fill">
            <AvailabilitySection filters={filters} metric="avgStrands" />
          </div>
          <div className="bento-4 bento-fill">
            <AvailabilitySection filters={filters} metric="pctLearnersOneStrand" />
          </div>
          <div className="bento-12 bento-fill">
            <RecommendationSection filters={filters} />
          </div>
        </div>

        {/* ---- Explore your area (responds to the filter) --------------- */}
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