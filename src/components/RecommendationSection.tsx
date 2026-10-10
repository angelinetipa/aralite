// src/components/RecommendationSection.tsx
// The "so what". Everything above this describes a problem. This is the
// only part of the dashboard that says what to do about it.
//
// The regions are NOT typed in. They are computed by priorityRegions() in
// metrics.ts, from the same rows the evidence charts draw, and asserted in
// metrics.test.ts. A hardcoded list would go stale the first time the
// data changed and nobody would notice.
//
// Color. Red marks a priority region, the same as in the evidence charts.
// The rank badge is red for that reason. The selected region gets a gray
// background and a dark border.
//
// Not filtered, for the same reason the evidence charts are not. This is
// a national ranking. It sits as a slim strip under the two charts, so
// the finding, the evidence and this list share one screen.

import { useEffect, useState } from 'react';
import { getAvailabilityByRegion, type AvailabilityRegionRow } from '../lib/story';
import { priorityRegions } from '../lib/metrics';
import { type Filters } from '../lib/filters';
import { colors } from '../constants/theme';
import { Card, ErrorState, Disclosure } from './ui';

// A compact card per region, everything centered. Rank and name on top,
// then the two numbers side by side with a thin divider, then the size
// of the region in one small line. Each label says in plain words what
// the number counts.
function RegionRow({
  rank, row, active,
}: { rank: number; row: AvailabilityRegionRow; active: boolean }) {
  return (
    <div
      style={{
        padding: '12px 12px 10px',
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
            width: 22,
            height: 22,
            borderRadius: 7,
            background: colors.worse,
            color: '#fff',
            fontSize: 12,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {rank}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: colors.ink }}>{row.region}</div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1px 1fr',
          alignItems: 'center',
          columnGap: 12,
          marginTop: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: colors.worse, lineHeight: 1.1 }}>
            {row.pctLearnersOneStrand.toFixed(1)}%
          </div>
          <div style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 3, lineHeight: 1.3 }}>
            of learners attend a one strand school
          </div>
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: colors.line }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: colors.ink, lineHeight: 1.1 }}>
            {row.avgStrands.toFixed(2)}
          </div>
          <div style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 3, lineHeight: 1.3 }}>
            strands per school on average
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 10 }}>
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
  const names = priority.regions;
  const listed = names.length > 1
    ? `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
    : names[0];

  return (
    <Card
      kicker="So what"
      title={`If strand offerings can only be widened in ${picked.length} regions, these are the ${picked.length}`}
      subtitle={
        `${listed} rank worst on both measures. They run the fewest strands per school ` +
        `and have the largest share of learners whose school runs only one.`
      }
    >
      <div className="aralite-strip">
        {picked.map((row, i) => (
          <RegionRow
            key={row.region}
            rank={i + 1}
            row={row}
            active={row.region === selected}
          />
        ))}
      </div>

      {onList && (
        <p style={{ fontSize: 13, color: colors.ink, margin: '8px 0 0', lineHeight: 1.55 }}>
          You have <strong>{selected}</strong> selected. It is number{' '}
          {priority.regions.indexOf(selected!) + 1} on this list.
        </p>
      )}

      {priority.excluded.length > 0 && (
        <p style={{ fontSize: 12.5, color: colors.inkSoft, margin: '8px 0 0', lineHeight: 1.55 }}>
          {priority.excluded.join(', ')} scored low too, but on fewer than{' '}
          {priority.minSchools} senior high schools. That is a sample size and not a
          pattern, so it is set aside rather than ranked.
        </p>
      )}

      <Disclosure summary="What this does not tell you to do">
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
    </Card>
  );
}