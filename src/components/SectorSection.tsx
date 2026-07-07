// src/components/SectorSection.tsx
// Public vs Private (plus SUCs/LUCs, PSO). A donut tells this
// one-glance story best: public dominates — by how much?

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getBySector, type SectorRow } from '../lib/queries';
import { type Filters } from '../lib/filters';
import { colors } from '../constants/theme';
import { Card, ErrorState } from './ui';

const SECTOR_COLORS = [colors.blue, colors.red, colors.yellow, colors.blueSoft];

export default function SectorSection({ filters }: { filters: Filters }) {
  const [data, setData] = useState<SectorRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    setStatus('loading');
    getBySector(filters)
      .then((rows) => { setData(rows); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [filters]);

  if (status === 'loading') return null; // App spinner covers this
  if (status === 'error') return <ErrorState />;

  const total = data.reduce((s, r) => s + r.total, 0);
  const pub = data.find((d) => d.sector === 'Public');
  const pct = pub && total ? Math.round((pub.total / total) * 100) : 0;

  return (
    <Card
      title="Public vs private schools"
      accent={colors.red}
      subtitle={`${pct}% of learners are in public schools.`}
    >
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data} dataKey="total" nameKey="sector"
              innerRadius="55%" outerRadius="80%" paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => Number(v).toLocaleString()} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}