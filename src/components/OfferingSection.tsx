// src/components/OfferingSection.tsx
// What levels schools offer (Modified COC). Shows the shape of the school
// system, which helps when planning where to add senior high or new
// levels. Gray by default, blue on the most common type only.

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { getByOffering, type OfferingRow } from '../lib/queries';
import { type Filters } from '../lib/filters';
import { compact } from '../lib/format';
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

  const top = data[0];
  const all = data.reduce((s, r) => s + r.schools, 0);
  const pct = top && all ? Math.round((top.schools / all) * 100) : 0;

  return (
    <Card
      title={
        top
          ? `${top.offering} is the most common school type, ${pct}% of schools`
          : 'What schools offer'
      }
      subtitle="Number of schools by the levels they provide."
    >
      <div style={{ height: Math.max(280, data.length * 40 + 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data} layout="vertical" barCategoryGap={8}
            margin={{ top: 8, right: 52, bottom: 24, left: 4 }}
          >
            <XAxis
              type="number" tickFormatter={compact}
              tick={{ fontSize: 11.5, fill: colors.inkSoft }}
              axisLine={{ stroke: colors.line }} tickLine={{ stroke: colors.line }}
              label={{
                value: 'Schools', position: 'insideBottom', offset: -14,
                style: { fontSize: 11.5, fill: colors.inkSoft },
              }}
            />
            <YAxis
              type="category" dataKey="offering" width={140} interval={0}
              axisLine={{ stroke: colors.line }} tickLine={false}
              tick={{ fontSize: 11.5, fill: colors.ink }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              formatter={(v) => Number(v).toLocaleString()}
            />
            <Bar dataKey="schools" radius={[0, 4, 4, 0]}>
              {data.map((r, i) => (
                <Cell key={r.offering} fill={i === 0 ? colors.highlight : colors.gray} />
              ))}
              <LabelList
                dataKey="schools" position="right"
                formatter={(v: unknown) => Number(v).toLocaleString()}
                style={{ fontSize: 11.5, fill: colors.ink, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}