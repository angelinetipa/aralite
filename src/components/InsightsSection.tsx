// src/components/InsightsSection.tsx
// The "briefing" — plain-language findings the app calculated for the
// user. This is what makes Aralite feel like a real decision tool: it
// tells DepEd staff what matters before they read a single chart.

import { useEffect, useState } from 'react';
import { getInsights, type Insight } from '../lib/insights';
import { colors, clay } from '../constants/theme';

// Each tone maps to a flag color + label so findings are scannable.
const TONE = {
  alert: { color: colors.red, label: 'Needs attention' },
  info: { color: colors.blue, label: 'Good to know' },
  good: { color: colors.yellow, label: 'Highlight' },
} as const;

export default function InsightsSection({ region }: { region: string | null }) {
  const [items, setItems] = useState<Insight[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    setStatus('loading');
    getInsights(region)
      .then((r) => { setItems(r); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [region]);

  if (status !== 'ready' || items.length === 0) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Key findings</h2>
        <span style={{ fontSize: 13, color: colors.inkSoft }}>
          {region ? `for ${region}` : 'nationwide'} · auto-calculated from the data
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 14,
      }}>
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