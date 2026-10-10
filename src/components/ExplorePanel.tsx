// src/components/ExplorePanel.tsx
// "Explore your area" as one panel. Everything that belongs to the
// filter sits in this single box, so the reader sees one tool.
//
//   heading        what this is for
//   filter         Region first, then the narrower levels as they are picked
//   four numbers   for the area picked, each compared with the country
//   more charts    a button that opens six background charts
//
// The charts and the school list render below the panel, in the page.
// This component only holds the controls and the numbers.

import { type Filters, scopeLabel } from '../lib/filters';
import { colors, clay } from '../constants/theme';
import FilterBar from './FilterBar';
import StatCards from './StatCards';

export default function ExplorePanel({
  filters, onChange, showMore, onToggleMore,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  showMore: boolean;
  onToggleMore: () => void;
}) {
  const scope = scopeLabel(filters);

  return (
    <div style={{ ...clay.card, padding: '1rem 1.2rem', margin: '22px 0 14px' }}>
      <div
        style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: colors.inkSoft, marginBottom: 3,
        }}
      >
        Explore your area
      </div>
      <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0, color: colors.ink }}>
        Compare your area with the country
      </h2>
      <p style={{ fontSize: 13.5, color: colors.inkSoft, margin: '3px 0 12px', lineHeight: 1.55 }}>
        Pick a region to compare it with the country. You can go down to a single barangay.
      </p>

      <FilterBar filters={filters} onChange={onChange} />

      <div style={{ fontSize: 13, color: colors.inkSoft, margin: '14px 0 8px' }}>
        Numbers for <strong style={{ color: colors.ink }}>{scope}</strong>
      </div>
      <StatCards filters={filters} />

      <button
        onClick={onToggleMore}
        aria-expanded={showMore}
        style={{
          width: '100%', marginTop: 12, textAlign: 'left', cursor: 'pointer',
          padding: '0.7rem 1rem', borderRadius: 12,
          border: `1px solid ${colors.line}`, background: '#F4F1E9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
        }}
      >
        <span>
          <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: colors.ink }}>
            {showMore ? 'Hide the 6 charts' : `Show 6 more charts for ${scope}`}
          </span>
          <span style={{ display: 'block', fontSize: 12.5, color: colors.inkSoft, marginTop: 2 }}>
            Background charts, each with its own key finding.
          </span>
        </span>
        <span style={{ fontSize: 20, color: colors.inkSoft, lineHeight: 1 }}>
          {showMore ? '−' : '+'}
        </span>
      </button>
    </div>
  );
}