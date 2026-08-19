// src/components/StorySection.tsx
// The climax, placed first.
//
// A dashboard that opens with seven equal charts asks the reader to find
// the point themselves. This card states it, in a sentence, with the
// caveat attached — then the charts below it become evidence rather than
// decoration. It rewrites itself for whatever scope is filtered, and it
// always shows the national figure beside it so the number means
// something.

import { useEffect, useState } from 'react';
import { getAvailability, type Availability } from '../lib/story';
import { type Filters, scopeLabel } from '../lib/filters';
import { colors, clay } from '../constants/theme';
import { ErrorState } from './ui';

const WRITEUP =
  'https://github.com/angelinetipa/aralite/tree/main/analysis/strand-availability';

function Figure({ value, label, tone }: { value: string; label: string; tone?: string }) {
  return (
    <div>
      <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.05, color: tone ?? colors.ink }}>
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: colors.inkSoft, marginTop: 4, lineHeight: 1.4 }}>
        {label}
      </div>
    </div>
  );
}

export default function StorySection({ filters }: { filters: Filters }) {
  const [data, setData] = useState<{ scope: Availability; national: Availability } | null>(null);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    setStatus('loading');
    getAvailability(filters)
      .then((d) => { setData(d); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [filters]);

  if (status === 'loading') return null;
  if (status === 'error' || !data) return <ErrorState />;

  const { scope, national } = data;
  const label = scopeLabel(filters);
  const isNational = label === 'the country';

  if (scope.schools === 0) {
    return (
      <div style={{ ...clay.card, padding: '1.4rem 1.6rem', marginBottom: 24 }}>
        <p style={{ margin: 0, color: colors.inkSoft, fontSize: 14 }}>
          No senior high schools reported enrollment in {label}, so there is nothing to compare here.
        </p>
      </div>
    );
  }

  // The headline rewrites itself: nationally it states the pattern,
  // filtered it states this place against the national figure.
  const ratio = national.pctLearnersOneStrand
    ? scope.pctLearnersOneStrand / national.pctLearnersOneStrand
    : 1;
  const worse = scope.pctLearnersOneStrand > national.pctLearnersOneStrand;

  const headline = isNational
    ? `The average senior high school runs ${scope.avgStrands.toFixed(1)} of 8 strands`
    : `In ${label}, ${scope.pctLearnersOneStrand.toFixed(1)}% of senior-high learners attend a school running only one strand`;

  const body = isNational
    ? `${scope.pctSchoolsOneStrand.toFixed(0)}% of senior high schools run only one strand — but those schools hold just ${scope.pctLearnersOneStrand.toFixed(1)}% of learners, because they are small. The real variation is regional, and it is wide.`
    : `That is ${ratio >= 1 ? `${ratio.toFixed(1)}×` : `${(1 / ratio).toFixed(1)}× less than`} the national figure of ${national.pctLearnersOneStrand.toFixed(1)}%. Schools here run ${scope.avgStrands.toFixed(2)} strands on average, against ${national.avgStrands.toFixed(2)} nationally.`;

  return (
    <div
      style={{
        ...clay.card,
        padding: '1.6rem 1.7rem',
        marginBottom: 24,
        borderLeft: `5px solid ${colors.blue}`,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: colors.blue,
          marginBottom: 10,
        }}
      >
        The finding
      </div>

      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          lineHeight: 1.3,
          margin: 0,
          color: colors.ink,
          maxWidth: '52ch',
        }}
      >
        {headline}
      </h2>

      <p
        style={{
          fontSize: 14.5,
          color: colors.inkSoft,
          lineHeight: 1.65,
          margin: '10px 0 0',
          maxWidth: '62ch',
        }}
      >
        Senior high is built around choosing a track, but a learner can only enrol in a strand
        their own school runs. {body}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 18,
          margin: '20px 0 0',
          paddingTop: 18,
          borderTop: `1px solid ${colors.line}`,
        }}
      >
        <Figure
          value={scope.avgStrands.toFixed(2)}
          label={`strands run per school, of 8${isNational ? '' : ` · ${national.avgStrands.toFixed(2)} nationally`}`}
        />
        <Figure
          value={`${scope.pctLearnersOneStrand.toFixed(1)}%`}
          label={`of learners have no strand alternative at their school${isNational ? '' : ` · ${national.pctLearnersOneStrand.toFixed(1)}% nationally`}`}
          tone={!isNational && worse ? colors.red : undefined}
        />
        <Figure
          value={scope.oneStrandSchools.toLocaleString()}
          label={`of ${scope.schools.toLocaleString()} senior high schools run a single strand`}
        />
      </div>

      <p
        style={{
          fontSize: 12.5,
          color: colors.inkSoft,
          lineHeight: 1.6,
          margin: '16px 0 0',
          paddingTop: 14,
          borderTop: `1px solid ${colors.line}`,
        }}
      >
        <strong style={{ color: colors.ink }}>What this does not say.</strong> It does not measure
        preference. Enrollment records what learners took, not what they wanted, and this data cannot
        separate the two — it only shows they are entangled. Availability is inferred from
        enrollment, since the source file has no offerings column.{' '}
        <a href={WRITEUP} target="_blank" rel="noreferrer" style={{ color: colors.blue, fontWeight: 600 }}>
          Read the full analysis, method, and limits →
        </a>
      </p>
    </div>
  );
}