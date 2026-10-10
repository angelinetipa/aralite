// src/components/StatCards.tsx
// Four numbers for the area picked in the filter.
//
// Every card has the same three lines: a label, the number, and one
// small line that compares it with the country. That keeps the four
// cards easy to read side by side.
//
//   Total learners      this area's share of all the country's learners
//   Schools             this area's share of all the country's schools
//   Strands per school  the national figure beside it
//   One strand schools  the national figure beside it
//
// The two rates are the numbers the finding rests on. When the area is
// worse than the country the number turns red, and that is the only time
// red appears here.
//
// With nothing picked, the area is the country, so a comparison would
// compare it with itself. The small line then says what the number is.
//
// These are flat tiles on purpose. They sit inside the Explore panel,
// and a shadowed card inside a card makes the panel look heavy.

import { useEffect, useState } from 'react';
import { type Filters, scopeLabel } from '../lib/filters';
import { getHeadline, type Headline } from '../lib/queries';
import { getAvailability, type Availability } from '../lib/story';
import { shareText } from '../lib/format';
import { colors } from '../constants/theme';

function StatCard({
  label, value, note, tone,
}: { label: string; value: string; note: string; tone?: string }) {
  return (
    <div
      style={{
        padding: '0.7rem 0.9rem',
        textAlign: 'center',
        borderRadius: 14,
        background: '#F9F7F1',
        border: `1px solid ${colors.line}`,
      }}
    >
      <div style={{ fontSize: 12.5, color: colors.inkSoft, lineHeight: 1.35 }}>{label}</div>
      <div
        style={{
          fontSize: 25, fontWeight: 800, color: tone ?? colors.ink,
          marginTop: 6, whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 4 }}>{note}</div>
    </div>
  );
}

export default function StatCards({ filters }: { filters: Filters }) {
  const [h, setH] = useState<Headline | null>(null);
  const [nat, setNat] = useState<Headline | null>(null);
  const [a, setA] = useState<{ scope: Availability; national: Availability } | null>(null);

  // The country's totals never change, so they load once.
  useEffect(() => {
    getHeadline({}).then(setNat).catch(() => setNat(null));
  }, []);

  useEffect(() => {
    getHeadline(filters).then(setH).catch(() => setH(null));
    getAvailability(filters).then(setA).catch(() => setA(null));
  }, [filters]);

  if (!h) return null;

  const isNational = scopeLabel(filters) === 'the country';
  const hasShs = a !== null && a.scope.schools > 0;

  const strandsWorse = hasShs && !isNational && a!.scope.avgStrands < a!.national.avgStrands;
  const oneWorse = hasShs && !isNational
    && a!.scope.pctLearnersOneStrand > a!.national.pctLearnersOneStrand;

  const learnersNote = isNational ? 'the whole country'
    : nat && nat.total ? `${shareText((h.total / nat.total) * 100)} of the country` : '';
  const schoolsNote = isNational ? 'the whole country'
    : nat && nat.schools ? `${shareText((h.schools / nat.schools) * 100)} of the country` : '';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 10,
      }}
    >
      <StatCard label="Total learners" value={h.total.toLocaleString()} note={learnersNote} />
      <StatCard label="Schools" value={h.schools.toLocaleString()} note={schoolsNote} />
      <StatCard
        label="Strands per school"
        value={hasShs ? a!.scope.avgStrands.toFixed(2) : '—'}
        tone={strandsWorse ? colors.worse : undefined}
        note={
          !hasShs ? 'No senior high data'
            : isNational ? 'out of 8 possible'
              : `Country ${a!.national.avgStrands.toFixed(2)}`
        }
      />
      <StatCard
        label="Senior high learners in one strand schools"
        value={hasShs ? `${a!.scope.pctLearnersOneStrand.toFixed(1)}%` : '—'}
        tone={oneWorse ? colors.worse : undefined}
        note={
          !hasShs ? 'No senior high data'
            : isNational ? 'of senior high learners'
              : `Country ${a!.national.pctLearnersOneStrand.toFixed(1)}%`
        }
      />
    </div>
  );
}