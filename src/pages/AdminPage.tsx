// src/pages/AdminPage.tsx
// Data management (admin). Manage the WHOLE live dataset:
//   - Replace: upload + clean a new file, then publish it live
//   - Remove:  clear the live dataset back to the default DepEd data
// Both destructive actions ask for confirmation first. No login yet.

import { useState } from 'react';
import { resetToDefault } from '../lib/queries';
import { colors, clay } from '../constants/theme';
import NavHeader from '../components/NavHeader';
import UploadSection from '../components/UploadSection';

export default function AdminPage() {
  const [live, setLive] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function removeLive() {
    await resetToDefault();
    setLive(null);
    setConfirming(false);
  }

  const usingCustom = live !== null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 2rem', color: colors.ink }}>
      <NavHeader />

      <div style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Dataset Management</h2>
        <p style={{ color: colors.inkSoft, fontSize: 14, margin: '0 0 20px' }}>
          Replace or remove the dataset shown on the public dashboard.
        </p>

        {/* Current live source + status */}
        <div style={{ ...clay.card, padding: '1.1rem 1.4rem', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: colors.inkSoft }}>Currently live on dashboard</div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, marginTop: 6, flexWrap: 'wrap',
          }}>
            <div>
              <strong style={{ fontSize: 17 }}>
                {live ?? 'Default DepEd dataset (SY 2023–2024)'}
              </strong>
              <span style={{
                marginLeft: 10, fontSize: 12, fontWeight: 700, padding: '2px 8px',
                borderRadius: 20, color: usingCustom ? colors.red : colors.blue,
                background: usingCustom ? '#FBE6E9' : '#EAF0FB',
              }}>
                {usingCustom ? 'CUSTOM' : 'DEFAULT'}
              </span>
            </div>

            {/* Remove is only meaningful when custom data is live */}
            {usingCustom && !confirming && (
              <button
                onClick={() => setConfirming(true)}
                style={{
                  padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
                  border: `1px solid ${colors.red}`, background: '#fff',
                  color: colors.red, fontWeight: 600,
                }}
              >
                Remove live dataset
              </button>
            )}
          </div>

          {/* Confirm step so removal never happens by accident */}
          {confirming && (
            <div style={{
              marginTop: 14, padding: '12px 14px', borderRadius: 10,
              background: '#FBE6E9', border: `1px solid ${colors.red}`,
            }}>
              <p style={{ margin: '0 0 10px', fontSize: 14, color: colors.ink }}>
                Remove the custom dataset and restore the default DepEd data?
                The dashboard will switch back immediately.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={removeLive}
                  style={{
                    padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
                    border: 'none', background: colors.red, color: '#fff', fontWeight: 600,
                  }}
                >
                  Yes, remove it
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  style={{
                    padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
                    border: '1px solid rgba(0,0,0,0.15)', background: '#fff',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Replace: upload -> clean -> publish */}
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>
          {usingCustom ? 'Replace live dataset' : 'Publish a dataset'}
        </h3>
        <UploadSection
          onDataLoaded={(name) => { setLive(name); setConfirming(false); }}
          liveLabel={usingCustom ? 'Replace live dataset' : 'Publish to dashboard'}
        />
      </div>
    </div>
  );
}