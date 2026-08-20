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

/**
 * A one-line summary that opens to the full text.
 *
 * The caveats on this dashboard matter, but printed in full they turned
 * every card into a wall of prose. Collapsed, the page stays scannable
 * and the detail is one click away for anyone who wants it — which is
 * the reader who was going to read it anyway.
 */
export function Disclosure({
  summary, children,
}: { summary: string; children: React.ReactNode }) {
  return (
    <details style={{ marginTop: 12 }}>
      <summary
        style={{
          cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
          color: colors.inkSoft, listStyle: 'revert',
        }}
      >
        {summary}
      </summary>
      <div style={{ fontSize: 12.5, color: colors.inkSoft, lineHeight: 1.65, marginTop: 8 }}>
        {children}
      </div>
    </details>
  );
}