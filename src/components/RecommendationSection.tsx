// src/components/RecommendationSection.tsx
// The "so what". Everything above this describes a problem. This is the
// only part of the dashboard that says what to do about it.
//
// The regions are NOT typed in. They are computed by priorityRegions() in
// metrics.ts, from the same rows the evidence charts draw, and asserted in
// metrics.test.ts. A hardcoded list would go stale the first time the
// data changed and nobody would notice.
//
// Layout. One full width strip. The words sit in a narrow block on the
// left and the priority regions sit in a row on the right, so the strip
// stays short. The detail is collapsed under the words.
//
// Color. Red marks a priority region, the same as in the evidence charts.
// The rank badge is red for that reason. The selected region gets a gray
// background and a dark border.
//
// Not filtered, for the same reason the evidence charts are not. This is
// a national ranking.

import { useEffect, useState } from 'react';
import { getAvailabilityByRegion, type AvailabilityRegionRow } from '../lib/story';
import { priorityRegions } from '../lib/metrics';
import { type Filters } from '../lib/filters';
import { colors, clay } from '../constants/theme';
import { ErrorState, Disclosure } from './ui';

// A compact card per region. Rank and name on top, then the two numbers
// side by side, then the size of the region in one small line.
function RegionRow({
  rank, row, active,
}: { rank: number; row: AvailabilityRegionRow; active: boolean }) {
  return (
    <div
      style={{
        padding: '10px 10px 8px',
        borderRadius: 14,
        textAlign: 'center',
        background: active ? '#F4F1E9' : 'transparent',
        border: `1px solid ${active ? colors.ink : colors.line}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div
          style={{
            flexShrink: 0,
            width: 20,
            height: 20,
            borderRadius: 6,
            background: colors.worse,
            color: '#fff',
            fontSize: 11.5,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {rank}
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: colors.ink }}>{row.region}</div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1px 1fr',
          alignItems: 'center',
          columnGap: 10,
          marginTop: 8,
        }}
      >
        <div>
          <div className="aralite-display" style={{ fontSize: 18, fontWeight: 800, color: colors.worse, lineHeight: 1.1 }}>
            {row.pctLearnersOneStrand.toFixed(1)}%
          </div>
          <div style={{ fontSize: 11, color: colors.inkSoft, marginTop: 2, lineHeight: 1.25 }}>
            of learners in one strand schools
          </div>
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: colors.line }} />
        <div>
          <div className="aralite-display" style={{ fontSize: 18, fontWeight: 800, color: colors.ink, lineHeight: 1.1 }}>
            {row.avgStrands.toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: colors.inkSoft, marginTop: 2, lineHeight: 1.25 }}>
            strands per school
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: colors.inkSoft, marginTop: 8 }}>
        {row.schools.toLocaleString()} schools · {row.learners.toLocaleString()} learners
      </div>
    </div>
  );
}

export default function RecommendationSection({ filters }: { filters: Filters }) {
  const [rows, setRows] = useState<AvailabilityRegionRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    getAvailabilityByRegion()
      .then((r) => { setRows(r); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') return null;
  if (status === 'error') return <ErrorState />;

  const priority = priorityRegions(rows);
  if (priority.regions.length === 0) return null;

  const picked = priority.regions
    .map((name) => rows.find((r) => r.region === name))
    .filter((r): r is AvailabilityRegionRow => r !== undefined);

  const selected = filters.region;
  const onList = selected ? priority.regions.includes(selected) : false;

  return (
    <div
      className="aralite-card"
      style={{
        ...clay.card,
        borderTop: `4px solid ${colors.highlight}`,
        padding: '0.9rem 1.1rem',
        height: '100%',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        alignItems: 'center',
      }}
    >
      {/* Words */}
      <div style={{ flex: '1 1 230px', minWidth: 0 }}>
        <div
          style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: colors.highlight, marginBottom: 6,
          }}
        >
          So what
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: colors.ink, lineHeight: 1.3 }}>
          Widen strands in these {picked.length} regions first
        </h2>
        <p style={{ color: colors.inkSoft, fontSize: 14, margin: '3px 0 0' }}>
          Worst on both charts above, shown in red.
        </p>

        {onList && (
          <p style={{ fontSize: 13, color: colors.ink, margin: '6px 0 0', lineHeight: 1.5 }}>
            You have <strong>{selected}</strong> selected. It is number{' '}
            {priority.regions.indexOf(selected!) + 1} on this list.
          </p>
        )}

        <Disclosure summary="What this does not tell you to do">
          {priority.excluded.length > 0 && (
            <p style={{ margin: '0 0 8px' }}>
              {priority.excluded.join(', ')} scored low too, but on fewer than{' '}
              {priority.minSchools} senior high schools. That is a sample size and not a
              pattern, so it is set aside rather than ranked.
            </p>
          )}
          <p style={{ margin: '0 0 8px' }}>
            <strong style={{ color: colors.ink }}>It does not say which strands to add.</strong>{' '}
            Enrollment records what learners took, not what they wanted. Choosing new
            offerings from it would only repeat whatever was already available. That
            decision needs something this file does not contain, such as what learners in
            these regions would actually apply for, weighed against which strands lead to
            work near them. Adding strands nobody applies to spends the budget without
            widening anyone&rsquo;s options.
          </p>
          <p style={{ margin: '0 0 8px' }}>
            <strong style={{ color: colors.ink }}>Check the travel question first.</strong>{' '}
            This data records where a school is, not where a learner lives. If learners in
            these regions routinely cross into a neighbouring one for senior high, the
            availability gap is still real but the access gap is smaller than it looks
            here, and the money would be going to the wrong place.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: colors.ink }}>
              It does not say learners in these regions are worse off.
            </strong>{' '}
            It measures how many strands their schools run, and nothing else. A region
            with fewer strands available is not a region with less capable learners.
          </p>
        </Disclosure>
      </div>

      {/* Regions in one row */}
      <div
        style={{
          flex: '3 1 520px',
          minWidth: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 8,
        }}
      >
        {picked.map((row, i) => (
          <RegionRow
            key={row.region}
            rank={i + 1}
            row={row}
            active={row.region === selected}
          />
        ))}
      </div>
    </div>
  );
}