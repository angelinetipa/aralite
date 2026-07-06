// src/components/UploadSection.tsx
// Upload your own dataset (CSV or Excel) -> we clean it in the browser
// (rules live in src/lib/cleaning.ts) -> show a report -> download the
// cleaned CSV. Nothing leaves the user's computer — no server involved.
//
// "Load into dashboard" is only offered when the file matches the
// DepEd format (Part 2 wires it up); otherwise we warn instead of
// breaking the charts.

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { cleanTable, looksLikeDepEd, toCSV, type CleanReport } from '../lib/cleaning';
import { colors, clay } from '../constants/theme';
import { Card } from './ui';

// Scan the first ~10 rows for the one that looks like real headers
// (contains "Region" or "BEIS School ID"). Returns its index, or 0.
function findHeaderRow(sheet: XLSX.WorkSheet): number {
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  for (let i = 0; i < Math.min(grid.length, 10); i++) {
    const cells = (grid[i] as unknown[]).map((c) => String(c).trim());
    if (cells.includes('Region') || cells.includes('BEIS School ID')) return i;
  }
  return 0;
}

type State =
  | { step: 'idle' }
  | { step: 'working' }
  | { step: 'error'; message: string }
  | {
      step: 'done';
      name: string;
      report: CleanReport;
      csv: string;
      isDepEd: boolean;
    };

export default function UploadSection() {
  const [state, setState] = useState<State>({ step: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setState({ step: 'working' });
    try {
      // SheetJS reads both .csv and .xlsx from raw bytes.
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      // Some files (like the DepEd export) have title rows before the real
      // header. Find the row that contains real column names, then read
      // from there — the browser version of pandas' header=4.
      const header = findHeaderRow(sheet);
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
        range: header, // start at the detected header row
      });

      if (rows.length === 0) {
        setState({ step: 'error', message: 'The file has no data rows.' });
        return;
      }

      const { cleaned, report } = cleanTable(rows);
      setState({
        step: 'done',
        name: file.name,
        report,
        csv: toCSV(cleaned),
        isDepEd: looksLikeDepEd(cleaned),
      });
    } catch {
      setState({ step: 'error', message: 'Could not read that file. Use .csv or .xlsx.' });
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

  return (
    <Card
      title="Clean your own dataset"
      accent={colors.blue}
      subtitle="Upload a CSV or Excel file — it gets cleaned right in your browser and never leaves your computer."
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = ''; // allow re-uploading the same file
        }}
      />

      {state.step === 'idle' && (
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            ...clay.card, padding: '12px 20px', cursor: 'pointer',
            fontSize: 15, fontWeight: 600, color: colors.blue, border: 'none',
          }}
        >
          Choose file (.csv / .xlsx)
        </button>
      )}

      {state.step === 'working' && <p style={{ color: colors.inkSoft }}>Cleaning…</p>}

      {state.step === 'error' && (
        <div>
          <p style={{ color: colors.red }}>{state.message}</p>
          <button onClick={() => setState({ step: 'idle' })} style={{ cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      )}

      {state.step === 'done' && (
        <div>
          {/* The cleaning report — proof, not "trust me" */}
          <table style={{ fontSize: 14, borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['File', state.name],
                ['Rows kept', state.report.rows.toLocaleString() + ' (none deleted)'],
                ['Columns', String(state.report.cols)],
                ['Encoding repairs (Ã‘ → Ñ)', String(state.report.mojibakeFixed)],
                ['Whitespace fixes', String(state.report.whitespaceFixed)],
                ['Empty cells labeled', String(state.report.emptiesFilled)],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ padding: '4px 16px 4px 0', color: colors.inkSoft }}>{k}</td>
                  <td style={{ padding: '4px 0', fontWeight: 600 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!state.isDepEd && (
            <p style={{ fontSize: 13, color: colors.red, marginTop: 12 }}>
              ⚠ This file doesn't match the DepEd enrollment format, so it can't
              feed the dashboard charts — but you can still download the cleaned copy.
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <button
              onClick={() => download(state.csv, state.name)}
              style={{
                padding: '10px 18px', borderRadius: 12, cursor: 'pointer', border: 'none',
                background: colors.blue, color: '#fff', fontSize: 14, fontWeight: 600,
                boxShadow: '0 6px 14px rgba(0,56,168,0.35)',
              }}
            >
              Download cleaned CSV
            </button>
            <button
              onClick={() => setState({ step: 'idle' })}
              style={{
                padding: '10px 18px', borderRadius: 12, cursor: 'pointer',
                border: '1px solid rgba(0,0,0,0.1)', background: colors.surface, fontSize: 14,
              }}
            >
              Clean another file
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}