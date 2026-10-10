// src/components/StrandGenderSection.tsx
// Gender balance within each senior high strand, shown as a 100% bar.
//
// Why 100% bars. Strands differ hugely in size (TVL has over a million
// learners, PBM a few thousand). On a raw count axis the small strands
// shrink to nothing and their bars disappear. Shares keep every strand
// readable, and the total learners sit beside each name so a big share
// on a tiny strand is not mistaken for a big finding.
//
// Wording note. This is enrollment, not choice. Availability shapes
// these bars too, so nothing here says boys and girls "choose" a strand.
//
// Color. Two shades of the brand blue, dark for boys and lighter for
// girls. Red is never used here, since red means worse. Colors live in
// theme.ts.
//
// The title names the strand with the biggest gap. Strands under
// MIN_LEARNERS are skipped for that headline, since a tiny strand can
// look extreme on very few people.

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, LabelList,
} from 'recharts';
import { getStrandByGender, type StrandGenderRow } from '../lib/queries';
import { type Filters } from '../lib/filters';
import { compact } from '../lib/format';
import { colors } from '../constants/theme';
import { Card, ErrorState } from './ui';

const MIN_LEARNERS = 1000;

type Row = StrandGenderRow & {
  label: string;      // strand name with its total, e.g. "TVL (1.2M)"
  malePct: number;
  femalePct: number;
};

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
  if (data.length === 0) return null;

  const rows: Row[] = data.map((r) => {
    const total = r.Male + r.Female;
    return {
      ...r,
      label: `${r.strand} (${compact(total)})`,
      malePct: total ? (r.Male / total) * 100 : 0,
      femalePct: total ? (r.Female / total) * 100 : 0,
    };
  });

  const widest = rows
    .filter((r) => r.Male + r.Female >= MIN_LEARNERS)
    .sort((a, b) => Math.abs(b.femalePct - 50) - Math.abs(a.femalePct - 50))[0];

  const title = widest
    ? `${widest.strand} has the widest gender gap, ${Math.round(Math.max(widest.femalePct, widest.malePct))}% ${widest.femalePct > 50 ? 'girls' : 'boys'}`
    : 'Strand enrollment by gender';

  // Second sentence of the story. How many strands lean toward girls,
  // and which way the largest strand leans.
  const girlsLead = rows.filter((r) => r.Female > r.Male).length;
  const big = rows.reduce((a, b) => (b.Male + b.Female > a.Male + a.Female ? b : a), rows[0]);
  const bigLean = big.femalePct >= 50 ? 'girls' : 'boys';
  const bigPct = Math.round(Math.max(big.femalePct, big.malePct));
  const finding = `Girls outnumber boys in ${girlsLead} of ${rows.length} strands. ${Math.abs(big.femalePct - 50) < 1
    ? `The largest strand, ${big.strand}, is split almost evenly.`
    : `The largest strand, ${big.strand}, is ${bigPct}% ${bigLean}.`
    }`;

  // Share labels inside the bars. Slices under 8% are too narrow to hold text.
  const pctLabel = (v: unknown) => (Number(v) >= 8 ? `${Math.round(Number(v))}%` : '');

  return (
    <Card
      finding={finding}
      title={title}
      subtitle="Share of boys and girls in each senior high strand. The number beside each strand is its total learners. This is enrollment, not choice, because availability shapes it too."
    >
      <div style={{ height: Math.max(300, rows.length * 42 + 70) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows} layout="vertical" barCategoryGap={8}
            margin={{ top: 8, right: 24, bottom: 24, left: 4 }}
          >
            <XAxis
              type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11.5, fill: colors.inkSoft }}
              axisLine={{ stroke: colors.line }} tickLine={{ stroke: colors.line }}
              label={{
                value: 'Share of learners in the strand', position: 'insideBottom', offset: -14,
                style: { fontSize: 11.5, fill: colors.inkSoft },
              }}
            />
            <YAxis
              type="category" dataKey="label" width={120} interval={0}
              axisLine={{ stroke: colors.line }} tickLine={false}
              tick={{ fontSize: 11.5, fill: colors.ink }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              formatter={(v, name, item) => {
                const p = (item as { payload?: Row }).payload;
                const count = p ? (name === 'Boys' ? p.Male : p.Female) : 0;
                return [`${Number(v).toFixed(1)}% (${count.toLocaleString()} learners)`, name];
              }}
            />
            <Legend verticalAlign="top" height={28} iconType="square" />
            <ReferenceLine x={50} stroke={colors.ink} strokeDasharray="4 4" strokeWidth={1} />
            <Bar dataKey="malePct" name="Boys" stackId="g" fill={colors.male} stroke="#fff" strokeWidth={1}>
              <LabelList
                dataKey="malePct" position="center" formatter={pctLabel}
                style={{ fontSize: 11.5, fill: '#fff', fontWeight: 700 }}
              />
            </Bar>
            <Bar dataKey="femalePct" name="Girls" stackId="g" fill={colors.female} stroke="#fff" strokeWidth={1}>
              <LabelList
                dataKey="femalePct" position="center" formatter={pctLabel}
                style={{ fontSize: 11.5, fill: '#fff', fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}