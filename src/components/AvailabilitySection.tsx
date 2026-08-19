// src/components/AvailabilitySection.tsx
// The evidence behind the finding.
//
// Deliberately NOT filtered. Every other chart narrows when you pick a
// region; this one always shows all 18, because its job is to be the
// benchmark. Filtering it to a single bar would leave nothing to compare
// against, which is the whole point. The active filter highlights a bar
// instead of removing the rest.
//
// The dashed line is the national figure. A bar with no reference line
// is a number the reader has no way to judge.

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { getAvailability, getAvailabilityByRegion, type AvailabilityRegionRow } from '../lib/story';
import { type Filters } from '../lib/filters';
import { colors } from '../constants/theme';
import { Card, ErrorState } from './ui';

export default function AvailabilitySection({ filters }: { filters: Filters }) {
  const [rows, setRows] = useState<AvailabilityRegionRow[]>([]);
  const [nationalPct, setNationalPct] = useState(0);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    setStatus('loading');
    Promise.all([getAvailabilityByRegion(), getAvailability({})])
      .then(([r, a]) => {
        setRows(r);
        setNationalPct(a.national.pctLearnersOneStrand);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') return null;
  if (status === 'error') return <ErrorState />;
  if (rows.length === 0) return null;

  const top = rows[0];
  const bottom = rows[rows.length - 1];
  const ratio = bottom.pctLearnersOneStrand
    ? top.pctLearnersOneStrand / bottom.pctLearnersOneStrand
    : 0;

  return (
    <Card
      title={`A senior-high learner in ${top.region} is ${ratio.toFixed(0)}× more likely than one in ${bottom.region} to attend a school running only one strand`}
      accent={colors.red}
      subtitle={`Share of senior-high learners whose school runs a single strand. The dashed line is the national figure, ${nationalPct.toFixed(1)}%. This chart stays national on purpose — it is the benchmark the rest of the dashboard is measured against.`}
    >
      <div style={{ height: 460 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 40, bottom: 8, left: 8 }}>
            <CartesianGrid stroke={colors.line} horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 'dataMax']}
              tick={{ fontSize: 12, fill: colors.inkSoft }}
              tickFormatter={(v) => `${v}%`}
              label={{
                value: '% of senior-high learners in a single-strand school',
                position: 'insideBottom', offset: -4,
                style: { fontSize: 11, fill: colors.inkSoft },
              }}
            />
            <YAxis
              type="category" dataKey="region" width={104} interval={0}
              tick={{ fontSize: 11.5, fill: colors.ink }}
            />
            <Tooltip
              formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Learners in single-strand schools']}
            />
            <ReferenceLine
              x={nationalPct}
              stroke={colors.ink}
              strokeDasharray="4 4"
              label={{
                value: `National ${nationalPct.toFixed(1)}%`,
                position: 'top',
                style: { fontSize: 11, fill: colors.ink, fontWeight: 700 },
              }}
            />
            <Bar dataKey="pctLearnersOneStrand" radius={[0, 6, 6, 0]}>
              {rows.map((r) => {
                const selected = filters.region === r.region;
                const above = r.pctLearnersOneStrand > nationalPct;
                return (
                  <Cell
                    key={r.region}
                    fill={above ? colors.red : colors.blueSoft}
                    stroke={selected ? colors.ink : undefined}
                    strokeWidth={selected ? 2 : 0}
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