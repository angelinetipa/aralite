// src/pages/AdminPage.tsx
// Data management (admin). Manage the WHOLE live dataset:
//   - Replace: upload and clean a new file, then publish it live
//   - Remove:  clear the live dataset back to the default DepEd data
// Removing asks for confirmation first. No login yet.
//
// Layout. Same bento grid as the dashboard.
//   row one   status card (7 columns) and the remove action (5 columns)
//   row two   upload card (5 columns) and the cleaning report (7 columns)

import { useState } from 'react';
import { resetToDefault } from '../lib/queries';
import { getLiveDataset, setLiveDataset } from '../lib/liveDataset';
import { colors } from '../constants/theme';
import NavHeader from '../components/NavHeader';
import UploadSection from '../components/UploadSection';
import Button from '../components/Button';
import { Card } from '../components/ui';

export default function AdminPage() {
  // Seed from the shared module so the status survives leaving this page
  // and coming back. useState alone forgot it every time.
  const [live, setLive] = useState<string | null>(() => getLiveDataset());
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');

  async function removeLive() {
    setRemoving(true);
    setError('');
    try {
      await resetToDefault();
      setLiveDataset(null);
      setLive(null);
      setConfirming(false);
    } catch (e) {
      console.error('resetToDefault failed', e);
      setError(e instanceof Error ? e.message : 'Could not restore the default dataset.');
    } finally {
      setRemoving(false);
    }
  }

  function publish(name: string) {
    setLiveDataset(name);
    setLive(name);
    setConfirming(false);
  }

  const usingCustom = live !== null;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem 1.5rem', color: colors.ink }}>
      <NavHeader />

      <div style={{ marginTop: '1rem' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Dataset Management</h2>
        <p style={{ color: colors.inkSoft, fontSize: 14, margin: '0 0 14px' }}>
          Replace or remove the dataset shown on the public dashboard.
        </p>

        {/* Row one. Status and the remove action. */}
        <div className="aralite-bento">
          <div className="bento-7 bento-fill">
            <Card eyebrow="Status" title="Currently live on dashboard">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 17 }}>
                  {live ?? 'Default DepEd dataset (SY 2023–2024)'}
                </strong>
                <span
                  style={{
                    fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    color: usingCustom ? colors.red : colors.blue,
                    background: usingCustom ? '#FBE6E9' : '#EAF0FB',
                  }}
                >
                  {usingCustom ? 'CUSTOM' : 'DEFAULT'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: colors.inkSoft, margin: '10px 0 0', lineHeight: 1.6 }}>
                {usingCustom
                  ? 'This dataset lives in your browser\u2019s memory only. Refreshing the page returns the dashboard to the default DepEd data.'
                  : 'The dashboard shows the DepEd data that ships with the app.'}
              </p>
            </Card>
          </div>

          <div className="bento-5 bento-fill">
            <Card
              eyebrow="Action"
              title="Remove live dataset"
              subtitle="Go back to the default DepEd data."
            >
              {!confirming && (
                <Button
                  variant="outlineDanger"
                  disabled={!usingCustom}
                  onClick={() => setConfirming(true)}
                >
                  Remove live dataset
                </Button>
              )}

              {!usingCustom && !confirming && (
                <p style={{ fontSize: 13, color: colors.inkSoft, margin: '10px 0 0' }}>
                  Nothing to remove. The default data is live.
                </p>
              )}

              {confirming && (
                <div
                  style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: '#FBE6E9', border: `1px solid ${colors.red}`,
                  }}
                >
                  <p style={{ margin: '0 0 10px', fontSize: 14, color: colors.ink }}>
                    Remove the custom dataset and restore the default DepEd data?
                    The dashboard switches back right away.
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Button variant="danger" disabled={removing} onClick={removeLive}>
                      {removing ? 'Removing…' : 'Yes, remove it'}
                    </Button>
                    <Button variant="outline" onClick={() => setConfirming(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <p style={{ margin: '10px 0 0', fontSize: 13, color: colors.red }}>{error}</p>
              )}
            </Card>
          </div>
        </div>

        {/* Row two. Upload, clean and publish. */}
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '4px 0 8px' }}>
          {usingCustom ? 'Replace live dataset' : 'Publish a dataset'}
        </h3>
        <UploadSection
          onDataLoaded={publish}
          liveLabel={usingCustom ? 'Replace live dataset' : 'Publish to dashboard'}
        />
      </div>
    </div>
  );
}