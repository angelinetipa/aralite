// src/components/SchoolPanel.tsx
// The schools inside whatever the FilterBar currently selects.
//
// This was FinderSection, which carried its own five dropdowns and its
// own filter state, a second filter that could silently disagree with
// the dashboard's. It now receives filters as a prop, so it can only
// ever show the same scope as the rest of the page.
//
// The heading states the real number of schools in scope and how many
// are drawn, so the reader can tell whether narrowing further will help.
//
// Before a filter is set the card stays in place with a short note, so
// the grid row keeps its shape. The list scrolls inside the card and
// never makes the row taller than its neighbor.
//
// Color. Everything here is neutral. Male and female are plain numbers
// with no color, because red is reserved for "worse than national".

import { useEffect, useState } from 'react';
import {
  getSchools, getSchoolProfile, SCHOOLS_SHOWN,
  type SchoolHit, type SchoolProfile,
} from '../lib/queries';
import { type Filters, scopeLabel } from '../lib/filters';
import { colors, clay } from '../constants/theme';
import { Card, ChartBox } from './ui';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, minWidth: 90 }}>
      <div style={{ fontSize: 12, color: colors.inkSoft }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: colors.ink }}>{value}</div>
    </div>
  );
}

// A short centered note, used before a filter is set and while loading.
function Note({ text }: { text: string }) {
  return (
    <div
      style={{
        height: '100%', minHeight: 120, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: colors.inkSoft, fontSize: 14, textAlign: 'center',
      }}
    >
      {text}
    </div>
  );
}

export default function SchoolPanel({ filters }: { filters: Filters }) {
  const [hits, setHits] = useState<SchoolHit[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [profile, setProfile] = useState<SchoolProfile | null>(null);

  const picked = Object.values(filters).some(Boolean);

  useEffect(() => {
    if (!picked) { setHits([]); setTotal(0); setStatus('idle'); return; }
    setStatus('loading');
    getSchools(filters)
      .then((r) => { setHits(r.hits); setTotal(r.total); setStatus('ready'); })
      .catch(() => { setHits([]); setTotal(0); setStatus('ready'); });
  }, [filters, picked]);

  // Nothing picked, or still loading, or nothing found.
  if (!picked || status !== 'ready' || hits.length === 0) {
    const text = !picked ? 'Pick a region to see its largest schools here.'
      : status !== 'ready' ? 'Loading schools…'
        : 'No schools found in this area.';
    return (
      <Card title="Schools in your area" subtitle="Click any school to see its enrollment profile.">
        <Note text={text} />
      </Card>
    );
  }

  const capped = total > SCHOOLS_SHOWN;
  const scope = scopeLabel(filters);

  return (
    <Card
      title={
        capped
          ? `The ${SCHOOLS_SHOWN} largest schools in ${scope}`
          : `${total} school${total === 1 ? '' : 's'} in ${scope}`
      }
      subtitle={
        capped
          ? `${scope} has ${total.toLocaleString()} schools in total. Narrow the filter to see the rest.`
          : 'Click any school to see its full enrollment profile.'
      }
    >
      {/* The list scrolls inside the card. */}
      <ChartBox min={220}>
        <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
          {hits.map((h) => (
            <button
              key={h.id}
              onClick={() => getSchoolProfile(h.id).then(setProfile).catch(() => { })}
              style={{
                ...clay.card, textAlign: 'left', cursor: 'pointer', border: 'none',
                padding: '10px 14px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: 12, flexShrink: 0,
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
      </ChartBox>

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