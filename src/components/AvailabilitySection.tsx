// src/components/AvailabilitySection.tsx
// The evidence behind the finding, one metric per card.
//
// Rendered twice by the dashboard, in the same order as the written
// analysis: how many strands a school runs, then how many learners have
// no alternative. Keeping the two in step means the page and the writeup
// can never drift apart.
//
// Deliberately NOT filtered. Every other chart narrows when you pick a
// region; this one always shows all 18 bars — the country's 17 regions
// plus PSO, Philippine Schools Overseas, which DepEd files in the same
// column but which is not a region — because its job is to be the
// benchmark. Filtering it to a single bar would leave nothing to compare
// against. The active filter outlines a bar instead of removing the rest.
//
// Sorting happens here, never in SQL. Ordering by a raw SUM while drawing
// a percentage put this chart in the wrong order and produced a false
// headline — the sort must use the same number the bars use.

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { getAvailability, getAvailabilityByRegion, type AvailabilityRegionRow } from '../lib/story';
import { type Filters } from '../lib/filters';
import { colors } from '../constants/theme';
import { Card, ErrorState } from './ui';

export type Metric = 'avgStrands' | 'pctLearnersOneStrand';

// Each metric carries its own scale, wording, and sense of which
// direction is bad — kept together so they cannot fall out of sync.
const SPEC = {
  avgStrands: {
    axis: 'Average tracks and strands a school runs (of 8)',
    max: 8,
    ticks: [0, 2, 4, 6, 8],
    format: (v: number) => v.toFixed(2),
    tickFormat: (v: number) => `${v}`,
    tooltip: 'Average tracks and strands per school',
    worseWhen: 'below' as const,
    sortAsc: true,          // fewest strands first — worst at the top
  },
  pctLearnersOneStrand: {
    axis: '% of senior-high learners in a single-strand school',
    max: null,
    ticks: null,
    format: (v: number) => `${v.toFixed(1)}%`,
    tickFormat: (v: number) => `${v}%`,
    tooltip: 'Learners in single-strand schools',
    worseWhen: 'above' as const,
    sortAsc: false,         // highest share first — worst at the top
  },
};

export default function AvailabilitySection({
  filters, metric,
}: { filters: Filters; metric: Metric }) {
  const [rows, setRows] = useState<AvailabilityRegionRow[]>([]);
  const [national, setNational] = useState({ avgStrands: 0, pctLearnersOneStrand: 0 });
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    setStatus('loading');
    Promise.all([getAvailabilityByRegion(), getAvailability({})])
      .then(([r, a]) => {
        setRows(r);
        setNational({
          avgStrands: a.national.avgStrands,
          pctLearnersOneStrand: a.national.pctLearnersOneStrand,
        });
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') return null;
  if (status === 'error') return <ErrorState />;
  if (rows.length === 0) return null;

  const spec = SPEC[metric];
  const nat = national[metric];

  // Sort by the metric actually being drawn, worst region first.
  const data = [...rows].sort((a, b) =>
    spec.sortAsc ? a[metric] - b[metric] : b[metric] - a[metric]);

  const worst = data[0];
  const best = data[data.length - 1];

  // Round the axis up to a clean number. Leaving it at the exact maximum
  // printed a tick reading "22.49897703308118%".
  const dataMax = Math.max(...data.map((r) => r[metric]));
  const axisMax = spec.max ?? Math.ceil(dataMax / 5) * 5;
  const ticks = spec.ticks ?? Array.from(
    { length: axisMax / 5 + 1 }, (_, i) => i * 5);

  const title = metric === 'avgStrands'
    ? `The average senior high school runs ${nat.toFixed(1)} of the 8 tracks and strands on offer — in ${worst.region} it is closer to ${Math.round(worst.avgStrands)}`
    : `A senior-high learner in ${worst.region} is ${(worst[metric] / best[metric]).toFixed(0)}× more likely than one in ${best.region} to attend a school running only one strand`;

  const subtitle = metric === 'avgStrands'
    ? `Fewest first. Dashed line is the national figure, ${nat.toFixed(2)} — all 17 regions plus overseas schools, counted together.`
    : `Share of learners whose school runs a single strand. Dashed line is the national figure, ${nat.toFixed(1)}%.`;

  return (
    <Card
      title={title}
      accent={metric === 'avgStrands' ? colors.blue : colors.red}
      subtitle={subtitle}
    >
      <div style={{ height: 460 }}>
        <ResponsiveContainer width="100%" height="100%">
          {/* Top margin leaves room for the reference-line label, which was
              being clipped by the plot area. */}
          <BarChart data={data} layout="vertical" margin={{ top: 26, right: 28, bottom: 24, left: 8 }}>
            <CartesianGrid stroke={colors.line} horizontal={false} />
            <XAxis
              type="number"
              domain={[0, axisMax]}
              ticks={ticks}
              tick={{ fontSize: 12, fill: colors.inkSoft }}
              tickFormatter={spec.tickFormat}
              label={{
                value: spec.axis,
                position: 'insideBottom', offset: -14,
                style: { fontSize: 11, fill: colors.inkSoft },
              }}
            />
            <YAxis
              type="category" dataKey="region" width={104} interval={0}
              tick={{ fontSize: 11.5, fill: colors.ink }}
            />
            <Tooltip formatter={(v) => [spec.format(Number(v)), spec.tooltip]} />
            <ReferenceLine
              x={nat}
              stroke={colors.ink}
              strokeDasharray="4 4"
              strokeWidth={1.4}
              ifOverflow="extendDomain"
              label={{
                value: `National ${spec.format(nat)}`,
                position: 'top', offset: 8,
                style: { fontSize: 11, fill: colors.ink, fontWeight: 700 },
              }}
            />
            <Bar dataKey={metric} radius={[0, 6, 6, 0]}>
              {data.map((r) => {
                const worse = spec.worseWhen === 'above' ? r[metric] > nat : r[metric] < nat;
                return (
                  <Cell
                    key={r.region}
                    fill={worse ? colors.red : colors.blueSoft}
                    stroke={filters.region === r.region ? colors.ink : undefined}
                    strokeWidth={filters.region === r.region ? 2 : 0}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}