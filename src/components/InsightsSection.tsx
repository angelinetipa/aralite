// src/components/InsightsSection.tsx
// Plain language findings the app calculated for the current filter.
//
// Color. Red is only for "needs attention". Everything else is neutral,
// so a red flag still means something when it appears.

import { useEffect, useState } from 'react';
import { type Filters } from '../lib/filters';
import { scopeLabel } from '../lib/filters';
import { getInsights, type Insight } from '../lib/insights';
import { colors, clay } from '../constants/theme';

const TONE = {
  alert: { color: colors.worse, label: 'Needs attention' },
  info: { color: colors.grayDark, label: 'Good to know' },
  good: { color: colors.highlight, label: 'Highlight' },
} as const;

export default function InsightsSection({ filters }: { filters: Filters }) {
  const [items, setItems] = useState<Insight[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    setStatus('loading');
    getInsights(filters)
      .then((r) => { setItems(r); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [filters]);

  if (status !== 'ready' || items.length === 0) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Key findings</h2>
        <span style={{ fontSize: 13, color: colors.inkSoft }}>
          for {scopeLabel(filters)} · calculated from the data
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
        {items.map((it, i) => {
          const t = TONE[it.tone];
          return (
            <div key={i} style={{ ...clay.card, padding: '1.1rem 1.3rem', borderLeft: `5px solid ${t.color}` }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: t.color,
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {t.label}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, margin: '6px 0 6px', color: colors.ink }}>
                {it.headline}
              </div>
              <div style={{ fontSize: 13.5, color: colors.inkSoft, lineHeight: 1.5 }}>
                {it.detail}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}