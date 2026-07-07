// src/pages/AdminPage.tsx
// Data management (admin). v1: upload a dataset, clean it in the
// browser, download the clean copy, and push it "to live" so the
// public dashboard shows it. No login yet (planned later).

import { useState } from 'react';
import { resetToDefault } from '../lib/queries';
import { colors, clay } from '../constants/theme';
import NavHeader from '../components/NavHeader';
import UploadSection from '../components/UploadSection';

export default function AdminPage() {
  const [live, setLive] = useState<string | null>(null);

  async function handleReset() {
    await resetToDefault();
    setLive(null);
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 2rem', color: colors.ink }}>
      <NavHeader />

      <div style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Dataset Management</h2>
        <p style={{ color: colors.inkSoft, fontSize: 14, margin: '0 0 20px' }}>
          Upload, clean, and publish enrollment data. Changes here update what
          the public dashboard shows.
        </p>

        {/* Current live source */}
        <div style={{ ...clay.card, padding: '1rem 1.3rem', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: colors.inkSoft }}>Currently live on dashboard</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4 }}>
            <strong style={{ fontSize: 16 }}>
              {live ?? 'Default DepEd dataset (SY 2023–2024)'}
            </strong>
            {live && (
              <button
                onClick={handleReset}
                style={{
                  padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
                  border: 'none', background: colors.blue, color: '#fff', fontWeight: 600,
                }}
              >
                Restore default
              </button>
            )}
          </div>
        </div>

        {/* Upload + clean + load-to-live */}
        <UploadSection onDataLoaded={(name) => setLive(name)} liveLabel="Publish to dashboard" />
      </div>
    </div>
  );
}