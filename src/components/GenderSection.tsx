// src/components/DropoffSection.tsx
// The hero story: enrollment per grade + a computed callout of exactly
// how many students are lost between Grade 6 and Grade 7. No duplicate
// total here — the stat cards already show it.

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getByGrade, type GradeRow } from '../lib/queries';
import { colors } from '../constants/theme';
import { Card, ErrorState } from './ui';

export default function DropoffSection({ region }: { region: string | null }) {
  const [data, setData] = useState<GradeRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    setStatus('loading');
    getByGrade(region)
      .then((rows) => { setData(rows); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [region]);

  if (status === 'loading') return null; // App spinner covers this
  if (status === 'error') return <ErrorState />;

  // Compute the G6 -> G7 loss so the subtitle states a fact, not a vibe.
  const g6 = data.find((d) => d.grade === 'G6')?.total ?? 0;
  const g7 = data.find((d) => d.grade === 'G7')?.total ?? 0;
  const lost = g6 - g7;

  return (
    <Card
      title="Where enrollment drops off"
      accent={colors.red}
      subtitle={
        lost > 0
          ? `${lost.toLocaleString()} fewer learners in Grade 7 than Grade 6 — the elementary-to-junior-high transition gap.`
          : 'Enrollment per grade level.'
      }
    >
      <div style={{ height: 320 }}>
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
              type="monotone" dataKey="total"
              stroke={colors.blue} strokeWidth={3}
              dot={{ r: 4, fill: colors.blue }}
              activeDot={{ r: 6, fill: colors.red }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}