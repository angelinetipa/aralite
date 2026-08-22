// src/components/RecommendationSection.tsx
// The "so what". Everything above this point describes a problem; this
// is the only part of the dashboard that says what to do about it.
//
// It lived only in the GitHub writeup for a while, which meant the
// strongest paragraph in the project was invisible to anyone who opened
// the site. A dashboard that stops at the finding leaves the reader to
// draw their own conclusion — and the whole argument here is that the
// obvious conclusion (fund the strands learners are picking) is the
// wrong one.
//
// The four regions are NOT typed in. They are computed by
// priorityRegions() in metrics.ts, from the same rows the evidence
// charts draw, and asserted in metrics.test.ts. A hardcoded list would
// go stale the first time the data changed and nobody would notice.
//
// Not filtered, for the same reason the evidence charts are not: this
// is a national ranking. Selecting a region highlights its row.

import { useEffect, useState } from 'react';
import { getAvailabilityByRegion, type AvailabilityRegionRow } from '../lib/story';
import { priorityRegions } from '../lib/metrics';
import { type Filters } from '../lib/filters';
import { colors } from '../constants/theme';
import { Card, ErrorState, Disclosure } from './ui';

function RegionRow({
  rank, row, active,
}: { rank: number; row: AvailabilityRegionRow; active: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 14px',
        borderRadius: 14,
        background: active ? '#FFFBEB' : 'transparent',
        border: `1px solid ${active ? colors.yellow : colors.line}`,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: 10,
          background: `linear-gradient(180deg, ${colors.yellow}, #E8B90A)`,
          color: colors.ink,
          fontSize: 13,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 3px 8px rgba(252,209,22,0.35)',
        }}
      >
        {rank}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: colors.ink }}>
          {row.region}
        </div>
        <div style={{ fontSize: 12.5, color: colors.inkSoft, marginTop: 2 }}>
          {row.schools.toLocaleString()} senior high schools ·{' '}
          {row.learners.toLocaleString()} learners
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: colors.red, lineHeight: 1.1 }}>
          {row.pctLearnersOneStrand.toFixed(1)}%
        </div>
        <div style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 2 }}>
          no alternative
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 74 }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: colors.blue, lineHeight: 1.1 }}>
          {row.avgStrands.toFixed(2)}
        </div>
        <div style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 2 }}>
          strands run
        </div>
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
      title={`If strand offerings can only be widened in ${picked.length} regions, these are the ${picked.length}`}
      accent={colors.yellow}
      subtitle={
        `${listed} come out worst on BOTH measures — fewest strands run per school, ` +
        `and the largest share of learners whose school runs only one. Two rankings ` +
        `built from different numbers agreeing is harder to argue with than either alone.`
      }
    >
      <div style={{ display: 'grid', gap: 10 }}>
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
        <p style={{ fontSize: 13, color: colors.ink, margin: '14px 0 0', lineHeight: 1.6 }}>
          You have <strong>{selected}</strong> selected — it is number{' '}
          {priority.regions.indexOf(selected!) + 1} on this list.
        </p>
      )}

      {priority.excluded.length > 0 && (
        <p style={{ fontSize: 12.5, color: colors.inkSoft, margin: '14px 0 0', lineHeight: 1.6 }}>
          {priority.excluded.join(', ')} scored low too, but on fewer than{' '}
          {priority.minSchools} senior high schools. That is a sample size, not a
          pattern, so it is set aside rather than ranked.
        </p>
      )}

      <Disclosure summary="What this does not tell you to do">
        <p style={{ margin: '0 0 8px' }}>
          <strong style={{ color: colors.ink }}>It does not say which strands to add.</strong>{' '}
          Enrollment records what learners took, not what they wanted. Choosing new
          offerings from it would only repeat whatever was already available. That
          decision needs something this file does not contain: what learners in these
          regions would actually apply for, weighed against which strands lead to work
          near them. Adding strands nobody applies to spends the budget without widening
          anyone&rsquo;s options.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong style={{ color: colors.ink }}>Check the travel question first.</strong>{' '}
          This data records where a school is, not where a learner lives. If learners in
          these regions routinely cross into a neighbouring one for senior high, the
          availability gap is still real but the access gap is smaller than it looks
          here — and the money would be going to the wrong place.
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