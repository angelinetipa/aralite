// src/components/IntroPanel.tsx
// The first thing a visitor sees. Answers three questions before they
// touch anything: what is this, who is it for, and what do I do here.
// Without this the dashboard opens straight into charts with no context.

import { useState } from 'react';
import { colors, clay } from '../constants/theme';

const STEPS = [
  {
    n: '1',
    title: 'Narrow it down',
    body: 'Use the filters to go from the whole country down to a single barangay. Every chart follows.',
  },
  {
    n: '2',
    title: 'Read the findings',
    body: 'Aralite calculates the notable patterns for you and writes them in plain language.',
  },
  {
    n: '3',
    title: 'Ask your own question',
    body: 'Type a question in English at the bottom of the page. It becomes SQL and runs right here.',
  },
];

export default function IntroPanel() {
  const [showSteps, setShowSteps] = useState(true);

  return (
    <div style={{ ...clay.card, padding: '1.5rem 1.6rem', marginBottom: 20 }}>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          margin: 0,
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
        }}
      >
        Where 27 million Filipino learners go to school.
      </h2>

      <p
        style={{
          fontSize: 14.5,
          color: colors.inkSoft,
          lineHeight: 1.6,
          margin: '10px 0 0',
        }}
      >
        Aralite turns the Department of Education&rsquo;s raw enrollment file into something
        you can actually explore. Every public and private school in the country for school
        year 2023&ndash;2024 &mdash; <strong style={{ color: colors.ink }}>60,167 schools</strong>{' '}
        and <strong style={{ color: colors.ink }}>27 million learners</strong> &mdash; filterable
        down to your own barangay.
      </p>

      <p
        style={{
          fontSize: 14,
          color: colors.inkSoft,
          lineHeight: 1.6,
          margin: '10px 0 0',
        }}
      >
        It is built for the kind of person who has to decide where teachers, classrooms, and
        programs should go &mdash; so the goal is to see where learners are, and where they stop
        showing up.
      </p>

      <p style={{ fontSize: 13, color: colors.inkSoft, margin: '10px 0 0' }}>
        The whole database runs inside your browser. Nothing is uploaded, and there is no server.
      </p>

      <button
        onClick={() => setShowSteps((v) => !v)}
        style={{
          marginTop: 16,
          padding: '7px 14px',
          borderRadius: 10,
          border: `1px solid ${colors.line}`,
          background: showSteps ? '#EAF0FB' : colors.surface,
          color: showSteps ? colors.blue : colors.inkSoft,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {showSteps ? 'Hide how to use' : 'How to use this'}
      </button>

      {showSteps && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 14,
            marginTop: 16,
            paddingTop: 16,
            borderTop: `1px solid ${colors.line}`,
          }}
        >
          {STEPS.map((s) => (
            <div key={s.n} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
              <div
                style={{
                  flexShrink: 0,
                  width: 26,
                  height: 26,
                  borderRadius: 9,
                  background: `linear-gradient(180deg, ${colors.yellow}, #E8B90A)`,
                  color: colors.ink,
                  fontSize: 13,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 8px rgba(252,209,22,0.4)',
                }}
              >
                {s.n}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: colors.inkSoft, lineHeight: 1.5 }}>
                  {s.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}