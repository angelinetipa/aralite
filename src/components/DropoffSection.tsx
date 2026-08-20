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
import { largestGap, GRADE_ORDER } from '../lib/metrics';
import { colors } from '../constants/theme';
import { Card, ErrorState } from './ui';

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

  // One shared implementation, tested in metrics.test.ts. This used to
  // be a second copy of the same loop, which is how it ended up naming a
  // different grade than the Key findings panel for the same region.
  const ordered = GRADE_ORDER
    .map((g) => data.find((d) => d.grade === g))
    .filter((d): d is GradeRow => d !== undefined && d.total > 0);

  const gap = largestGap(ordered);
  const dip = gap ? ordered.find((d) => d.grade === gap.to) : undefined;

  return (
    <Card
      title={
        gap
          ? `The largest gap is ${gap.from} to ${gap.to} — ${gap.pct}% fewer learners`
          : 'Enrollment by grade level'
      }
      accent={colors.red}
      subtitle={
        gap
          ? `${gap.lost.toLocaleString()} fewer learners in ${gap.to} than ${gap.from} — two different groups counted in the same year, not a dropout rate.`
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
                  value: gap!.to, position: 'top', offset: 10,
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