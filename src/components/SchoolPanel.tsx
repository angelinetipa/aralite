// src/components/SchoolPanel.tsx
// The schools inside whatever the FilterBar currently selects.
//
// This was FinderSection, which carried its own five dropdowns and its
// own filter state — a second filter that silently disagreed with the
// dashboard's. All of that is gone. It receives filters as a prop, so it
// can only ever show the same scope as the charts.
//
// The name/ID search it used to accept is gone too. The heading now
// states the real number of schools in scope and how many of them are
// drawn, because the old "50+" gave the reader no way to tell whether
// narrowing further would help.
//
// Renders nothing until a filter is set, so it stays out of the way of
// the finding until a visitor actually goes looking.

import { useEffect, useState } from 'react';
import {
  getSchools, getSchoolProfile, SCHOOLS_SHOWN,
  type SchoolHit, type SchoolProfile,
} from '../lib/queries';
import { type Filters, scopeLabel } from '../lib/filters';
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

export default function SchoolPanel({ filters }: { filters: Filters }) {
  const [hits, setHits] = useState<SchoolHit[]>([]);
  const [total, setTotal] = useState(0);
  const [profile, setProfile] = useState<SchoolProfile | null>(null);

  useEffect(() => {
    if (!Object.values(filters).some(Boolean)) { setHits([]); setTotal(0); return; }
    getSchools(filters)
      .then((r) => { setHits(r.hits); setTotal(r.total); })
      .catch(() => { setHits([]); setTotal(0); });
  }, [filters]);

  // Only appears once the visitor has actually narrowed to something.
  if (hits.length === 0) return null;

  const capped = total > SCHOOLS_SHOWN;
  const scope = scopeLabel(filters);

  return (
    <Card
      title={
        capped
          ? `The ${SCHOOLS_SHOWN} largest schools in ${scope}`
          : `${total} school${total === 1 ? '' : 's'} in ${scope}`
      }
      accent={colors.blue}
      subtitle={
        capped
          ? `${scope} has ${total.toLocaleString()} schools in total. Narrow to a province, division, municipality, or barangay to see the rest.`
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