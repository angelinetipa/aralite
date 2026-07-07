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
      flex: '1 1 180px',
      padding: '1.1rem 1.3rem',
      borderTop: `4px solid ${accent}`,
    }}>
      <div style={{ fontSize: 13, color: colors.inkSoft }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: colors.ink, marginTop: 4 }}>{value}</div>
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
    <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
      <StatCard
        label={'Total learners'}
        value={h.total.toLocaleString()}
        accent={colors.blue}
      />
      <StatCard label="Schools" value={h.schools.toLocaleString()} accent={colors.yellow} />
      <StatCard label="Senior-high learners" value={h.shs.toLocaleString()} accent={colors.red} />
      <StatCard label="Largest region" value={h.topRegion} accent={colors.blue} />
    </div>
  );
}