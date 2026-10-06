// src/components/RegionsSection.tsx
// All 18 bars ranked. These are the country's 17 regions plus PSO,
// Philippine Schools Overseas, which DepEd files in the Region column
// but which is not a region. Clicking a bar filters the dashboard.
//
// Color. Gray by default. Blue marks the selected region, or the largest
// one when nothing is selected, so the title and the bar always match.

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { getTopRegions, type RegionRow } from '../lib/queries';
import { type Filters } from '../lib/filters';
import { compact } from '../lib/format';
import { colors } from '../constants/theme';
import { Card, ErrorState } from './ui';

export default function RegionsSection({
  filters, onPick,
}: {
  filters: Filters;
  onPick: (r: string) => void;
}) {
  const [data, setData] = useState<RegionRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    getTopRegions()
      .then((rows) => { setData(rows); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') return null;
  if (status === 'error') return <ErrorState />;

  const all = data.reduce((s, r) => s + r.total, 0);
  const top = data[0];
  const pct = top && all ? Math.round((top.total / all) * 100) : 0;
  const marked = filters.region ?? top?.region;

  return (
    <Card
      title={top ? `${top.region} has the most learners, ${pct}% of the country` : 'Enrollment by region'}
      subtitle="Learners by region. Click a bar to filter the whole dashboard to that region."
    >
      {/* 34px per row guarantees room for every label */}
      <div style={{ height: Math.max(420, data.length * 34 + 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data} layout="vertical" barCategoryGap={6}
            margin={{ top: 8, right: 52, bottom: 24, left: 4 }}
          >
            <XAxis
              type="number" tickFormatter={compact}
              tick={{ fontSize: 11.5, fill: colors.inkSoft }}
              axisLine={{ stroke: colors.line }} tickLine={{ stroke: colors.line }}
              label={{
                value: 'Learners', position: 'insideBottom', offset: -14,
                style: { fontSize: 11.5, fill: colors.inkSoft },
              }}
            />
            <YAxis
              type="category" dataKey="region" width={104} interval={0}
              axisLine={{ stroke: colors.line }} tickLine={false}
              tick={{ fontSize: 11.5, fill: colors.ink }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              formatter={(v) => Number(v).toLocaleString()}
            />
            <Bar
              dataKey="total" radius={[0, 4, 4, 0]}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={(d: any) => d?.region && onPick(d.region)}
              style={{ cursor: 'pointer' }}
            >
              {data.map((row) => (
                <Cell key={row.region} fill={row.region === marked ? colors.highlight : colors.gray} />
              ))}
              <LabelList
                dataKey="total" position="right"
                formatter={(v: unknown) => compact(Number(v))}
                style={{ fontSize: 11.5, fill: colors.ink, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}