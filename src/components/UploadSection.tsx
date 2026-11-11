// src/components/UploadSection.tsx
// Upload your own dataset (CSV or Excel), clean it in the browser (rules
// in src/lib/cleaning.ts), see a report, download the clean copy, and
// when it is DepEd format, load it straight into the dashboard.
// Nothing leaves the user's computer. There is no server.
//
// Layout. One bento row. The upload card sits on the left (5 columns)
// and the cleaning report sits on the right (7 columns) as a set of
// tiles. The report stays visible after the file is published.

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { cleanTable, looksLikeDepEd, toCSV, type CleanReport } from '../lib/cleaning';
import { loadUploadedData } from '../lib/db';
import { colors } from '../constants/theme';
import { Card } from './ui';
import Button from './Button';

// Some files (like the DepEd export) have title rows before the real
// header. This finds the row with real column names, the browser version
// of pandas' header=4.
function findHeaderRow(sheet: XLSX.WorkSheet): number {
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  for (let i = 0; i < Math.min(grid.length, 10); i++) {
    const cells = (grid[i] as unknown[]).map((c) => String(c).trim());
    if (cells.includes('Region') || cells.includes('BEIS School ID')) return i;
  }
  return 0;
}

type DoneState = {
  step: 'done';
  name: string;
  report: CleanReport;
  csv: string;
  isDepEd: boolean;
  enrollmentCols: string[];
};

type State =
  | { step: 'idle' }
  | { step: 'working' }
  | { step: 'error'; message: string }
  | DoneState
  | { step: 'loaded'; name: string; report: CleanReport };

// One tile per repair count. Same look as the stat tiles on the dashboard.
function ReportTile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div
      style={{
        padding: '0.5rem 0.6rem',
        textAlign: 'center',
        borderRadius: 14,
        background: '#F9F7F1',
        border: `1px solid ${colors.line}`,
      }}
    >
      <div style={{ fontSize: 12, color: colors.inkSoft, lineHeight: 1.35 }}>{label}</div>
      <div
        className="aralite-display"
        style={{ fontSize: 22, fontWeight: 800, color: colors.ink, marginTop: 3 }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 2 }}>{note}</div>
    </div>
  );
}

function reportTiles(r: CleanReport) {
  return [
    { label: 'Rows kept', value: r.rows.toLocaleString(), note: 'none deleted' },
    { label: 'Columns', value: String(r.cols), note: 'in the cleaned file' },
    { label: 'Encoding repairs', value: String(r.mojibakeFixed), note: 'broken letters fixed' },
    { label: 'Junk stripped', value: String(r.junkStripped), note: 'leading symbols removed' },
    { label: 'Whitespace fixes', value: String(r.whitespaceFixed), note: 'extra spaces removed' },
    { label: 'Invalid values', value: String(r.invalidLabeled), note: 'labeled Not Provided' },
    { label: 'School names', value: String(r.namesStandardized), note: 'standardized in a new column' },
  ];
}

export default function UploadSection({
  onDataLoaded,
  liveLabel = 'Load into dashboard',
}: {
  onDataLoaded: (name: string) => void;
  liveLabel?: string;
}) {
  const [state, setState] = useState<State>({ step: 'idle' });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setState({ step: 'working' });
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const header = findHeaderRow(sheet);
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
        range: header,
      });

      if (rows.length === 0) {
        setState({ step: 'error', message: 'The file has no data rows.' });
        return;
      }

      const { cleaned, report } = cleanTable(rows);
      // Enrollment columns are the ones ending in " Male" or " Female".
      const enrollmentCols = Object.keys(cleaned[0]).filter(
        (c) => / (Male|Female)$/.test(c)
      );
      setState({
        step: 'done',
        name: file.name,
        report,
        csv: toCSV(cleaned),
        isDepEd: looksLikeDepEd(cleaned),
        enrollmentCols,
      });
    } catch (e) {
      console.error('Reading the uploaded file failed', e);
      setState({ step: 'error', message: 'Could not read that file. Use .csv or .xlsx.' });
    }
  }

  async function loadIntoDashboard(done: DoneState) {
    setLoading(true);
    try {
      await loadUploadedData(done.csv, done.enrollmentCols);
      onDataLoaded(done.name);
      setState({ step: 'loaded', name: done.name, report: done.report });
    } catch (e) {
      console.error('loadUploadedData failed', e);
      setState({ step: 'error', message: 'Could not load this file into the dashboard.' });
    } finally {
      setLoading(false);
    }
  }

  function download(csv: string, sourceName: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = sourceName.replace(/\.(csv|xlsx?)$/i, '') + '_cleaned.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const report = state.step === 'done' || state.step === 'loaded' ? state.report : null;
  const fileName = state.step === 'done' || state.step === 'loaded' ? state.name : '';

  return (
    <div className="aralite-bento">
      {/* Left. Upload, clean and publish. */}
      <div className="bento-5 bento-fill">
        <Card
          title="Clean your own dataset"
          subtitle="Upload a CSV or Excel file. It is cleaned right in your browser and never leaves your computer."
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />

          {state.step === 'idle' && (
            <Button onClick={() => inputRef.current?.click()}>Choose file (.csv or .xlsx)</Button>
          )}

          {state.step === 'working' && <p style={{ color: colors.inkSoft, margin: 0 }}>Cleaning…</p>}

          {state.step === 'error' && (
            <div>
              <p style={{ color: colors.red, margin: '0 0 10px' }}>{state.message}</p>
              <Button variant="outline" onClick={() => setState({ step: 'idle' })}>Try again</Button>
            </div>
          )}

          {state.step === 'loaded' && (
            <div>
              <p style={{ color: colors.blue, fontWeight: 600, margin: '0 0 10px' }}>
                ✓ Dashboard now showing {state.name}
              </p>
              <Button variant="outline" onClick={() => setState({ step: 'idle' })}>
                Upload another
              </Button>
            </div>
          )}

          {state.step === 'done' && (
            <div>
              <p style={{ fontSize: 14, margin: '0 0 10px', color: colors.ink }}>
                <strong>{state.name}</strong> is cleaned. The report is on the right.
              </p>

              {!state.isDepEd && (
                <p style={{ fontSize: 13, color: colors.red, margin: '0 0 12px' }}>
                  ⚠ This file doesn&rsquo;t match the DepEd enrollment format, so it can&rsquo;t
                  feed the dashboard charts. You can still download the cleaned copy.
                </p>
              )}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {state.isDepEd && (
                  <Button disabled={loading} onClick={() => loadIntoDashboard(state)}>
                    {loading ? 'Loading…' : liveLabel}
                  </Button>
                )}
                <Button variant="outline" onClick={() => download(state.csv, state.name)}>
                  Download cleaned CSV
                </Button>
                <Button variant="outline" onClick={() => setState({ step: 'idle' })}>
                  Clean another file
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Right. What the cleaning changed. */}
      <div className="bento-7 bento-fill">
        <Card
          title="Cleaning report"
          subtitle={report ? fileName : 'Choose a file to see what was repaired.'}
        >
          {report ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 8,
                alignContent: 'start',
              }}
            >
              {reportTiles(report).map((t) => (
                <ReportTile key={t.label} label={t.label} value={t.value} note={t.note} />
              ))}
            </div>
          ) : (
            <p style={{ color: colors.inkSoft, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              The cleaning only repairs values. It never deletes a row or a column, and
              the report shows the counts so you can check.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}