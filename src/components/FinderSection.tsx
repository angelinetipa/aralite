// src/components/FinderSection.tsx
// School Finder: search 60,000 schools by name/ID + narrow with five
// location dropdowns. Click a result to see that school's full profile.
// This is what makes Aralite a TOOL people use, not just a dashboard.

import { useEffect, useState } from 'react';
import {
  getFilterOptions, searchSchools, getSchoolProfile,
  type SchoolFilters, type SchoolHit, type SchoolProfile,
} from '../lib/queries';
import { colors, clay } from '../constants/theme';
import { Card } from './ui';

const LOCATIONS = ['Region', 'Province', 'Division', 'Municipality', 'Barangay'] as const;

export default function FinderSection() {
  const [filters, setFilters] = useState<SchoolFilters>({});
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<Record<string, string[]>>({});
  const [hits, setHits] = useState<SchoolHit[]>([]);
  const [profile, setProfile] = useState<SchoolProfile | null>(null);

  // Load each dropdown's options, narrowed by the filters above it.
  useEffect(() => {
    LOCATIONS.forEach((col) => {
      getFilterOptions(col, filters)
        .then((opts) => setOptions((o) => ({ ...o, [col]: opts })))
        .catch(() => {});
    });
  }, [filters]);

  // Run the search whenever filters or text change.
  useEffect(() => {
    const hasAny = search.trim() || Object.values(filters).some(Boolean);
    if (!hasAny) { setHits([]); return; }
    searchSchools(filters, search).then(setHits).catch(() => setHits([]));
  }, [filters, search]);

  function setFilter(col: string, value: string) {
    const key = col.toLowerCase() as keyof SchoolFilters;
    // Changing a higher-level filter clears the ones below it.
    const idx = LOCATIONS.indexOf(col as typeof LOCATIONS[number]);
    const next: SchoolFilters = { ...filters, [key]: value || undefined };
    LOCATIONS.slice(idx + 1).forEach((c) => { delete next[c.toLowerCase() as keyof SchoolFilters]; });
    setFilters(next);
  }

  const inputStyle = {
    padding: '9px 12px', borderRadius: 10, fontSize: 14,
    border: '1px solid rgba(0,0,0,0.1)', background: colors.surface, width: '100%',
  };

  return (
    <Card
      title="Find a school"
      accent={colors.blue}
      subtitle="Search any of 60,000+ schools by name or ID, or narrow by location."
    >
      {/* Search bar */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search school name or ID…"
        style={{ ...inputStyle, marginBottom: 12 }}
      />

      {/* Five location dropdowns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 10, marginBottom: 16,
      }}>
        {LOCATIONS.map((col) => {
          const key = col.toLowerCase() as keyof SchoolFilters;
          return (
            <select
              key={col}
              value={(filters[key] as string) ?? ''}
              onChange={(e) => setFilter(col, e.target.value)}
              style={inputStyle}
            >
              <option value="">{col} (all)</option>
              {(options[col] ?? []).map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          );
        })}
      </div>

      {/* Results */}
      {hits.length > 0 && (
        <div style={{ fontSize: 13, color: colors.inkSoft, marginBottom: 8 }}>
          Showing top {hits.length} {hits.length === 50 ? '(narrow to see more)' : ''}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {hits.map((h) => (
          <button
            key={h.id}
            onClick={() => getSchoolProfile(h.id).then(setProfile)}
            style={{
              ...clay.card, textAlign: 'left', cursor: 'pointer', border: 'none',
              padding: '10px 14px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', gap: 12,
            }}
          >
            <span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{h.name}</span>
              <span style={{ display: 'block', fontSize: 12, color: colors.inkSoft }}>
                {h.municipality}, {h.region} · {h.sector} · ID {h.id}
              </span>
            </span>
            <span style={{ fontWeight: 700, color: colors.blue, whiteSpace: 'nowrap' }}>
              {h.total.toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      {/* Profile modal */}
      {profile && (
        <div
          onClick={() => setProfile(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ ...clay.card, maxWidth: 520, width: '100%', maxHeight: '85vh', overflow: 'auto', padding: '1.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                {profile.info['School Name']}
              </h3>
              <button onClick={() => setProfile(null)} style={{ cursor: 'pointer', border: 'none', background: 'none', fontSize: 22 }}>×</button>
            </div>

            <p style={{ color: colors.inkSoft, fontSize: 13, margin: '4px 0 16px' }}>
              {profile.info['Barangay']}, {profile.info['Municipality']}, {profile.info['Province']} · {profile.info['Sector']} · {profile.info['School Type']}
            </p>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <Metric label="Total" value={profile.total.toLocaleString()} c={colors.blue} />
              <Metric label="Male" value={profile.male.toLocaleString()} c={colors.blue} />
              <Metric label="Female" value={profile.female.toLocaleString()} c={colors.red} />
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Enrollment by grade</div>
            {profile.byGrade.map((g) => {
              const max = Math.max(...profile.byGrade.map((x) => x.total));
              return (
                <div key={g.grade} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ width: 44, fontSize: 12, color: colors.inkSoft }}>{g.grade}</span>
                  <div style={{ flex: 1, background: colors.line, borderRadius: 4, height: 16 }}>
                    <div style={{ width: `${(g.total / max) * 100}%`, background: colors.blue, height: '100%', borderRadius: 4 }} />
                  </div>
                  <span style={{ width: 60, textAlign: 'right', fontSize: 12 }}>{g.total.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function Metric({ label, value, c }: { label: string; value: string; c: string }) {
  return (
    <div style={{ flex: 1, minWidth: 90 }}>
      <div style={{ fontSize: 12, color: colors.inkSoft }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{value}</div>
    </div>
  );
}