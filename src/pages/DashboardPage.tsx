// src/pages/DashboardPage.tsx
// The public dashboard. All data management lives at /admin.
//
// Order is an argument, not a layout:
//   scene    — one filter, and what it currently selects
//   finding  — the single claim this dashboard makes, in a sentence
//   evidence — the two charts that support it, benchmarked nationally
//   so what  — the only part that says what to do about any of it
//   context  — everything else, COLLAPSED by default
//   tools    — ask the data yourself
//   limits   — what none of it can tell you
//
// The context block starts closed. Open, it made the page a wall of
// charts and left the reader to work out which mattered; closed, the
// default view is filter -> finding -> evidence -> so what, and the rest
// is an appendix for anyone who wants it. It also means six chart
// queries never run unless someone asks for them.
//
// "So what" sits directly after the evidence and OUTSIDE that toggle on
// purpose. It used to live only in the GitHub writeup, so a visitor got
// the problem and no recommendation — and the argument here is that the
// obvious recommendation is the wrong one. Behind a toggle it would be
// invisible again.
//
// Tools sit at the BOTTOM on purpose. Above the finding they compete
// with it, and a visitor landing here should meet the argument first.

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
    <div style={{ margin: '38px 0 16px' }}>
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
        <p style={{ fontSize: 13.5, color: colors.inkSoft, margin: '6px 0 0', maxWidth: '62ch', lineHeight: 1.6 }}>
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
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 2rem', color: colors.ink }}>
      <NavHeader />

      {/* Context before the spinner: a visitor can read what this is while
          DuckDB and the parquet files load. */}
      <div style={{ marginTop: '1.5rem' }}>
        <IntroPanel />
      </div>

      {!ready && <Spinner />}

      <div style={{ display: ready ? 'block' : 'none' }}>
        {/* ---- Scene ---------------------------------------------------- */}
        <FilterBar filters={filters} onChange={setFilters} />

        <p style={{ fontSize: 14, color: colors.inkSoft, margin: '0 0 20px' }}>
          Showing data for <strong style={{ color: colors.ink }}>{scope}</strong>
        </p>

        <SchoolPanel filters={filters} />

        <StatCards filters={filters} />

        {/* ---- The finding ---------------------------------------------- */}
        <StorySection filters={filters} />

        {/* ---- The evidence --------------------------------------------- */}
        <ActLabel
          kicker="The evidence"
          title="Where strand availability is narrowest"
          blurb="Both charts stay national. Pick a region above and it is outlined, not isolated."
        />
        <AvailabilitySection filters={filters} metric="avgStrands" />
        <AvailabilitySection filters={filters} metric="pctLearnersOneStrand" />

        {/* ---- So what ---------------------------------------------------- */}
        <ActLabel
          kicker="So what"
          title="Where widening strand offerings would matter most"
          blurb="The regions are calculated from the two charts above, not chosen by hand — and the same panel says plainly what this data cannot decide."
        />
        <RecommendationSection filters={filters} />

        {/* ---- Context, closed by default -------------------------------- */}
        <div style={{ margin: '38px 0 0' }}>
          <button
            onClick={() => setShowContext((v) => !v)}
            aria-expanded={showContext}
            style={{
              width: '100%', textAlign: 'left', cursor: 'pointer',
              padding: '1rem 1.2rem', borderRadius: 16,
              border: `1px dashed ${colors.line}`, background: 'transparent',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
            }}
          >
            <span>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: colors.ink }}>
                {showContext ? 'Hide the rest of the data' : 'Show the rest of the data'}
              </span>
              <span style={{ display: 'block', fontSize: 13, color: colors.inkSoft, marginTop: 3 }}>
                Six more charts describing {scope}. They fill in the picture; they do not argue the finding.
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
              gap: 24, alignItems: 'start', marginTop: 22,
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

        {/* ---- Tools ------------------------------------------------------ */}
        <ActLabel
          kicker="Ask it yourself"
          title="Put a question to the data"
          blurb="Plain English in, SQL and results out. Queries the whole dataset, ignoring the filter above."
        />
        <AskSection />

        {/* ---- Limits ----------------------------------------------------- */}
        <DataNote />
      </div>

      <p style={{ color: colors.inkSoft, fontSize: 12, textAlign: 'center', margin: '8px 0 24px' }}>
        Data: DepEd Learner Information System, SY 2023–2024 · Built with DuckDB-WASM + React
      </p>
    </div>
  );
}