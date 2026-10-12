// src/components/NavHeader.tsx
// Shared top bar with the Aralite mark and links to the two areas: the
// public Dashboard and the Admin (data management) page.
//
// It has two looks. The light one sits on the page background and is
// used by the Admin page. The dark one is for the blue banner at the top
// of the dashboard (HeroBanner), with white text and no strip of its own,
// since the banner draws the strip along its edge.

import { Link, useLocation } from 'react-router-dom';
import { colors } from '../constants/theme';

export default function NavHeader({ dark = false }: { dark?: boolean }) {
  const { pathname } = useLocation();

  const link = (to: string, label: string) => {
    const active = pathname === to;
    const color = dark
      ? (active ? '#fff' : 'rgba(255,255,255,0.78)')
      : (active ? colors.blue : colors.inkSoft);
    const background = dark
      ? (active ? 'rgba(255,255,255,0.18)' : 'transparent')
      : (active ? '#EAF0FB' : 'transparent');
    return (
      <Link
        to={to}
        style={{
          textDecoration: 'none', fontSize: 14, fontWeight: active ? 700 : 500,
          color, background,
          padding: '6px 12px', borderRadius: 8,
        }}
      >
        {label}
      </Link>
    );
  };

  return (
    <div>
      {/* Slim tricolor strip. It evokes the Philippine flag / DepEd palette
          without using any official logo or government IP. The dark look
          leaves it out because the banner draws its own. */}
      {!dark && (
        <div style={{
          height: 5, borderRadius: 4, marginBottom: 16,
          background: `linear-gradient(90deg, ${colors.blue} 0 33%, ${colors.red} 33% 66%, ${colors.yellow} 66% 100%)`,
        }} />
      )}

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 14, marginBottom: dark ? 0 : 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 10, height: 40, borderRadius: 6,
            background: `linear-gradient(180deg, ${colors.yellow}, #E8B90A)`,
            boxShadow: '0 4px 10px rgba(252,209,22,0.45)',
          }} />
          <div>
            <h1 style={{
              fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em',
              color: dark ? '#fff' : colors.ink,
            }}>
              Aralite
            </h1>
            <p style={{
              color: dark ? 'rgba(255,255,255,0.74)' : colors.inkSoft,
              margin: 0, fontSize: 13,
            }}>
              DepEd enrollment · SY 2023–2024
            </p>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: 6 }}>
          {link('/', 'Dashboard')}
          {link('/admin', 'Admin')}
        </nav>
      </div>
    </div>
  );
}