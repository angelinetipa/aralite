// src/components/ExplorePanel.tsx
// "Explore your area" as one slim row on the bento grid. Two blocks:
//
//   left (5 columns)   heading, Clear all, and the filter
//   right (7 columns)  four numbers for the area picked, each compared
//                      with the country
//
// Both blocks stretch to the same height, so the row reads as one tool.
// The stat tiles keep their natural height and sit in the middle of
// their card, so a taller filter does not stretch them.
// The charts and the school list render below this row, in the page.
// This component only holds the controls and the numbers.

import { type Filters, LEVELS, scopeLabel } from '../lib/filters';
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
  const anyActive = LEVELS.some((l) => filters[l]);

  return (
    <div className="aralite-bento">
      {/* Left. Heading, Clear all and the filter. */}
      <div className="bento-5 bento-fill">
        <div className="aralite-card" style={frame}>
          <div
            style={{
              display: 'flex', alignItems: 'flex-start',
              justifyContent: 'space-between', gap: 8, marginBottom: 10,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: colors.inkSoft, marginBottom: 3,
                }}
              >
                Explore your area
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: colors.ink }}>
                Compare your area with the country
              </h2>
            </div>
            {anyActive && (
              <button
                type="button"
                onClick={() => onChange({})}
                style={{
                  flexShrink: 0, padding: '6px 12px', borderRadius: 10, cursor: 'pointer',
                  fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap',
                  border: `1px solid ${colors.blue}`, background: '#fff', color: colors.blue,
                }}
              >
                Clear all
              </button>
            )}
          </div>
          <FilterBar filters={filters} onChange={onChange} />
        </div>
      </div>

      {/* Right. Four numbers for the area picked. */}
      <div className="bento-7 bento-fill">
        <div className="aralite-card" style={frame}>
          <div style={{ fontSize: 13, color: colors.inkSoft, marginBottom: 8 }}>
            Numbers for <strong style={{ color: colors.ink }}>{scope}</strong>
          </div>
          {/* flex 1 gives the tiles the leftover height. The tiles
              center inside it instead of stretching. */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <StatCards filters={filters} />
          </div>
        </div>
      </div>
    </div>
  );
}