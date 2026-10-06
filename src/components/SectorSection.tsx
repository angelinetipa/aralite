// src/components/SectorSection.tsx
// Public vs private, plus SUCs/LUCs and PSO.
//
// This was a donut. Bars are easier to compare and every sector gets a
// direct label with its share, so no legend is needed. Gray by default,
// blue on the largest sector only.

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { getBySector, type SectorRow } from '../lib/queries';
import { type Filters } from '../lib/filters';
import { compact } from '../lib/format';
import { colors } from '../constants/theme';
import { Card, ErrorState } from './ui';

export default function SectorSection({ filters }: { filters: Filters }) {
  const [data, setData] = useState<SectorRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    setStatus('loading');
    getBySector(filters)
      .then((rows) => { setData(rows); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [filters]);

  if (status === 'loading') return null;
  if (status === 'error') return <ErrorState />;

  const total = data.reduce((s, r) => s + r.total, 0);
  const share = (v: number) => (total ? (v / total) * 100 : 0);
  const rows = data.map((r) => {
    const s = share(r.total);
    return { ...r, label: `${compact(r.total)} (${s < 1 ? '<1' : Math.round(s)}%)` };
  });
  const pub = data.find((d) => d.sector === 'Public');
  const pubPct = pub ? Math.round(share(pub.total)) : 0;

  return (
    <Card
      title={pub ? `Public schools hold ${pubPct}% of learners` : 'Learners by school sector'}
      subtitle="Learners by sector. SUCs and LUCs are state and local universities and colleges. PSO is Philippine Schools Overseas."
    >
      <div style={{ height: Math.max(220, rows.length * 56 + 50) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows} layout="vertical" barCategoryGap={10}
            margin={{ top: 8, right: 84, bottom: 24, left: 4 }}
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
              type="category" dataKey="sector" width={84} interval={0}
              axisLine={{ stroke: colors.line }} tickLine={false}
              tick={{ fontSize: 11.5, fill: colors.ink }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              formatter={(v) => Number(v).toLocaleString()}
            />
            <Bar dataKey="total" radius={[0, 4, 4, 0]}>
              {rows.map((r, i) => (
                <Cell key={r.sector} fill={i === 0 ? colors.highlight : colors.gray} />
              ))}
              <LabelList
                dataKey="label" position="right"
                style={{ fontSize: 11.5, fill: colors.ink, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}