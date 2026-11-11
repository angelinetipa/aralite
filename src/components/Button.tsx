// src/components/Button.tsx
// One button for the whole app, so every action looks the same.
//
//   primary        blue fill, the main action in a card
//   danger         red fill, the confirm step of a destructive action
//   outline        white with a thin border, a quiet second action
//   outlineDanger  white with a red border, a destructive action that
//                  still needs a confirm step

import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import { colors } from '../constants/theme';

type Variant = 'primary' | 'danger' | 'outline' | 'outlineDanger';

const VARIANTS: Record<Variant, CSSProperties> = {
  primary: {
    border: 'none', background: colors.blue, color: '#fff',
    boxShadow: '0 6px 14px rgba(0,56,168,0.30)',
  },
  danger: {
    border: 'none', background: colors.red, color: '#fff',
    boxShadow: '0 6px 14px rgba(206,17,38,0.28)',
  },
  outline: {
    border: '1px solid rgba(0,0,0,0.15)', background: '#fff', color: colors.ink,
  },
  outlineDanger: {
    border: `1px solid ${colors.red}`, background: '#fff', color: colors.red,
  },
};

export default function Button({
  variant = 'primary', style, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...rest}
      style={{
        padding: '9px 16px',
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 600,
        cursor: rest.disabled ? 'default' : 'pointer',
        opacity: rest.disabled ? 0.55 : 1,
        ...VARIANTS[variant],
        ...style,
      }}
    />
  );
}