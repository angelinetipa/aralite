// src/components/RegionsSection.tsx
// All 18 regions ranked. interval={0} + enough height so EVERY label
// shows (no alternating skips). Clicking a bar filters the dashboard.

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getTopRegions, type RegionRow } from '../lib/queries';
import { type Filters } from '../lib/filters';
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

  if (status === 'loading') return null; // App spinner covers this
  if (status === 'error') return <ErrorState />;

  return (
    <Card
      title="Enrollment by region"
      accent={colors.yellow}
      subtitle="Click any bar to filter the whole dashboard to that region."
    >
      {/* 34px per row guarantees room for every label */}
      <div style={{ height: Math.max(420, data.length * 34) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
            <CartesianGrid stroke={colors.line} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: colors.inkSoft }}
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
            />
            <YAxis
              type="category" dataKey="region" width={130}
              interval={0}                    // show EVERY region, no skipping
              tick={{ fontSize: 12, fill: colors.ink }}
            />
            <Tooltip formatter={(v) => Number(v).toLocaleString()} />
            <Bar
              dataKey="total" radius={[0, 6, 6, 0]}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={(d: any) => d?.region && onPick(d.region)}
              style={{ cursor: 'pointer' }}
            >
              {data.map((row, i) => (
                <Cell key={i} fill={row.region === filters.region ? colors.red : colors.blue} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}