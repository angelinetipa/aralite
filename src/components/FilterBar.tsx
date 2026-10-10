// src/components/FilterBar.tsx
// The single control for the whole dashboard.
//
// Five cascading location dropdowns, shown one at a time. Only Region is
// visible at first. Choosing a region reveals Province, choosing a
// province reveals Division, and so on down to Barangay. This keeps the
// row short and shows the reader which step comes next. One control
// drives everything: the numbers, the charts and the school list.
//
// This bar has no box of its own. It sits inside the Explore panel, so
// the filter, the numbers and the charts read as one tool.
//
// A school name/ID search used to sit in this bar. It was removed, not
// repaired. It searched the raw name column and ranked by enrollment,
// so it hid schools that were in the data and taught the reader they
// were not there. See the note in queries.ts. Narrowing to a barangay
// is slower and honest. The search box was fast and wrong.
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

// The levels to show: every level down to the deepest one chosen, plus
// the next one. With nothing chosen that is just Region.
function visibleLevels(f: Filters): readonly Level[] {
  const deepest = LEVELS.reduce((d, l, i) => (f[l] ? i : d), -1);
  return LEVELS.slice(0, Math.min(deepest + 2, LEVELS.length));
}

export default function FilterBar({
  filters, onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const [options, setOptions] = useState<Record<string, string[]>>({});

  // Only the visible levels are queried, so a hidden level costs nothing.
  useEffect(() => {
    visibleLevels(filters).forEach((lvl) => {
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

  const levels = visibleLevels(filters);
  const anyActive = LEVELS.some((l) => filters[l]);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
      {levels.map((lvl) => (
        <div key={lvl} style={{ flex: '0 1 220px', minWidth: 150 }}>
          <label
            htmlFor={`filter-${lvl}`}
            style={{ fontSize: 12, color: colors.inkSoft, display: 'block', marginBottom: 4 }}
          >
            {LABEL[lvl]}
          </label>
          <select
            id={`filter-${lvl}`}
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

      {/* A hint only while nothing is chosen. After the first pick the
          next dropdown appears, which explains itself. */}
      {!anyActive && (
        <span style={{ fontSize: 13, color: colors.inkSoft, paddingBottom: 9 }}>
          Pick a region and more choices appear.
        </span>
      )}

      {anyActive && (
        <button
          onClick={() => onChange({})}
          style={{
            marginLeft: 'auto', padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
            fontSize: 13, border: 'none', background: colors.blue, color: '#fff',
            fontWeight: 600, whiteSpace: 'nowrap',
          }}
        >
          Clear all
        </button>
      )}
    </div>
  );
}