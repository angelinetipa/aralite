// src/components/FilterBar.tsx
// The single control for the whole dashboard.
//
// Five cascading location dropdowns plus a school search, in one bar.
// The search used to live in a separate Finder with its OWN copy of the
// five dropdowns and its own filter state — so the page had two filters
// that did not know about each other. One control now drives everything:
// the charts, the story, and the school list below.
//
// Picking a level clears every narrower level under it.

import { useEffect, useState } from 'react';
import { getLevelOptions } from '../lib/queries';
import { type Filters, LEVELS, type Level } from '../lib/filters';
import { colors } from '../constants/theme';

const LABEL: Record<Level, string> = {
  region: 'Region', province: 'Province', division: 'Division',
  municipality: 'Municipality', barangay: 'Barangay',
};

export default function FilterBar({
  filters, onChange, search, onSearch,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  search: string;
  onSearch: (s: string) => void;
}) {
  const [options, setOptions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    LEVELS.forEach((lvl) => {
      getLevelOptions(lvl, filters)
        .then((opts) => setOptions((o) => ({ ...o, [lvl]: opts })))
        .catch(() => { });
    });
  }, [filters]);

  function pick(level: Level, value: string) {
    const idx = LEVELS.indexOf(level);
    const next: Filters = { ...filters, [level]: value || undefined };
    LEVELS.slice(idx + 1).forEach((l) => { delete next[l]; });
    onChange(next);
  }

  const anyActive = LEVELS.some((l) => filters[l]) || search.trim().length > 0;

  return (
    <div style={{
      background: '#FFFFFF', padding: '1rem 1.2rem', borderRadius: 16,
      border: '1px solid rgba(0,0,0,0.05)',
      boxShadow: '0 6px 16px rgba(31,29,26,0.06)',
      marginBottom: 20,
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 10, alignItems: 'end',
      }}>
        {LEVELS.map((lvl) => (
          <div key={lvl}>
            <label style={{ fontSize: 12, color: colors.inkSoft, display: 'block', marginBottom: 4 }}>
              {LABEL[lvl]}
            </label>
            <select
              value={filters[lvl] ?? ''}
              onChange={(e) => pick(lvl, e.target.value)}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 10, fontSize: 14,
                border: '1px solid rgba(0,0,0,0.12)', background: '#fff',
              }}
            >
              <option value="">All</option>
              {(options[lvl] ?? []).map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Search sits inside the same bar, narrowed by the dropdowns above
          it — not a second filter competing with them. */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'end',
        marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.line}`,
      }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, color: colors.inkSoft, display: 'block', marginBottom: 4 }}>
            Find a school
          </label>
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by school name or ID — narrowed by the filters above"
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 14,
              border: '1px solid rgba(0,0,0,0.12)', background: '#fff',
            }}
          />
        </div>

        {anyActive && (
          <button
            onClick={() => { onChange({}); onSearch(''); }}
            style={{
              padding: '9px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
              border: 'none', background: colors.blue, color: '#fff', fontWeight: 600,
              height: 38, whiteSpace: 'nowrap',
            }}
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}