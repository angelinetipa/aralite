// src/components/StorySection.tsx
// The main finding, placed first.
//
// This card is always national. The filter lives further down the page,
// in the "Explore your area" section, so nothing at the top changes when
// someone narrows to a region. The comparison with a chosen area happens
// there, in the stat cards.
//
// The caveat is collapsed rather than cut. It matters, but printed in
// full it turned the top of the page into a paragraph nobody finished.

import { useEffect, useState } from 'react';
import { getAvailability, type Availability } from '../lib/story';
import { colors, clay } from '../constants/theme';
import { ErrorState, Disclosure } from './ui';

const WRITEUP =
  'https://github.com/angelinetipa/aralite/tree/main/analysis/strand-availability';

// One figure per row, number on the left and its meaning beside it.
// This fits the narrow left column without squeezing the labels.
function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          fontSize: 26, fontWeight: 800, lineHeight: 1.05, color: colors.ink,
          minWidth: 78, flexShrink: 0,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: colors.inkSoft, lineHeight: 1.35 }}>
        {label}
      </div>
    </div>
  );
}

export default function StorySection() {
  const [data, setData] = useState<Availability | null>(null);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    getAvailability({})
      .then((d) => { setData(d.scope); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') return null;
  if (status === 'error' || !data) return <ErrorState />;

  return (
    <div
      style={{
        ...clay.card,
        padding: '1.1rem 1.3rem',
        marginBottom: 14,
        borderLeft: `5px solid ${colors.highlight}`,
      }}
    >
      <div
        style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: colors.highlight, marginBottom: 6,
        }}
      >
        The finding
      </div>

      <h2
        style={{
          fontSize: 20, fontWeight: 800, lineHeight: 1.3,
          margin: 0, color: colors.ink,
        }}
      >
        The average senior high school runs {data.avgStrands.toFixed(1)} of the 8 tracks and
        strands on offer
      </h2>

      <p
        style={{
          fontSize: 13.5, color: colors.inkSoft, lineHeight: 1.55,
          margin: '6px 0 0',
        }}
      >
        A learner can only enrol in a strand their own school runs.{' '}
        {data.pctSchoolsOneStrand.toFixed(0)}% of schools run only one, but those hold just{' '}
        {data.pctLearnersOneStrand.toFixed(1)}% of learners because they are small. The real
        gap is between regions.
      </p>

      <div
        style={{
          display: 'grid',
          gap: 10,
          margin: '12px 0 0',
          paddingTop: 12,
          borderTop: `1px solid ${colors.line}`,
        }}
      >
        <Figure
          value={data.avgStrands.toFixed(2)}
          label="tracks and strands per school, of 8"
        />
        <Figure
          value={`${data.pctLearnersOneStrand.toFixed(1)}%`}
          label="of senior high learners have no strand alternative"
        />
        <Figure
          value={data.oneStrandSchools.toLocaleString()}
          label={`of ${data.schools.toLocaleString()} schools run a single strand`}
        />
      </div>

      <Disclosure summary="What this does not say">
        The eight are five academic strands (ABM, HUMSS, STEM, GAS and Pre-Baccalaureate
        Maritime) and three whole tracks (TVL, Arts &amp; Design and Sports). They are counted
        together because a learner picks one of the eight, whatever DepEd calls it.
        <br />
        It does not measure preference. Enrollment records what learners took, not what they
        wanted, and this data cannot separate the two. It only shows they are entangled.
        Availability is inferred from enrollment, since the source file has no offerings
        column.{' '}
        <a href={WRITEUP} target="_blank" rel="noreferrer" style={{ color: colors.blue, fontWeight: 600 }}>
          Full method and limits →
        </a>
      </Disclosure>
    </div>
  );
}