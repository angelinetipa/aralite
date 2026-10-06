// src/components/IntroPanel.tsx
// The first thing a visitor sees. Two short paragraphs that say what this
// is and where to look next. The page order explains the rest, so there
// is no separate how-to block.

import { colors, clay } from '../constants/theme';

export default function IntroPanel() {
  return (
    <div style={{ ...clay.card, padding: '1.5rem 1.6rem', marginBottom: 24 }}>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          margin: 0,
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
        }}
      >
        Where 27 million Filipino learners go to school.
      </h2>

      <p style={{ fontSize: 14.5, color: colors.inkSoft, lineHeight: 1.6, margin: '10px 0 0', maxWidth: '68ch' }}>
        Aralite turns the Department of Education&rsquo;s enrollment file for school year
        2023 to 2024 into a dashboard. It covers{' '}
        <strong style={{ color: colors.ink }}>60,167 schools</strong> and{' '}
        <strong style={{ color: colors.ink }}>27 million learners</strong>, and it runs
        entirely in your browser.
      </p>

      <p style={{ fontSize: 14, color: colors.inkSoft, lineHeight: 1.6, margin: '8px 0 0', maxWidth: '68ch' }}>
        Start with the main finding below. Then pick your own region to compare it with
        the country.
      </p>
    </div>
  );
}