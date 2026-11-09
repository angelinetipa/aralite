// src/components/AskSection.tsx
// Ask the data in plain English. The AI (the user's own key) writes SQL,
// we check it is read only, DuckDB runs it, and we show the answer as a
// table, an automatic bar chart when it fits, and the SQL itself for
// trust and learning.
//
// Layout. This is the second dark card on the page, on the opposite
// diagonal from the finding. The controls sit on the dark card. The
// answer appears in a light panel below them. That panel scrolls inside
// the card, so a long answer does not stretch the whole row.
//
// Color. The automatic chart is gray with the top bar in blue, the same
// as every other chart on the page.

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { questionToSQL, isSafeSelect, type Provider } from '../lib/ai';
import { query } from '../lib/db';
import { compact } from '../lib/format';
import { colors } from '../constants/theme';
import { Card } from './ui';

type Row = Record<string, unknown>;

// Nobody types into an empty AI box. Three real questions show what the
// feature can do and what kind of phrasing works.
const EXAMPLES = [
  'Which regions have the largest Grade 6 to 7 gap?',
  'Top 10 provinces by senior high enrollment',
  'How many schools offer senior high in each region?',
];

const ON_DARK = 'rgba(255,255,255,0.78)';

export default function AskSection() {
  const [provider, setProvider] = useState<Provider>('groq');
  const [apiKey, setApiKey] = useState('');
  const [question, setQuestion] = useState('');
  const [sql, setSql] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<'idle' | 'thinking' | 'error' | 'done'>('idle');
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  async function ask(text?: string) {
    const asked = (text ?? question).trim();
    if (!apiKey.trim() || !asked) return;
    setQuestion(asked);
    setStatus('thinking'); setError(''); setRows([]); setSql('');
    try {
      const generated = await questionToSQL(provider, apiKey.trim(), asked);
      setSql(generated);
      if (!isSafeSelect(generated)) {
        setError('The AI produced a query that isn\'t a safe read-only SELECT, so it was blocked.');
        setStatus('error');
        return;
      }
      const result = await query<Row>(generated);
      setRows(result);
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setStatus('error');
    }
  }

  // The result becomes a simple bar chart when it has exactly 2 columns,
  // one text label and one number.
  const cols = rows[0] ? Object.keys(rows[0]) : [];
  const chartable =
    rows.length > 1 && cols.length === 2 &&
    rows.every((r) => !isNaN(Number(r[cols[1]])));
  const chartData = chartable
    ? rows.map((r) => ({ label: String(r[cols[0]]), value: Number(r[cols[1]]) }))
    : [];

  const inputStyle = {
    padding: '8px 12px', borderRadius: 10, fontSize: 14,
    border: '1px solid rgba(0,0,0,0.12)', background: '#fff', width: '100%',
  };

  const showAnswer = sql !== '' || (status === 'done' && rows.length === 0);

  return (
    <Card
      dark
      eyebrow="Ask it yourself"
      title="Put a question to the data"
      subtitle="Plain English in, read only SQL out. It looks at the whole dataset, not the filter."
    >
      {/* Provider and key */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
          style={{ ...inputStyle, width: 'auto' }}
        >
          <option value="groq">Groq (llama-3.1)</option>
          <option value="gemini">Gemini (1.5 flash)</option>
        </select>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={`Your ${provider === 'groq' ? 'Groq' : 'Gemini'} API key`}
          style={{ ...inputStyle, flex: 1, minWidth: 160 }}
        />
      </div>

      {/* Where do I get a key? Most visitors have never made one. */}
      <button
        onClick={() => setShowHelp((v) => !v)}
        style={{
          padding: 0, border: 'none', background: 'none', cursor: 'pointer',
          color: colors.blueSoft, fontSize: 12.5, fontWeight: 600,
          textDecoration: 'underline', marginBottom: 10,
        }}
      >
        {showHelp ? 'Hide key help' : "Don't have a key? Here's how to get one"}
      </button>

      {showHelp && (
        <div style={{
          border: `1px solid ${colors.line}`, borderRadius: 12,
          padding: '12px 14px', marginBottom: 12, background: '#FBFAF6',
        }}>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 8px', color: colors.inkSoft }}>
            <strong style={{ color: colors.ink }}>What the key is for.</strong> The rest of this
            dashboard needs no key. This one box does, because turning your question into SQL
            takes an AI model, and the model runs on someone else&rsquo;s computer. The key is how
            that company knows the request came from you.
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 8px', color: colors.inkSoft }}>
            <strong style={{ color: colors.ink }}>Why yours and not mine.</strong> If Aralite
            shipped with its own key, anyone could spend it. Using your own also means your
            questions go straight from your browser to the provider. They never pass through any
            server of mine, because there isn&rsquo;t one.
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 8px', color: colors.inkSoft }}>
            Both options below have a free tier. Sign in, create a key, and paste it above.
          </p>
          <ul style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: 13, color: colors.inkSoft }}>
            <li style={{ marginBottom: 5, lineHeight: 1.6 }}>
              <strong style={{ color: colors.ink }}>Groq</strong> is the fastest and needs no card.{' '}
              <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer"
                style={{ color: colors.blue }}>console.groq.com/keys</a>
            </li>
            <li style={{ lineHeight: 1.6 }}>
              <strong style={{ color: colors.ink }}>Gemini</strong> works with any Google account.{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
                style={{ color: colors.blue }}>aistudio.google.com/apikey</a>
            </li>
          </ul>
          <p style={{ fontSize: 12.5, lineHeight: 1.6, margin: 0, color: colors.inkSoft }}>
            The key lives only in this browser tab and disappears when you close it. Nothing is
            saved. Treat it like a password anyway, and you can delete it from the provider
            at any time.
          </p>
        </div>
      )}

      {/* Question */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
          placeholder="e.g. Top 5 regions by senior high enrollment"
          style={{ ...inputStyle, flex: 1, minWidth: 160 }}
        />
        <button
          onClick={() => ask()}
          disabled={status === 'thinking'}
          style={{
            padding: '8px 20px', borderRadius: 10, cursor: 'pointer', border: 'none',
            background: '#fff', color: '#0B2A6F', fontWeight: 700, fontSize: 14,
          }}
        >
          {status === 'thinking' ? 'Thinking…' : 'Ask'}
        </button>
      </div>

      {/* Starter questions. Click to fill and run. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12.5, color: ON_DARK }}>Try</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => (apiKey.trim() ? ask(ex) : setQuestion(ex))}
            disabled={status === 'thinking'}
            style={{
              padding: '5px 10px', borderRadius: 12, cursor: 'pointer', fontSize: 12,
              textAlign: 'left', color: '#fff',
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.08)',
            }}
          >
            {ex}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 12, color: ON_DARK, margin: 0 }}>
        Your key stays in your browser and is never stored or sent to us.
      </p>

      {status === 'error' && (
        <p style={{ color: '#FFB4BC', fontSize: 14, margin: '10px 0 0' }}>{error}</p>
      )}

      {/* The answer sits in a light panel that scrolls inside the card. */}
      {showAnswer && (
        <div
          style={{
            marginTop: 12, padding: 10, borderRadius: 12, background: '#fff',
            color: colors.ink, maxHeight: 320, overflow: 'auto',
          }}
        >
          {/* Generated SQL, shown for trust and learning */}
          {sql && (
            <pre style={{
              background: '#1F1D1A', color: '#EFE9DC', padding: '10px 12px',
              borderRadius: 10, fontSize: 12.5, overflowX: 'auto', margin: '0 0 10px',
            }}>{sql}</pre>
          )}

          {/* Automatic chart when the shape fits */}
          {status === 'done' && chartable && (
            <div style={{ height: 220, marginBottom: 10 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 4 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11.5, fill: colors.inkSoft }}
                    axisLine={{ stroke: colors.line }} tickLine={false}
                  />
                  <YAxis
                    tickFormatter={compact} domain={[0, 'auto']}
                    tick={{ fontSize: 11.5, fill: colors.inkSoft }}
                    axisLine={{ stroke: colors.line }} tickLine={{ stroke: colors.line }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    formatter={(v) => Number(v).toLocaleString()}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={`${d.label}-${i}`} fill={i === 0 ? colors.highlight : colors.gray} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Result table */}
          {status === 'done' && rows.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
                <thead>
                  <tr>
                    {cols.map((c) => (
                      <th key={c} style={{ textAlign: 'left', padding: '6px 10px', borderBottom: `2px solid ${colors.line}`, color: colors.inkSoft }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((r, i) => (
                    <tr key={i}>
                      {cols.map((c) => (
                        <td key={c} style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.line}` }}>
                          {typeof r[c] === 'bigint' || typeof r[c] === 'number'
                            ? Number(r[c]).toLocaleString()
                            : String(r[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {status === 'done' && rows.length === 0 && (
            <p style={{ color: colors.inkSoft, fontSize: 14, margin: 0 }}>No results for that question.</p>
          )}
        </div>
      )}
    </Card>
  );
}