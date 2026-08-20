// src/components/SchoolPanel.tsx
// School results for whatever the single FilterBar currently selects.
//
// This was FinderSection, which carried its own five dropdowns and its
// own filter state — a second filter that silently disagreed with the
// dashboard's. All of that is gone. It now receives filters and search
// text as props, so it can only ever show the same scope as the charts.
//
// Renders nothing until there is something to show, so it stays out of
// the way of the finding until a visitor actually looks for a school.

import { useEffect, useState } from 'react';
import {
  searchSchools, getSchoolProfile, type SchoolHit, type SchoolProfile,
} from '../lib/queries';
import { type Filters } from '../lib/filters';
import { colors, clay } from '../constants/theme';
import { Card } from './ui';

function Metric({ label, value, c }: { label: string; value: string; c: string }) {
  return (
    <div style={{ flex: 1, minWidth: 90 }}>
      <div style={{ fontSize: 12, color: colors.inkSoft }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{value}</div>
    </div>
  );
}

export default function SchoolPanel({
  filters, search,
}: { filters: Filters; search: string }) {
  const [hits, setHits] = useState<SchoolHit[]>([]);
  const [profile, setProfile] = useState<SchoolProfile | null>(null);

  useEffect(() => {
    const hasAny = search.trim() || Object.values(filters).some(Boolean);
    if (!hasAny) { setHits([]); return; }
    searchSchools(filters, search).then(setHits).catch(() => setHits([]));
  }, [filters, search]);

  // Only appears once the visitor has actually narrowed to something.
  if (hits.length === 0) return null;

  return (
    <Card
      title={`${hits.length}${hits.length === 50 ? '+' : ''} school${hits.length === 1 ? '' : 's'} match your filters`}
      accent={colors.blue}
      subtitle={
        hits.length === 50
          ? 'Showing the first 50 — narrow the filters above to see fewer.'
          : 'Click any school to see its full enrollment profile.'
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
        {hits.map((h) => (
          <button
            key={h.id}
            onClick={() => getSchoolProfile(h.id).then(setProfile).catch(() => { })}
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
              <button
                onClick={() => setProfile(null)}
                style={{ cursor: 'pointer', border: 'none', background: 'none', fontSize: 22 }}
              >
                ×
              </button>
            </div>

            <p style={{ color: colors.inkSoft, fontSize: 13, margin: '4px 0 16px' }}>
              {profile.info['Barangay']}, {profile.info['Municipality']}, {profile.info['Province']}
              {' · '}{profile.info['Sector']} · {profile.info['School Type']}
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