// src/components/ui.tsx
// Shared UI pieces. Card carries the claymorphism-lite look so every
// section matches without copy-pasting styles.

import type { ReactNode } from 'react';
import { colors, clay } from '../constants/theme';

export function Card({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  /** @deprecated Ignored. Color must mean something, so the decorative
   *  dot is gone. Kept only so existing callers still compile; removed
   *  from callers in Step 3. */
  accent?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ ...clay.card, padding: '1.4rem 1.6rem', marginBottom: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: colors.ink }}>{title}</h2>
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
 * The paragraph under a chart: what it shows, what changed, what it does
 * not license. Keep it to a short paragraph. Past about four lines nobody
 * reads it, and an unread caveat protects nobody.
 */
export function ChartNote({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: 13.5,
        color: colors.inkSoft,
        lineHeight: 1.65,
        margin: '16px 0 0',
        paddingTop: 14,
        borderTop: `1px solid ${colors.line}`,
        maxWidth: '70ch',
      }}
    >
      {children}
    </p>
  );
}

/**
 * A one-line summary that opens to the full text. Keeps the page
 * scannable while the detail stays one click away.
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