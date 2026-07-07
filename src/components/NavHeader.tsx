// src/components/NavHeader.tsx
// Shared top bar with the Aralite mark + links to the two areas:
// the public Dashboard and the Admin (data management) page.

import { Link, useLocation } from 'react-router-dom';
import { colors } from '../constants/theme';

export default function NavHeader() {
  const { pathname } = useLocation();
  const link = (to: string, label: string) => {
    const active = pathname === to;
    return (
      <Link
        to={to}
        style={{
          textDecoration: 'none', fontSize: 14, fontWeight: active ? 700 : 500,
          color: active ? colors.blue : colors.inkSoft,
          padding: '6px 12px', borderRadius: 8,
          background: active ? '#EAF0FB' : 'transparent',
        }}
      >
        {label}
      </Link>
    );
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 10, height: 40, borderRadius: 6,
          background: `linear-gradient(180deg, ${colors.yellow}, #E8B90A)`,
          boxShadow: '0 4px 10px rgba(252,209,22,0.45)',
        }} />
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Aralite</h1>
          <p style={{ color: colors.inkSoft, margin: 0, fontSize: 13 }}>
            DepEd enrollment · SY 2023–2024
          </p>
        </div>
      </div>
      <nav style={{ display: 'flex', gap: 6 }}>
        {link('/', 'Dashboard')}
        {link('/admin', 'Admin')}
      </nav>
    </div>
  );
}