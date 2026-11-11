// src/components/FilterBar.tsx
// The single control for the whole dashboard.
//
// Five cascading location dropdowns, shown one at a time. Only Region is
// visible at first. Choosing a region reveals Province, choosing a
// province reveals Division, and so on down to Barangay. One control
// drives everything: the numbers, the charts and the school list.
//
// Layout. Two columns, so the bar is never taller than three rows:
//   Region        Province
//   Division      Municipality
//   Barangay
// The Clear all button lives in the Explore panel heading, not here.
//
// This bar has no box of its own. It sits inside the Explore card, so
// the filter and the numbers read as one tool.
//
// A school name or ID search was removed on purpose. It searched the raw
// name column and ranked by enrollment, so it hid schools that were in
// the data. See the note in queries.ts.
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
        .catch((e) => console.error('getLevelOptions failed for', lvl, e));
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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '8px 10px',
        alignItems: 'end',
      }}
    >
      {levels.map((lvl) => (
        <div key={lvl} style={{ minWidth: 0 }}>
          <label
            htmlFor={`filter-${lvl}`}
            style={{ fontSize: 12, color: colors.inkSoft, display: 'block', marginBottom: 3 }}
          >
            {LABEL[lvl]}
          </label>
          <select
            id={`filter-${lvl}`}
            value={filters[lvl] ?? ''}
            onChange={(e) => pick(lvl, e.target.value)}
            style={{
              width: '100%', padding: '7px 10px', borderRadius: 10, fontSize: 14,
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
        <span style={{ fontSize: 13, color: colors.inkSoft, paddingBottom: 8 }}>
          Pick a region and more choices appear.
        </span>
      )}
    </div>
  );
}