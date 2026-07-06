// src/components/RegionsTab.tsx
// All regions ranked by enrollment. This is also the drill-down:
// clicking a bar sets the region filter for the whole dashboard.

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getTopRegions, type RegionRow } from '../lib/queries';
import { colors } from '../constants/theme';
import { Card, Loading, ErrorState } from './ui';

export default function RegionsTab({
  region,
  onPick,
}: {
  region: string | null;
  onPick: (r: string) => void;
}) {
  const [data, setData] = useState<RegionRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    // This list never changes with the filter, so we load it once.
    getTopRegions()
      .then((rows) => {
        setData(rows);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') return <Loading />;
  if (status === 'error') return <ErrorState />;

  return (
    <Card
      title="Enrollment by region"
      subtitle="Click any bar to filter the whole dashboard to that region."
    >
      <div style={{ height: 520 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
          >
            <CartesianGrid stroke={colors.line} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: colors.inkSoft }}
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
            />
            <YAxis
              type="category"
              dataKey="region"
              width={130}
              tick={{ fontSize: 11, fill: colors.ink }}
            />
            <Tooltip formatter={(v) => Number(v).toLocaleString()} />
            <Bar
              dataKey="total"
              radius={[0, 4, 4, 0]}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={(d: any) => d?.region && onPick(d.region)}
              style={{ cursor: 'pointer' }}
            >
              {data.map((row, i) => (
                // Highlight the currently-selected region in red.
                <Cell
                  key={i}
                  fill={row.region === region ? colors.red : colors.blue}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}