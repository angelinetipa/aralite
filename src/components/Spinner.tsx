// src/components/Spinner.tsx
// One clean loading state for the whole dashboard. Booting DuckDB +
// loading parquet takes a moment; showing a single centered spinner
// looks far calmer than six sections each flashing "Loading…".

import { colors } from '../constants/theme';

export default function Spinner({ label = 'Loading dashboard…' }: { label?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 16, padding: '80px 0',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        border: `4px solid ${colors.line}`,
        borderTopColor: colors.blue,
        animation: 'aralite-spin 0.8s linear infinite',
      }} />
      <span style={{ color: colors.inkSoft, fontSize: 14 }}>{label}</span>
      <style>{`@keyframes aralite-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}