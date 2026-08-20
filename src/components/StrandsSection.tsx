// src/components/StrandsSection.tsx
// Senior-high enrollment by strand.
//
// Wording note: this chart measures ENROLLMENT, not choice. A learner can
// only enrol in a strand their own school offers, so these bars mix what
// learners want with what is available to them. This dataset cannot
// separate the two, so nothing here says "choose", "pick", or "prefer".

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
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

  if (status === 'loading') return null; // App spinner covers this
  if (status === 'error') return <ErrorState />;

  const top = data[0];

  return (
    <Card
      title="Where senior-high learners are enrolled"
      accent={colors.blue}
      subtitle={
        top
          ? `${top.strand} leads with ${top.total.toLocaleString()} learners — enrollment, not preference.`
          : 'Senior-high enrollment by strand.'
      }
    >
      <div style={{ height: 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
            <CartesianGrid stroke={colors.line} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: colors.inkSoft }}
              tickFormatter={compact}
            />
            <YAxis
              type="category" dataKey="strand" width={110}
              interval={0}                    // show EVERY strand label
              tick={{ fontSize: 12, fill: colors.ink }}
            />
            <Tooltip formatter={(v) => Number(v).toLocaleString()} />
            <Bar dataKey="total" radius={[0, 6, 6, 0]}>
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