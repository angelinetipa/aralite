// src/components/ui.tsx
// Shared UI pieces. Card carries the claymorphism-lite look so every
// section matches without copy-pasting styles.
//
// Card fills the height of its grid cell. The body grows to take the
// leftover space, so cards in one bento row end on the same line.
//
// A card with a kicker gets a blue top border and a small label above the
// title. Use it only for the cards that make up the argument.
// A card can have an eyebrow, a small gray label above the title. It has
// no border and no color, so it never looks like part of the argument.
// A card can carry a finding, one or two sentences worked out from the
// data. It sits in a soft neutral box between the subtitle and the chart.
//
// dark switches the card to the navy look. Use it for at most two cards
// on a page, placed on a diagonal, so the weight stays balanced.
//
// ChartBox is the chart area inside a card. It never shrinks below min,
// and it stretches to the height the grid cell gives it.

import type { CSSProperties, ReactNode } from 'react';
import { colors, clay } from '../constants/theme';

// Navy used by dark cards. Matches the end of the hero banner gradient.
const DARK_BG = '#0B2A6F';

export function Card({ title, subtitle, kicker, eyebrow, finding, dark = false, children }: {
  title: string;
  subtitle?: string;
  kicker?: string;
  eyebrow?: string;
  finding?: string;
  dark?: boolean;
  children: ReactNode;
}) {
  const ink = dark ? '#FFFFFF' : colors.ink;
  const soft = dark ? 'rgba(255,255,255,0.78)' : colors.inkSoft;

  const frame: CSSProperties = {
    ...clay.card,
    ...(dark
      ? { background: DARK_BG, border: '1px solid rgba(255,255,255,0.10)' }
      : null),
    padding: '0.9rem 1.1rem',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    ...(kicker
      ? { borderTop: `4px solid ${dark ? colors.yellow : colors.highlight}` }
      : null),
  };

  return (
    <div className="aralite-card" style={frame}>
      {kicker && (
        <div
          style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: dark ? colors.yellow : colors.highlight, marginBottom: 6,
          }}
        >
          {kicker}
        </div>
      )}
      {eyebrow && !kicker && (
        <div
          style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: soft, marginBottom: 3,
          }}
        >
          {eyebrow}
        </div>
      )}
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: ink }}>{title}</h2>
      {subtitle && (
        <p style={{ color: soft, fontSize: 14, margin: '3px 0 0' }}>{subtitle}</p>
      )}
      {finding && (
        <div
          style={{
            marginTop: 8, padding: '7px 10px', borderRadius: 10,
            background: dark ? 'rgba(255,255,255,0.10)' : '#F4F1E9',
            fontSize: 13, lineHeight: 1.5, color: ink,
          }}
        >
          <strong>Key finding </strong>
          {finding}
        </div>
      )}
      {/* flex 1 lets the body take the leftover height of the cell. */}
      <div style={{ marginTop: 10, flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

/**
 * The chart area inside a Card. Pass the smallest height the chart can
 * be read at. If the grid cell is taller, the chart stretches to fit.
 */
export function ChartBox({ min, children }: { min: number; children: ReactNode }) {
  return (
    <div style={{ position: 'relative', height: '100%', minHeight: min }}>
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
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
 * Pass dark when it sits on a dark card.
 */
export function Disclosure({
  summary, children, dark = false,
}: { summary: string; children: ReactNode; dark?: boolean }) {
  const soft = dark ? 'rgba(255,255,255,0.78)' : colors.inkSoft;
  return (
    <details style={{ marginTop: 8 }}>
      <summary
        style={{
          cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
          color: soft, listStyle: 'revert',
        }}
      >
        {summary}
      </summary>
      <div style={{ fontSize: 12.5, color: soft, lineHeight: 1.65, marginTop: 8 }}>
        {children}
      </div>
    </details>
  );
}