// src/components/GenderSection.tsx
// Gender balance per grade. Two lines — where do boys and girls
// diverge? (Males lead early; watch senior high.)

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getGenderByGrade, type GenderRow } from '../lib/queries';
import { colors } from '../constants/theme';
import { Card, Loading, ErrorState } from './ui';

export default function GenderSection({ region }: { region: string | null }) {
  const [data, setData] = useState<GenderRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    setStatus('loading');
    getGenderByGrade(region)
      .then((rows) => { setData(rows); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [region]);

  if (status === 'loading') return <Loading />;
  if (status === 'error') return <ErrorState />;

  return (
    <Card
      title="Gender balance by grade"
      accent={colors.yellow}
      subtitle="Male vs female enrollment across grade levels."
    >
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid stroke={colors.line} vertical={false} />
            <XAxis dataKey="grade" tick={{ fontSize: 12, fill: colors.inkSoft }} />
            <YAxis
              tick={{ fontSize: 12, fill: colors.inkSoft }}
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
            />
            <Tooltip formatter={(v) => Number(v).toLocaleString()} />
            <Legend />
            <Line type="monotone" dataKey="Male" stroke={colors.blue} strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="Female" stroke={colors.red} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}