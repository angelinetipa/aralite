// src/components/ui.tsx
// Shared UI pieces. Card carries the claymorphism-lite look so every
// section matches without copy-pasting styles.

import type { ReactNode } from 'react';
import { colors, clay } from '../constants/theme';

// A card with a kicker gets a blue top border and a small label above the
// title, the same marker the finding card uses. Cards without a kicker stay
// plain. Use it only for the cards that make up the argument.
// A card can also carry a finding, one or two sentences the app worked
// out from the data. It sits in a soft neutral box between the subtitle
// and the chart, and it uses no color, so it never competes with the bars.
export function Card({ title, subtitle, kicker, finding, children }: {
  title: string;
  subtitle?: string;
  kicker?: string;
  finding?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        ...clay.card,
        padding: '0.9rem 1.1rem',
        marginBottom: 14,
        ...(kicker ? { borderTop: `4px solid ${colors.highlight}` } : null),
      }}
    >
      {kicker && (
        <div
          style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: colors.highlight, marginBottom: 6,
          }}
        >
          {kicker}
        </div>
      )}
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: colors.ink }}>{title}</h2>
      {subtitle && (
        <p style={{ color: colors.inkSoft, fontSize: 14, margin: '3px 0 0' }}>{subtitle}</p>
      )}
      {finding && (
        <div
          style={{
            marginTop: 8, padding: '7px 10px', borderRadius: 10,
            background: '#F4F1E9', fontSize: 13, lineHeight: 1.5, color: colors.ink,
          }}
        >
          <strong>Key finding </strong>
          {finding}
        </div>
      )}
      <div style={{ marginTop: 10 }}>{children}</div>
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
        margin: '10px 0 0',
        paddingTop: 8,
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
    <details style={{ marginTop: 8 }}>
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