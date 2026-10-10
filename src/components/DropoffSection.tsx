// src/components/DropoffSection.tsx
// Enrollment per grade level, with the largest gap found and named.
//
// The largest gap comes from largestGap() in metrics.ts, the same
// function the Key findings panel uses, so the two cannot name different
// grades. The gap is NOT a dropout rate. These are two different groups
// counted in the same school year, and the wording must keep saying so.
//
// Color. A gray line, with one blue dot on the grade where the gap lands.

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot,
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

  const ordered = GRADE_ORDER
    .map((g) => data.find((d) => d.grade === g))
    .filter((d): d is GradeRow => d !== undefined && d.total > 0);

  const gap = largestGap(ordered);
  const dip = gap ? ordered.find((d) => d.grade === gap.to) : undefined;

  // The title names the largest drop between two neighbouring grades.
  // This adds the whole picture, the highest grade against the last one
  // shown. Same caution applies: two groups counted in one year.
  const peak = ordered.reduce((a, b) => (b.total > a.total ? b : a), ordered[0]);
  const last = ordered[ordered.length - 1];
  const below = peak.total ? Math.round(((peak.total - last.total) / peak.total) * 100) : 0;
  const finding = ordered.length >= 3 && peak.grade !== last.grade && below > 0
    ? `Enrollment is highest in ${peak.grade} at ${peak.total.toLocaleString()} learners. ${last.grade} has ${below}% fewer.`
    : undefined;

  return (
    <Card
      finding={finding}
      title={
        gap
          ? `The largest drop is ${gap.from} to ${gap.to}, with ${gap.pct}% fewer learners`
          : 'Enrollment by grade level'
      }
      subtitle={
        gap
          ? `${gap.lost.toLocaleString()} fewer learners in ${gap.to} than in ${gap.from}. These are two different groups counted in the same year, so this is not a dropout rate.`
          : 'Learners enrolled in each grade level.'
      }
    >
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={ordered} margin={{ top: 14, right: 20, bottom: 24, left: 8 }}>
            <XAxis
              dataKey="grade"
              tick={{ fontSize: 11.5, fill: colors.inkSoft }}
              axisLine={{ stroke: colors.line }} tickLine={{ stroke: colors.line }}
              label={{
                value: 'Grade level', position: 'insideBottom', offset: -14,
                style: { fontSize: 11.5, fill: colors.inkSoft },
              }}
            />
            <YAxis
              tickFormatter={compact} domain={[0, 'auto']}
              tick={{ fontSize: 11.5, fill: colors.inkSoft }}
              axisLine={{ stroke: colors.line }} tickLine={{ stroke: colors.line }}
              label={{
                value: 'Learners', angle: -90, position: 'insideLeft', offset: 4,
                style: { fontSize: 11.5, fill: colors.inkSoft },
              }}
            />
            <Tooltip formatter={(v) => Number(v).toLocaleString()} />
            <Line
              type="monotone" dataKey="total"
              stroke={colors.grayDark} strokeWidth={2.5}
              dot={{ r: 3, fill: colors.grayDark, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: colors.highlight }}
            />
            {/* Marks the grade the title names, so the words and the
                picture point at the same place. */}
            {dip && (
              <ReferenceDot
                x={dip.grade} y={dip.total} r={7}
                fill={colors.highlight} stroke="#fff" strokeWidth={2}
                label={{
                  value: gap!.to, position: 'top', offset: 10,
                  style: { fontSize: 11.5, fontWeight: 700, fill: colors.highlight },
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}