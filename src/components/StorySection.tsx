// src/components/StorySection.tsx
// The climax, placed first.
//
// A dashboard that opens with seven equal charts asks the reader to find
// the point themselves. This card states it in one sentence, with three
// figures under it — so everything below becomes evidence rather than
// decoration. It rewrites itself for whatever scope is filtered, and
// always shows the national figure beside it so the number means
// something.
//
// The caveat is collapsed rather than cut. It matters, but printed in
// full it turned the top of the page into a paragraph nobody finished.

import { useEffect, useState } from 'react';
import { getAvailability, type Availability } from '../lib/story';
import { type Filters, scopeLabel } from '../lib/filters';
import { colors, clay } from '../constants/theme';
import { ErrorState, Disclosure } from './ui';

const WRITEUP =
  'https://github.com/angelinetipa/aralite/tree/main/analysis/strand-availability';

function Figure({ value, label, tone }: { value: string; label: string; tone?: string }) {
  return (
    <div>
      <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.05, color: tone ?? colors.ink }}>
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: colors.inkSoft, marginTop: 5, lineHeight: 1.4 }}>
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

  const ratio = national.pctLearnersOneStrand
    ? scope.pctLearnersOneStrand / national.pctLearnersOneStrand
    : 1;
  const worse = scope.pctLearnersOneStrand > national.pctLearnersOneStrand;

  const headline = isNational
    ? `The average senior high school runs ${scope.avgStrands.toFixed(1)} of 8 strands`
    : `In ${label}, ${scope.pctLearnersOneStrand.toFixed(1)}% of senior-high learners attend a school running only one strand`;

  const body = isNational
    ? `${scope.pctSchoolsOneStrand.toFixed(0)}% of schools run only one — but those hold just ${scope.pctLearnersOneStrand.toFixed(1)}% of learners, because they are small. The real variation is regional.`
    : `${ratio >= 1 ? `${ratio.toFixed(1)}× the national` : `${(1 / ratio).toFixed(1)}× below the national`} figure of ${national.pctLearnersOneStrand.toFixed(1)}%.`;

  return (
    <div
      style={{
        ...clay.card,
        padding: '1.7rem 1.8rem',
        marginBottom: 28,
        borderLeft: `5px solid ${colors.blue}`,
      }}
    >
      <div
        style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: colors.blue, marginBottom: 10,
        }}
      >
        The finding
      </div>

      <h2
        style={{
          fontSize: 23, fontWeight: 800, lineHeight: 1.32,
          margin: 0, color: colors.ink, maxWidth: '46ch',
        }}
      >
        {headline}
      </h2>

      <p
        style={{
          fontSize: 14.5, color: colors.inkSoft, lineHeight: 1.6,
          margin: '10px 0 0', maxWidth: '58ch',
        }}
      >
        A learner can only enrol in a strand their own school runs. {body}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 22,
          margin: '24px 0 0',
          paddingTop: 22,
          borderTop: `1px solid ${colors.line}`,
        }}
      >
        <Figure
          value={scope.avgStrands.toFixed(2)}
          label={isNational ? 'strands per school, of 8' : `strands per school · ${national.avgStrands.toFixed(2)} nationally`}
        />
        <Figure
          value={`${scope.pctLearnersOneStrand.toFixed(1)}%`}
          label={isNational ? 'of learners have no strand alternative' : `no alternative · ${national.pctLearnersOneStrand.toFixed(1)}% nationally`}
          tone={!isNational && worse ? colors.red : undefined}
        />
        <Figure
          value={scope.oneStrandSchools.toLocaleString()}
          label={`of ${scope.schools.toLocaleString()} schools run a single strand`}
        />
      </div>

      <Disclosure summary="What this does not say">
        It does not measure preference. Enrollment records what learners took, not what they
        wanted, and this data cannot separate the two — it only shows they are entangled.
        Availability is inferred from enrollment, since the source file has no offerings
        column.{' '}
        <a href={WRITEUP} target="_blank" rel="noreferrer" style={{ color: colors.blue, fontWeight: 600 }}>
          Full method and limits →
        </a>
      </Disclosure>
    </div>
  );
}