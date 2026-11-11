// src/components/InfoTip.tsx
// A small "i" button that opens a short note. Used by Card to hold the
// key finding, so the text stays one click away and the card stays short.
//
// Click or press Enter to open. Click outside or press Escape to close.
// The note opens toward the left, so it stays inside the card when the
// button sits at the right end of the title row.
// Pass dark when the button sits on a dark card.

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { colors } from '../constants/theme';

export default function InfoTip({
  label = 'Key finding', children, dark = false,
}: { label?: string; children: ReactNode; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const noteId = useId();

  // Close on an outside click or the Escape key, only while open.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span ref={wrap} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-expanded={open}
        aria-controls={noteId}
        title={label}
        style={{
          width: 22,
          height: 22,
          padding: 0,
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 800,
          fontStyle: 'italic',
          fontFamily: 'Georgia, serif',
          lineHeight: 1,
          color: dark ? '#fff' : colors.inkSoft,
          background: dark ? 'rgba(255,255,255,0.14)' : '#F4F1E9',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.35)' : colors.line}`,
        }}
      >
        i
      </button>

      {open && (
        <span
          id={noteId}
          role="note"
          style={{
            position: 'absolute',
            top: 28,
            right: 0,
            zIndex: 20,
            width: 260,
            maxWidth: '70vw',
            padding: '8px 10px',
            borderRadius: 10,
            background: '#fff',
            color: colors.ink,
            border: `1px solid ${colors.line}`,
            boxShadow: '0 10px 24px rgba(31,29,26,0.18)',
            fontSize: 13,
            lineHeight: 1.5,
            fontWeight: 400,
            fontStyle: 'normal',
            textAlign: 'left',
          }}
        >
          <strong>{label} </strong>
          {children}
        </span>
      )}
    </span>
  );
}