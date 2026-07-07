// src/components/StatCards.tsx
// Four headline numbers with the clay look. One query call fills all.

import { useEffect, useState } from 'react';
import { type Filters } from '../lib/filters';
import { getHeadline, type Headline } from '../lib/queries';
import { colors, clay } from '../constants/theme';

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
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
      <div style={{ fontSize: 23, fontWeight: 800, color: colors.ink, marginTop: 4, whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
}

export default function StatCards({ filters }: { filters: Filters }) {
  const [h, setH] = useState<Headline | null>(null);

  useEffect(() => {
    getHeadline(filters).then(setH).catch(() => setH(null));
  }, [filters]);

  if (!h) return null;

  return (
    <div style={{ display: 'flex', gap: 14, marginBottom: 24, overflowX: 'auto', padding: '6px 2px 12px' }}>
      <StatCard
        label={'Total learners'}
        value={h.total.toLocaleString()}
        accent={colors.blue}
      />
      <StatCard label="Schools" value={h.schools.toLocaleString()} accent={colors.yellow} />
      <StatCard label="Senior-high learners" value={h.shs.toLocaleString()} accent={colors.red} />
      <StatCard label="Largest region" value={h.topRegion} accent={colors.blue} />
      <StatCard label="Male / Female" value={`${h.malePct}% / ${h.femalePct}%`} accent={colors.red} />
      <StatCard label="Avg per school" value={h.avgPerSchool.toLocaleString()} accent={colors.blue} />
    </div>
  );
}