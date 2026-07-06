// src/components/ui.tsx
// Shared UI pieces. Card carries the claymorphism-lite look so every
// section matches without copy-pasting styles.

import type { ReactNode } from 'react';
import { colors, clay } from '../constants/theme';

export function Card({ title, subtitle, accent, children }: {
  title: string;
  subtitle?: string;
  accent?: string;               // small colored dot beside the title
  children: ReactNode;
}) {
  return (
    <div style={{ ...clay.card, padding: '1.4rem 1.6rem', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {accent && (
          <span style={{
            width: 10, height: 10, borderRadius: 5, background: accent,
            boxShadow: `0 0 0 4px ${accent}22`,
          }} />
        )}
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: colors.ink }}>{title}</h2>
      </div>
      {subtitle && (
        <p style={{ color: colors.inkSoft, fontSize: 14, margin: '6px 0 0' }}>{subtitle}</p>
      )}
      <div style={{ marginTop: 16 }}>{children}</div>
    </div>
  );
}

export function Loading() {
  return <p style={{ color: colors.inkSoft }}>Loading…</p>;
}
export function ErrorState() {
  return <p style={{ color: colors.red }}>Could not load data.</p>;
}