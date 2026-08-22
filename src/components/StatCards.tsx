// src/components/StatCards.tsx
// Five headline numbers for the current filter.
//
// "Male / Female" was removed. It was recomputing correctly, but the
// real spread across the 17 regions is 48.6% to 51.7% male — so it
// printed 51% / 49% almost everywhere and looked frozen. A card that shows the same value
// no matter what you select is not a statistic, it is decoration, and it
// was taking the most valuable space on the page. The gender breakdown
// is still on the page in full, as its own chart, where the small
// differences are actually visible.
//
// It is replaced by strands per school, which moves from 1.97 to 3.11
// across regions and is the number the dashboard's finding rests on.

import { useEffect, useState } from 'react';
import { type Filters } from '../lib/filters';
import { getHeadline, type Headline } from '../lib/queries';
import { getAvailability } from '../lib/story';
import { colors, clay } from '../constants/theme';

function StatCard({
  label, value, accent, note,
}: { label: string; value: string; accent: string; note?: string }) {
  return (
    <div style={{
      ...clay.card,
      flex: '1 0 150px',
      minWidth: 150,
      padding: '1.1rem 1.2rem',
      borderTop: `4px solid ${accent}`,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 13, color: colors.inkSoft }}>{label}</div>
      <div style={{
        fontSize: 23, fontWeight: 800, color: colors.ink,
        marginTop: 4, whiteSpace: 'nowrap',
      }}>
        {value}
      </div>
      {note && (
        <div style={{ fontSize: 11, color: colors.inkSoft, marginTop: 3 }}>{note}</div>
      )}
    </div>
  );
}

export default function StatCards({ filters }: { filters: Filters }) {
  const [h, setH] = useState<Headline | null>(null);
  const [strands, setStrands] = useState<{ scope: number; national: number } | null>(null);

  useEffect(() => {
    getHeadline(filters).then(setH).catch(() => setH(null));
    getAvailability(filters)
      .then((a) => setStrands({ scope: a.scope.avgStrands, national: a.national.avgStrands }))
      .catch(() => setStrands(null));
  }, [filters]);

  if (!h) return null;

  return (
    <div style={{
      display: 'flex', gap: 14, marginBottom: 24,
      overflowX: 'auto', padding: '6px 2px 12px',
    }}>
      <StatCard label="Total learners" value={h.total.toLocaleString()} accent={colors.blue} />
      <StatCard label="Schools" value={h.schools.toLocaleString()} accent={colors.yellow} />
      <StatCard label="Senior-high learners" value={h.shs.toLocaleString()} accent={colors.red} />
      <StatCard label="Largest region" value={h.topRegion} accent={colors.blue} />
      <StatCard
        label="Strands per school"
        value={strands ? strands.scope.toFixed(2) : '—'}
        accent={colors.red}
        note={strands ? `${strands.national.toFixed(2)} nationally` : undefined}
      />
      <StatCard label="Avg per school" value={h.avgPerSchool.toLocaleString()} accent={colors.blue} />
    </div>
  );
}