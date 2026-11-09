// src/components/SchoolPanel.tsx
// Lists the schools inside the area picked in the filter bar.
// The panel has four states: loading, error, empty and ready.
// A request that finishes after the filter has changed is ignored.

import { useEffect, useState } from 'react';
import {
  getSchools, getSchoolProfile, SCHOOLS_SHOWN,
  type SchoolHit, type SchoolProfile,
} from '../lib/queries';
import { type Filters, scopeLabel } from '../lib/filters';
import { colors, clay } from '../constants/theme';
import { Card } from './ui';

type Status = 'idle' | 'loading' | 'error' | 'ready';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, minWidth: 90 }}>
      <div style={{ fontSize: 12, color: colors.inkSoft }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: colors.ink }}>{value}</div>
    </div>
  );
}

export default function SchoolPanel({ filters }: { filters: Filters }) {
  const [hits, setHits] = useState<SchoolHit[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [profile, setProfile] = useState<SchoolProfile | null>(null);

  useEffect(() => {
    if (!Object.values(filters).some(Boolean)) {
      setHits([]);
      setTotal(0);
      setStatus('idle');
      return;
    }

    // The cleanup flips this flag, so an older request cannot
    // overwrite the result of a newer one.
    let current = true;
    setStatus('loading');

    getSchools(filters)
      .then((r) => {
        if (!current) return;
        setHits(r.hits);
        setTotal(r.total);
        setStatus('ready');
      })
      .catch((e) => {
        if (!current) return;
        console.error('getSchools failed for filters', filters, e);
        setHits([]);
        setTotal(0);
        setStatus('error');
      });

    return () => { current = false; };
  }, [filters]);

  // Nothing is picked yet, so the panel stays out of the way.
  if (status === 'idle') return null;

  const scope = scopeLabel(filters);
  const capped = total > SCHOOLS_SHOWN;

  const title =
    status === 'ready' && total > 0
      ? capped
        ? `The ${SCHOOLS_SHOWN} largest schools in ${scope}`
        : `${total} school${total === 1 ? '' : 's'} in ${scope}`
      : `Schools in ${scope}`;

  const subtitle =
    status === 'ready' && capped
      ? `${scope} has ${total.toLocaleString()} schools in total. Narrow to a province, division, municipality, or barangay to see the rest.`
      : 'Click any school to see its full enrollment profile.';

  function openProfile(id: string) {
    getSchoolProfile(id)
      .then(setProfile)
      .catch((e) => console.error('getSchoolProfile failed for', id, e));
  }

  const message = (text: string, color: string = colors.inkSoft) => (
    <p style={{ color, fontSize: 14, textAlign: 'center', padding: '24px 0', margin: 0 }}>
      {text}
    </p>
  );

  return (
    <Card title={title} subtitle={subtitle}>
      {status === 'loading' && message('Loading schools…')}
      {status === 'error' &&
        message('Could not load the schools. Try another area or reload the page.', colors.red)}
      {status === 'ready' && hits.length === 0 && message('No schools found in this area.')}

      {status === 'ready' && hits.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
          {hits.map((h) => (
            <button
              key={h.id}
              onClick={() => openProfile(h.id)}
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
              <span style={{ fontWeight: 700, color: colors.ink, whiteSpace: 'nowrap' }}>
                {h.total.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      )}

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
                aria-label="Close"
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
              <Metric label="Total" value={profile.total.toLocaleString()} />
              <Metric label="Male" value={profile.male.toLocaleString()} />
              <Metric label="Female" value={profile.female.toLocaleString()} />
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Enrollment by grade</div>
            {profile.byGrade.map((g) => {
              const max = Math.max(...profile.byGrade.map((x) => x.total));
              return (
                <div key={g.grade} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ width: 44, fontSize: 12, color: colors.inkSoft }}>{g.grade}</span>
                  <div style={{ flex: 1, background: colors.line, borderRadius: 4, height: 16 }}>
                    <div style={{ width: `${(g.total / max) * 100}%`, background: colors.grayDark, height: '100%', borderRadius: 4 }} />
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