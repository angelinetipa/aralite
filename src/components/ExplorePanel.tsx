// src/components/ExplorePanel.tsx
// "Explore your area" as one slim row on the bento grid. Two blocks:
//
//   left (5 columns)   heading and the filter
//   right (7 columns)  four numbers for the area picked, each compared
//                      with the country
//
// Both blocks stretch to the same height, so the row reads as one tool.
// The charts and the school list render below this row, in the page.
// This component only holds the controls and the numbers.

import { type Filters, scopeLabel } from '../lib/filters';
import { colors, clay } from '../constants/theme';
import FilterBar from './FilterBar';
import StatCards from './StatCards';

const frame = {
  ...clay.card,
  padding: '0.9rem 1.1rem',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
} as const;

export default function ExplorePanel({
  filters, onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const scope = scopeLabel(filters);

  return (
    <div className="aralite-bento">
      {/* Left. Heading and filter. */}
      <div className="bento-5 bento-fill">
        <div className="aralite-card" style={frame}>
          <div
            style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: colors.inkSoft, marginBottom: 3,
            }}
          >
            Explore your area
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 10px', color: colors.ink }}>
            Compare your area with the country
          </h2>
          <FilterBar filters={filters} onChange={onChange} />
        </div>
      </div>

      {/* Right. Four numbers for the area picked. */}
      <div className="bento-7 bento-fill">
        <div className="aralite-card" style={frame}>
          <div style={{ fontSize: 13, color: colors.inkSoft, marginBottom: 8 }}>
            Numbers for <strong style={{ color: colors.ink }}>{scope}</strong>
          </div>
          {/* flex 1 lets the tiles stretch to the height of the row. */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <StatCards filters={filters} />
          </div>
        </div>
      </div>
    </div>
  );
}