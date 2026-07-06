// src/App.tsx
// The shell: header, region filter, and tab switcher. It owns two
// pieces of state — the active tab and the chosen region — and passes
// the region down so every tab re-queries when it changes.

import { useEffect, useState } from 'react';
import { getRegions } from './lib/queries';
import { colors } from './constants/theme';
import OverviewTab from './components/OverviewTab';
import StrandsTab from './components/StrandsTab';
import RegionsTab from './components/RegionsTab';

type Tab = 'overview' | 'strands' | 'regions';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'strands', label: 'Strands' },
  { id: 'regions', label: 'Regions' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('overview');
  const [region, setRegion] = useState<string | null>(null);
  const [regions, setRegions] = useState<string[]>([]);

  useEffect(() => {
    getRegions().then(setRegions).catch(() => setRegions([]));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'system-ui, sans-serif', color: colors.ink }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 32, background: colors.yellow, borderRadius: 2 }} />
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Aralite</h1>
            <p style={{ color: colors.inkSoft, margin: 0, fontSize: 14 }}>
              DepEd enrollment · SY 2023–2024 · in-browser SQL analytics
            </p>
          </div>
        </div>

        {/* Region filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '1.5rem 0' }}>
          <label style={{ fontSize: 14, color: colors.inkSoft }}>Region</label>
          <select
            value={region ?? ''}
            onChange={(e) => setRegion(e.target.value || null)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${colors.line}`,
              background: colors.surface,
              fontSize: 14,
            }}
          >
            <option value="">All regions (nationwide)</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {region && (
            <button
              onClick={() => setRegion(null)}
              style={{
                padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${colors.line}`, background: colors.surface, fontSize: 14,
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${colors.line}`, marginBottom: 24 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 15,
                fontWeight: tab === t.id ? 600 : 400,
                color: tab === t.id ? colors.blue : colors.inkSoft,
                borderBottom: tab === t.id ? `2px solid ${colors.blue}` : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Active tab */}
        {tab === 'overview' && <OverviewTab region={region} />}
        {tab === 'strands' && <StrandsTab region={region} />}
        {tab === 'regions' && (
          <RegionsTab region={region} onPick={(r) => { setRegion(r); setTab('overview'); }} />
        )}
      </div>
    </div>
  );
}