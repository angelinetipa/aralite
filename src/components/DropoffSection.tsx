// src/components/DropoffSection.tsx
// Enrollment per grade level, with the largest gap found and named.
//
// This used to hardcode Grade 6 -> Grade 7 in the subtitle while
// insights.ts computed the largest gap dynamically. Filter to BARMM and
// the two disagreed on screen: the Key findings panel said G1 -> G2
// (19,207) and this subtitle said Grade 7 (14,541). Both now search for
// the real largest gap, so they cannot contradict each other.
//
// The gap is NOT a dropout rate. These are two different groups counted
// in the same school year, and the wording here has to keep saying so.

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot,
} from 'recharts';
import { getByGrade, type GradeRow } from '../lib/queries';
import { type Filters } from '../lib/filters';
import { compact } from '../lib/format';
import { colors } from '../constants/theme';
import { Card, ErrorState } from './ui';

const ORDER = ['K', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12'];

export default function DropoffSection({ filters }: { filters: Filters }) {
  const [data, setData] = useState<GradeRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    setStatus('loading');
    getByGrade(filters)
      .then((rows) => { setData(rows); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [filters]);

  if (status === 'loading') return null;
  if (status === 'error') return <ErrorState />;
  if (data.length === 0) return null;

  // Find the biggest fall between consecutive grades, whatever it is.
  const ordered = ORDER
    .map((g) => data.find((d) => d.grade === g))
    .filter((d): d is GradeRow => Boolean(d) && d!.total > 0);

  let worst = { from: '', to: '', lost: 0, base: 0 };
  for (let i = 1; i < ordered.length; i++) {
    const lost = ordered[i - 1].total - ordered[i].total;
    if (lost > worst.lost) {
      worst = { from: ordered[i - 1].grade, to: ordered[i].grade, lost, base: ordered[i - 1].total };
    }
  }

  const pct = worst.base ? Math.round((worst.lost / worst.base) * 100) : 0;
  const dip = ordered.find((d) => d.grade === worst.to);

  return (
    <Card
      title={
        worst.lost > 0
          ? `The largest gap is ${worst.from} to ${worst.to} — ${pct}% fewer learners`
          : 'Enrollment by grade level'
      }
      accent={colors.red}
      subtitle={
        worst.lost > 0
          ? `${worst.lost.toLocaleString()} fewer learners enrolled in ${worst.to} than ${worst.from}. Two different groups counted in the same year — not a dropout rate.`
          : 'Enrollment per grade level.'
      }
    >
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={ordered} margin={{ top: 14, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid stroke={colors.line} vertical={false} />
            <XAxis dataKey="grade" tick={{ fontSize: 12, fill: colors.inkSoft }} />
            <YAxis tick={{ fontSize: 12, fill: colors.inkSoft }} tickFormatter={compact} />
            <Tooltip formatter={(v) => Number(v).toLocaleString()} />
            <Line
              type="monotone" dataKey="total"
              stroke={colors.blue} strokeWidth={3}
              dot={{ r: 4, fill: colors.blue }}
              activeDot={{ r: 6, fill: colors.red }}
            />
            {/* Mark the gap the title names, so the words and the picture
                point at the same place on the chart. */}
            {dip && (
              <ReferenceDot
                x={dip.grade} y={dip.total} r={7}
                fill={colors.red} stroke="#fff" strokeWidth={2}
                label={{
                  value: worst.to, position: 'top', offset: 10,
                  style: { fontSize: 11, fontWeight: 700, fill: colors.red },
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}