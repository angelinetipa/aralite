// src/components/OfferingSection.tsx
// What levels schools offer (Modified COC): Purely Elementary, JHS with
// SHS, All-Offering, etc. Shows the SHAPE of the school system — useful
// for planning where to add senior-high or new levels.

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getByOffering, type OfferingRow } from '../lib/queries';
import { type Filters } from '../lib/filters';
import { colors } from '../constants/theme';
import { Card, ErrorState } from './ui';

export default function OfferingSection({ filters }: { filters: Filters }) {
  const [data, setData] = useState<OfferingRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    setStatus('loading');
    getByOffering(filters)
      .then((r) => { setData(r); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [filters]);

  if (status === 'loading') return null;
  if (status === 'error') return <ErrorState />;

  return (
    <Card
      title="What schools offer"
      accent={colors.yellow}
      subtitle="School counts by the levels they provide — the shape of the education system."
    >
      <div style={{ height: Math.max(280, data.length * 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
            <CartesianGrid stroke={colors.line} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12, fill: colors.inkSoft }} />
            <YAxis type="category" dataKey="offering" width={140} interval={0} tick={{ fontSize: 11, fill: colors.ink }} />
            <Tooltip formatter={(v) => Number(v).toLocaleString()} />
            <Bar dataKey="schools" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={i === 0 ? colors.blue : colors.blueSoft} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}