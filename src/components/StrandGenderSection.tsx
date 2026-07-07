// src/components/StrandGenderSection.tsx
// Gender skew within each senior-high strand. Grouped bars make the
// imbalance obvious (e.g. ABM leans female, PBM leans male) — useful
// for gender-responsive program planning.

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getStrandByGender, type StrandGenderRow } from '../lib/queries';
import { type Filters } from '../lib/filters';
import { colors } from '../constants/theme';
import { Card, ErrorState } from './ui';

export default function StrandGenderSection({ filters }: { filters: Filters }) {
  const [data, setData] = useState<StrandGenderRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    setStatus('loading');
    getStrandByGender(filters)
      .then((r) => { setData(r); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [filters]);

  if (status === 'loading') return null;
  if (status === 'error') return <ErrorState />;

  return (
    <Card
      title="Strand choice by gender"
      accent={colors.blue}
      subtitle="Which senior-high strands boys and girls choose — the gaps guide gender-responsive planning."
    >
      <div style={{ height: 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
            <CartesianGrid stroke={colors.line} horizontal={false} />
            <XAxis
              type="number" tick={{ fontSize: 12, fill: colors.inkSoft }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis type="category" dataKey="strand" width={110} interval={0} tick={{ fontSize: 12, fill: colors.ink }} />
            <Tooltip formatter={(v) => Number(v).toLocaleString()} />
            <Legend />
            <Bar dataKey="Male" fill={colors.blue} radius={[0, 4, 4, 0]} />
            <Bar dataKey="Female" fill={colors.red} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}