// src/components/ui.tsx
// Small shared UI pieces used across tabs. Keeping them here means
// every chart card looks the same — consistent, not copy-pasted.

import type { ReactNode } from 'react';
import { colors } from '../constants/theme';

export function Card({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div style={{
      background: colors.surface,
      border: `1px solid ${colors.line}`,
      borderRadius: 12,
      padding: '1.25rem 1.5rem',
      marginBottom: 20,
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{title}</h2>
      {subtitle && (
        <p style={{ color: colors.inkSoft, fontSize: 14, margin: '4px 0 0' }}>{subtitle}</p>
      )}
      <div style={{ marginTop: 16 }}>{children}</div>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: colors.inkSoft }}>{label}</div>
      <div style={{ fontSize: 40, fontWeight: 700, color: colors.blue }}>{value}</div>
    </div>
  );
}

// One component handles all four load states so no chart forgets one.
export function Loading() {
  return <p style={{ color: colors.inkSoft }}>Loading…</p>;
}
export function ErrorState() {
  return <p style={{ color: colors.red }}>Could not load data.</p>;
}