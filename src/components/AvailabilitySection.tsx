// src/components/AvailabilitySection.tsx
// The evidence behind the finding, one metric per card.
//
// Rendered twice by the dashboard, side by side. Both charts stay
// national on purpose, because a benchmark with one bar left is not a
// benchmark. The selected region gets a thin outline instead of hiding
// the others.
//
// Color rules for this chart
//   gray          every region by default
//   red           the priority regions, calculated by priorityRegions()
//   dark outline  the region picked in the filter
//
// Size. The chart fills the height of its grid cell. It never shrinks
// below minHeight, which gives every region bar about 14px.
//
// The x-axis stays, starts at zero, and has a title, so the reader can
// see what the numbers mean and how far they range. Gridlines are gone.
// Sorting happens here and never in SQL. The sort must use the same
// number the bars draw.

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine, LabelList,
} from 'recharts';
import { getAvailability, getAvailabilityByRegion, type AvailabilityRegionRow } from '../lib/story';
import { priorityRegions } from '../lib/metrics';
import { type Filters } from '../lib/filters';
import { colors } from '../constants/theme';
import { Card, ErrorState } from './ui';

export type Metric = 'avgStrands' | 'pctLearnersOneStrand';

// Pixels per region bar, plus room for the axis and the national label.
const BAR_PX = 13;
const CHROME_PX = 76;

// Each metric keeps its own wording, axis step, and sort direction together.
const SPEC = {
  avgStrands: {
    format: (v: number) => v.toFixed(2),
    tick: (v: number) => `${v}`,
    step: 1,
    axisTitle: 'Average strands per school (of 8)',
    tooltip: 'Average strands per school',
    sortAsc: true, // fewest first, worst at the top
  },
  pctLearnersOneStrand: {
    format: (v: number) => `${v.toFixed(1)}%`,
    tick: (v: number) => `${v}%`,
    step: 10,
    axisTitle: '% of senior high learners',
    tooltip: 'Learners in one strand schools',
    sortAsc: false, // highest share first, worst at the top
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
  const priority = priorityRegions(rows).regions;

  const data = [...rows].sort((a, b) =>
    spec.sortAsc ? a[metric] - b[metric] : b[metric] - a[metric]);

  const worst = data[0];
  const best = data[data.length - 1];

  // Axis starts at zero and ends on a clean step, with room on the
  // right so the value labels are not clipped.
  const dataMax = Math.max(...data.map((r) => r[metric]));
  const axisMax = Math.ceil((dataMax * 1.2) / spec.step) * spec.step;
  const ticks = Array.from({ length: axisMax / spec.step + 1 }, (_, i) => i * spec.step);

  const title = metric === 'avgStrands'
    ? 'Strands per school'
    : 'Learners in one strand schools';

  const subtitle = metric === 'avgStrands'
    ? `Average is ${nat.toFixed(1)} of 8. Lowest is ${worst.region} at ${worst.avgStrands.toFixed(1)}.`
    : `${worst.region} is ${(worst[metric] / best[metric]).toFixed(0)}× ${best.region}.`;

  return (
    <Card title={title} subtitle={subtitle}>
      {/* The wrapper keeps a minimum height. The chart sits inside it
          and stretches to whatever height the grid cell gives. */}
      <div style={{ position: 'relative', height: '100%', minHeight: data.length * BAR_PX + CHROME_PX }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              barCategoryGap={3}
              margin={{ top: 22, right: 38, bottom: 24, left: 0 }}
            >
              <XAxis
                type="number"
                domain={[0, axisMax]}
                ticks={ticks}
                tickFormatter={spec.tick}
                tick={{ fontSize: 11.5, fill: colors.inkSoft }}
                axisLine={{ stroke: colors.line }}
                tickLine={{ stroke: colors.line }}
                label={{
                  value: spec.axisTitle,
                  position: 'insideBottom', offset: -14,
                  style: { fontSize: 11.5, fill: colors.inkSoft },
                }}
              />
              <YAxis
                type="category" dataKey="region" width={86} interval={0}
                axisLine={{ stroke: colors.line }} tickLine={false}
                tick={{ fontSize: 11.5, fill: colors.ink }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                formatter={(v) => [spec.format(Number(v)), spec.tooltip]}
              />
              <ReferenceLine
                x={nat}
                stroke={colors.ink}
                strokeDasharray="4 4"
                strokeWidth={1.2}
                ifOverflow="extendDomain"
                label={{
                  value: `National ${spec.format(nat)}`,
                  position: 'top', offset: 8,
                  style: { fontSize: 11, fill: colors.ink, fontWeight: 700 },
                }}
              />
              <Bar dataKey={metric} radius={[0, 4, 4, 0]}>
                {data.map((r) => {
                  const picked = filters.region === r.region;
                  return (
                    <Cell
                      key={r.region}
                      fill={priority.includes(r.region) ? colors.worse : colors.gray}
                      stroke={picked ? colors.ink : undefined}
                      strokeWidth={picked ? 2 : 0}
                    />
                  );
                })}
                <LabelList
                  dataKey={metric}
                  position="right"
                  formatter={(v: unknown) => spec.format(Number(v))}
                  style={{ fontSize: 11.5, fill: colors.ink, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}