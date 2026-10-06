// src/components/StatCards.tsx
// Four numbers for the area picked in the filter.
//
// Two are plain counts. The other two are the numbers the finding rests
// on, so each carries its national figure beside it. When the area is
// worse than the country the value turns red, and that is the only time
// red appears here.
//
// "Male / Female", "Largest region" and "Avg per school" were removed.
// The first two barely moved or repeated a chart, and the third did not
// support the finding.

import { useEffect, useState } from 'react';
import { type Filters, scopeLabel } from '../lib/filters';
import { getHeadline, type Headline } from '../lib/queries';
import { getAvailability, type Availability } from '../lib/story';
import { colors, clay } from '../constants/theme';

function StatCard({
  label, value, note, tone,
}: { label: string; value: string; note?: string; tone?: string }) {
  return (
    <div style={{ ...clay.card, padding: '1.1rem 1.2rem', textAlign: 'center' }}>
      <div style={{ fontSize: 13, color: colors.inkSoft, lineHeight: 1.35 }}>{label}</div>
      <div style={{
        fontSize: 25, fontWeight: 800, color: tone ?? colors.ink,
        marginTop: 6, whiteSpace: 'nowrap',
      }}>
        {value}
      </div>
      {note && (
        <div style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 4 }}>{note}</div>
      )}
    </div>
  );
}

export default function StatCards({ filters }: { filters: Filters }) {
  const [h, setH] = useState<Headline | null>(null);
  const [a, setA] = useState<{ scope: Availability; national: Availability } | null>(null);

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

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
      gap: 14, marginBottom: 24,
    }}>
      <StatCard label="Total learners" value={h.total.toLocaleString()} />
      <StatCard label="Schools" value={h.schools.toLocaleString()} />
      <StatCard
        label="Strands per school"
        value={hasShs ? a!.scope.avgStrands.toFixed(2) : '—'}
        tone={strandsWorse ? colors.worse : undefined}
        note={
          !hasShs ? 'No senior high data'
            : isNational ? 'of 8 possible'
              : `${a!.national.avgStrands.toFixed(2)} nationally`
        }
      />
      <StatCard
        label="Senior high learners in one strand schools"
        value={hasShs ? `${a!.scope.pctLearnersOneStrand.toFixed(1)}%` : '—'}
        tone={oneWorse ? colors.worse : undefined}
        note={
          !hasShs ? 'No senior high data'
            : isNational ? 'national figure'
              : `${a!.national.pctLearnersOneStrand.toFixed(1)}% nationally`
        }
      />
    </div>
  );
}