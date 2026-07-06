// src/components/OverviewTab.tsx
// The hero tab: total learners + the drop-off story line chart.
// Re-runs its query whenever the chosen region changes.

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getTotal, getByGrade, type GradeRow } from '../lib/queries';
import { colors } from '../constants/theme';
import { Card, Stat, Loading, ErrorState } from './ui';

export default function OverviewTab({ region }: { region: string | null }) {
  const [data, setData] = useState<GradeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    setStatus('loading');
    Promise.all([getTotal(region), getByGrade(region)])
      .then(([t, rows]) => {
        setTotal(t);
        setData(rows);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [region]);

  if (status === 'loading') return <Loading />;
  if (status === 'error') return <ErrorState />;

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <Stat
          label={region ? `Learners in ${region}` : 'Total learners nationwide'}
          value={total.toLocaleString()}
        />
      </div>

      <Card
        title="Where enrollment drops off"
        subtitle="The dip from Grade 6 to Grade 7 shows students lost at the elementary-to-junior-high transition."
      >
        <div style={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid stroke={colors.line} vertical={false} />
              <XAxis dataKey="grade" tick={{ fontSize: 12, fill: colors.inkSoft }} />
              <YAxis
                tick={{ fontSize: 12, fill: colors.inkSoft }}
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
              />
              <Tooltip formatter={(v) => Number(v).toLocaleString()} />
              <Line
                type="monotone"
                dataKey="total"
                stroke={colors.blue}
                strokeWidth={3}
                dot={{ r: 4, fill: colors.blue }}
                activeDot={{ r: 6, fill: colors.red }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}