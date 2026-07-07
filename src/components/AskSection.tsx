// src/components/AskSection.tsx
// Ask the data in plain English. The AI (user's own key) writes SQL,
// we check it's read-only, DuckDB runs it, and we show: the answer as a
// table, an auto bar chart when it fits, and the SQL itself (for trust
// and learning).

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { questionToSQL, isSafeSelect, type Provider } from '../lib/ai';
import { query } from '../lib/db';
import { colors } from '../constants/theme';
import { Card } from './ui';

type Row = Record<string, unknown>;

export default function AskSection() {
  const [provider, setProvider] = useState<Provider>('groq');
  const [apiKey, setApiKey] = useState('');
  const [question, setQuestion] = useState('');
  const [sql, setSql] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<'idle' | 'thinking' | 'error' | 'done'>('idle');
  const [error, setError] = useState('');

  async function ask() {
    if (!apiKey.trim() || !question.trim()) return;
    setStatus('thinking'); setError(''); setRows([]); setSql('');
    try {
      const generated = await questionToSQL(provider, apiKey.trim(), question.trim());
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

  // Decide if the result can be a simple bar chart: exactly 2 columns,
  // one text label + one number.
  const cols = rows[0] ? Object.keys(rows[0]) : [];
  const chartable =
    rows.length > 1 && cols.length === 2 &&
    rows.every((r) => !isNaN(Number(r[cols[1]])));
  const chartData = chartable
    ? rows.map((r) => ({ label: String(r[cols[0]]), value: Number(r[cols[1]]) }))
    : [];

  const inputStyle = {
    padding: '9px 12px', borderRadius: 10, fontSize: 14,
    border: '1px solid rgba(0,0,0,0.12)', background: '#fff', width: '100%',
  };

  return (
    <Card
      title="Ask the data"
      accent={colors.blue}
      subtitle="Type a question in plain English. Your AI key writes the SQL, and it runs right here. Read-only — nothing can change the data."
    >
      {/* Provider + key */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
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
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
        />
      </div>

      {/* Question */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
          placeholder="e.g. Top 5 regions by senior high enrollment"
          style={{ ...inputStyle, flex: 1, minWidth: 220 }}
        />
        <button
          onClick={ask}
          disabled={status === 'thinking'}
          style={{
            padding: '9px 20px', borderRadius: 10, cursor: 'pointer', border: 'none',
            background: colors.blue, color: '#fff', fontWeight: 600, fontSize: 14,
          }}
        >
          {status === 'thinking' ? 'Thinking…' : 'Ask'}
        </button>
      </div>

      <p style={{ fontSize: 12, color: colors.inkSoft, margin: '0 0 14px' }}>
        Your key stays in your browser and is never stored or sent to us.
      </p>

      {status === 'error' && (
        <p style={{ color: colors.red, fontSize: 14 }}>{error}</p>
      )}

      {/* Generated SQL — shown for trust + learning */}
      {sql && (
        <pre style={{
          background: '#1F1D1A', color: '#EFE9DC', padding: '12px 14px',
          borderRadius: 10, fontSize: 13, overflowX: 'auto', margin: '0 0 14px',
        }}>{sql}</pre>
      )}

      {/* Auto chart when the shape fits */}
      {status === 'done' && chartable && (
        <div style={{ height: 300, marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid stroke={colors.line} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: colors.inkSoft }} />
              <YAxis tick={{ fontSize: 11, fill: colors.inkSoft }} />
              <Tooltip formatter={(v) => Number(v).toLocaleString()} />
              <Bar dataKey="value" fill={colors.blue} radius={[4, 4, 0, 0]} />
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
                  <th key={c} style={{ textAlign: 'left', padding: '6px 12px', borderBottom: `2px solid ${colors.line}`, color: colors.inkSoft }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((r, i) => (
                <tr key={i}>
                  {cols.map((c) => (
                    <td key={c} style={{ padding: '6px 12px', borderBottom: `1px solid ${colors.line}` }}>
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
        <p style={{ color: colors.inkSoft, fontSize: 14 }}>No results for that question.</p>
      )}
    </Card>
  );
}