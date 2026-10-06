// src/components/StrandGenderSection.tsx
// Gender balance within each senior high strand.
//
// Wording note. This is enrollment, not choice. Availability shapes
// these bars too, so nothing here says boys and girls "choose" a strand.
//
// Color. Two neutral tones, because the two groups only need to be told
// apart. Neither is the thing to look at, so neither gets an accent.
//
// The title names the strand with the biggest gap. Strands under
// MIN_LEARNERS are skipped for that headline, since a tiny strand can
// look extreme on very few people.

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getStrandByGender, type StrandGenderRow } from '../lib/queries';
import { type Filters } from '../lib/filters';
import { compact } from '../lib/format';
import { colors } from '../constants/theme';
import { Card, ErrorState } from './ui';

const MIN_LEARNERS = 1000;

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

  const widest = data
    .filter((r) => r.Male + r.Female >= MIN_LEARNERS)
    .map((r) => ({ ...r, femalePct: (r.Female / (r.Male + r.Female)) * 100 }))
    .sort((a, b) => Math.abs(b.femalePct - 50) - Math.abs(a.femalePct - 50))[0];

  const title = widest
    ? `${widest.strand} has the widest gender gap, ${Math.round(Math.max(widest.femalePct, 100 - widest.femalePct))}% ${widest.femalePct > 50 ? 'girls' : 'boys'}`
    : 'Strand enrollment by gender';

  return (
    <Card
      title={title}
      subtitle="Male and female enrollment in each senior high strand. This is enrollment, not choice, because availability shapes it too."
    >
      <div style={{ height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data} layout="vertical" barCategoryGap={8}
            margin={{ top: 8, right: 24, bottom: 24, left: 4 }}
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
            <Legend verticalAlign="top" height={28} iconType="square" />
            <Bar dataKey="Male" fill={colors.grayDark} radius={[0, 4, 4, 0]} />
            <Bar dataKey="Female" fill={colors.gray} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}