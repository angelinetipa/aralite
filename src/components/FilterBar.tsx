// src/components/FilterBar.tsx
// The main control: five cascading location dropdowns that drive the
// WHOLE dashboard. Pick a region -> province options narrow -> and so
// on down to a single barangay. Picking a higher level clears the
// narrower ones below it.

import { useEffect, useState } from 'react';
import { getLevelOptions } from '../lib/queries';
import { type Filters, LEVELS, type Level } from '../lib/filters';
import { colors } from '../constants/theme';

const LABEL: Record<Level, string> = {
  region: 'Region', province: 'Province', division: 'Division',
  municipality: 'Municipality', barangay: 'Barangay',
};

export default function FilterBar({
  filters, onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const [options, setOptions] = useState<Record<string, string[]>>({});

  // Reload each dropdown's options whenever the filters change.
  useEffect(() => {
    LEVELS.forEach((lvl) => {
      getLevelOptions(lvl, filters)
        .then((opts) => setOptions((o) => ({ ...o, [lvl]: opts })))
        .catch(() => {});
    });
  }, [filters]);

  function pick(level: Level, value: string) {
    const idx = LEVELS.indexOf(level);
    const next: Filters = { ...filters, [level]: value || undefined };
    // Clear all narrower levels below the one just changed.
    LEVELS.slice(idx + 1).forEach((l) => { delete next[l]; });
    onChange(next);
  }

  const anyActive = LEVELS.some((l) => filters[l]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: 10, alignItems: 'end',
      background: '#FFFFFF', padding: '1rem 1.2rem', borderRadius: 16,
      border: '1px solid rgba(0,0,0,0.05)',
      boxShadow: '0 6px 16px rgba(31,29,26,0.06)',
      marginBottom: 24,
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

      {anyActive && (
        <button
          onClick={() => onChange({})}
          style={{
            padding: '9px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
            border: 'none', background: colors.blue, color: '#fff', fontWeight: 600,
            height: 38,
          }}
        >
          Clear all
        </button>
      )}
    </div>
  );
}