// src/App.tsx
// Step 2 proof: one SQL query -> one chart. This renders the hero
// "drop-off story" — total learners per grade, showing where the
// system loses students (the G6 -> G7 dip).
//
// Once this works, we build real pages on top. For now it's the
// smallest thing that proves the whole pipeline is wired end to end.

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { query } from './lib/db';
import { colors, GRADE_ORDER } from './constants/theme';

type GradeRow = { grade: string; total: number };

export default function App() {
  const [data, setData] = useState<GradeRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    // Sum enrollment per grade. BIGINT from DuckDB comes back as a
    // JS BigInt, so we cast to a normal number for Recharts.
    query<{ grade: string; total: bigint }>(`
      SELECT grade, SUM(enrollment) AS total
      FROM enrollment
      GROUP BY grade
    `)
      .then((rows) => {
        const ordered: GradeRow[] = [];
        for (const g of GRADE_ORDER) {
          const found = rows.find((r) => r.grade === g);
          if (found) ordered.push({ grade: g, total: Number(found.total) });
        }
        setData(ordered);
        setStatus('ready');
      })
      .catch((err) => {
        console.error(err);
        setStatus('error');
      });
  }, []);

  const total = data.reduce((sum, r) => sum + r.total, 0);

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'system-ui, sans-serif', color: colors.ink }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>Aralite</h1>
      <p style={{ color: colors.inkSoft, marginTop: 4 }}>
        DepEd enrollment, SY 2023–2024 · powered by DuckDB in your browser
      </p>

      {status === 'loading' && <p>Loading data…</p>}
      {status === 'error' && <p style={{ color: colors.red }}>Could not load data. Check the parquet files in /public/data.</p>}

      {status === 'ready' && (
        <>
          <div style={{ margin: '1.5rem 0' }}>
            <div style={{ fontSize: 13, color: colors.inkSoft }}>Total learners nationwide</div>
            <div style={{ fontSize: 40, fontWeight: 700, color: colors.blue }}>
              {total.toLocaleString()}
            </div>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Where enrollment drops off</h2>
          <p style={{ color: colors.inkSoft, marginTop: 0, fontSize: 14 }}>
            Notice the dip from Grade 6 to Grade 7 — students lost at the
            elementary-to-junior-high transition.
          </p>

          <div style={{ height: 360, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                <CartesianGrid stroke={colors.line} vertical={false} />
                <XAxis dataKey="grade" tick={{ fontSize: 12, fill: colors.inkSoft }} />
                <YAxis
                  tick={{ fontSize: 12, fill: colors.inkSoft }}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
                />
                <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={colors.blue}
                  strokeWidth={3}
                  dot={{ r: 4, fill: colors.blue }}
                  activeDot={{ r: 6, fill: colors.red }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}