// src/components/StrandsTab.tsx
// The SHS choice-gap story: which senior-high strands students pick.
// Horizontal bars because strand names are long and easier to read
// side-on. TVL usually leads — vocational over academic.

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getByStrand, type StrandRow } from '../lib/queries';
import { colors } from '../constants/theme';
import { Card, Loading, ErrorState } from './ui';

export default function StrandsTab({ region }: { region: string | null }) {
  const [data, setData] = useState<StrandRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    setStatus('loading');
    getByStrand(region)
      .then((rows) => {
        setData(rows);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [region]);

  if (status === 'loading') return <Loading />;
  if (status === 'error') return <ErrorState />;

  const top = data[0];

  return (
    <Card
      title="What senior-high students choose"
      subtitle={
        top
          ? `${top.strand} leads with ${top.total.toLocaleString()} learners — a signal of where students head after Grade 10.`
          : 'Senior-high strand enrollment.'
      }
    >
      <div style={{ height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
          >
            <CartesianGrid stroke={colors.line} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: colors.inkSoft }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="strand"
              width={110}
              tick={{ fontSize: 12, fill: colors.ink }}
            />
            <Tooltip formatter={(v) => Number(v).toLocaleString()} />
            <Bar dataKey="total" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                // Top strand in blue, rest in a lighter shade — draws the eye
                // to the leader without a rainbow.
                <Cell key={i} fill={i === 0 ? colors.blue : '#9BB4DB'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}