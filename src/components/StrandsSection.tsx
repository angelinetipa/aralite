// src/components/StrandsSection.tsx
// Senior high enrollment by strand.
//
// Wording note. This chart measures ENROLLMENT, not choice. A learner can
// only enrol in a strand their own school runs, so the bars mix what
// learners want with what is available. Nothing here says "choose",
// "pick", or "prefer".
//
// Color. Gray by default, blue on the largest strand only.

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { getByStrand, type StrandRow } from '../lib/queries';
import { type Filters } from '../lib/filters';
import { compact } from '../lib/format';
import { colors } from '../constants/theme';
import { Card, ErrorState } from './ui';

export default function StrandsSection({ filters }: { filters: Filters }) {
  const [data, setData] = useState<StrandRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    setStatus('loading');
    getByStrand(filters)
      .then((rows) => { setData(rows); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [filters]);

  if (status === 'loading') return null;
  if (status === 'error') return <ErrorState />;

  const top = data[0];
  const all = data.reduce((s, r) => s + r.total, 0);
  const pct = top && all ? Math.round((top.total / all) * 100) : 0;

  return (
    <Card
      title={
        top
          ? `${top.strand} has the most senior high learners, ${pct}% of the total`
          : 'Senior high enrollment by strand'
      }
      subtitle="Learners enrolled in each strand. This is enrollment, not preference, because a learner can only enrol in a strand their school runs."
    >
      <div style={{ height: 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data} layout="vertical" barCategoryGap={6}
            margin={{ top: 8, right: 52, bottom: 24, left: 4 }}
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
              type="category" dataKey="strand" width={96} interval={0}
              axisLine={{ stroke: colors.line }} tickLine={false}
              tick={{ fontSize: 11.5, fill: colors.ink }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              formatter={(v) => Number(v).toLocaleString()}
            />
            <Bar dataKey="total" radius={[0, 4, 4, 0]}>
              {data.map((r, i) => (
                <Cell key={r.strand} fill={i === 0 ? colors.highlight : colors.gray} />
              ))}
              <LabelList
                dataKey="total" position="right"
                formatter={(v: unknown) => compact(Number(v))}
                style={{ fontSize: 11.5, fill: colors.ink, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}