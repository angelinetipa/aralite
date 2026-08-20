// src/pages/DashboardPage.tsx
// The public dashboard. All data management lives at /admin.
//
// Order is an argument, not a layout:
//   scene    — one filter, and what it currently selects
//   finding  — the single claim this dashboard makes, stated in a sentence
//   evidence — the two charts that support it, benchmarked nationally
//   context  — everything else, muted, for a reader looking around
//   tools    — ask the data yourself
//   limits   — what none of it can tell you
//
// The tools sit at the BOTTOM on purpose. Above the finding they compete
// with it for attention, and a visitor who lands here should meet the
// argument first. Anyone who wants to dig has already scrolled.

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
  const [search, setSearch] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getDB().then(() => setReady(true)).catch(() => setReady(true));
  }, []);

  const scope = scopeLabel(filters);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 2rem', color: colors.ink }}>
      <NavHeader />

      {/* Context before the spinner: a visitor can read what this is while
          DuckDB and the parquet files are still loading. */}
      <div style={{ marginTop: '1.5rem' }}>
        <IntroPanel />
      </div>

      {!ready && <Spinner />}

      <div style={{ display: ready ? 'block' : 'none' }}>
        {/* ---- Scene ---------------------------------------------------- */}
        <FilterBar
          filters={filters}
          onChange={setFilters}
          search={search}
          onSearch={setSearch}
        />

        <p style={{ fontSize: 14, color: colors.inkSoft, margin: '0 0 20px' }}>
          Showing data for <strong style={{ color: colors.ink }}>{scope}</strong>
          {search.trim() && (
            <> · schools matching <strong style={{ color: colors.ink }}>“{search.trim()}”</strong></>
          )}
        </p>

        {/* Appears only when the filter or search actually selects something. */}
        <SchoolPanel filters={filters} search={search} />

        <StatCards filters={filters} />

        {/* ---- The finding ---------------------------------------------- */}
        <StorySection filters={filters} />

        {/* ---- The evidence --------------------------------------------- */}
        <ActLabel
          kicker="The evidence"
          title="Where strand availability is narrowest"
          blurb="Two charts, in the same order as the written analysis: how many strands a school runs, then how many learners have no alternative. Both stay national so there is always something to compare against — pick a region above and it is outlined here rather than isolated."
        />
        <AvailabilitySection filters={filters} metric="avgStrands" />
        <AvailabilitySection filters={filters} metric="pctLearnersOneStrand" />

        {/* ---- Context --------------------------------------------------- */}
        <ActLabel
          kicker="Context"
          title="The rest of the picture"
          blurb={`Everything below follows your filter — currently ${scope}. These describe the dataset rather than argue the finding above: useful for looking around, not for settling the question.`}
        />

        <div
          style={{
            display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) 1fr',
            gap: 24, alignItems: 'start',
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
            <GenderSection filters={filters} />
            <StrandGenderSection filters={filters} />
            <RegionsSection filters={filters} onPick={(r) => setFilters({ region: r })} />
          </div>
        </div>

        {/* ---- Tools ------------------------------------------------------ */}
        <ActLabel
          kicker="Ask it yourself"
          title="Put a question to the data"
          blurb="Type a question in plain English and watch the SQL it writes, then the result. This one queries the whole dataset and ignores the filter above — the SQL it shows you is the exact scope it used."
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