// src/components/StorySection.tsx
// The main finding, placed first, on a dark card.
//
// This card is always national. The filter lives further down the page,
// in the "Explore your area" section, so nothing at the top changes when
// someone narrows to a region.
//
// Dark is used here because this is the one claim the page argues. The
// other dark card is the Ask box, placed on the opposite diagonal.
//
// The caveat is collapsed rather than cut. It matters, but printed in
// full it turned the top of the page into a paragraph nobody finished.

import { useEffect, useState } from 'react';
import { getAvailability, type Availability } from '../lib/story';
import { colors } from '../constants/theme';
import { Card, ErrorState, Disclosure } from './ui';

const WRITEUP =
  'https://github.com/angelinetipa/aralite/tree/main/analysis/strand-availability';

// One figure per row, number on the left and its meaning beside it.
function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        className="aralite-display"
        style={{
          fontSize: 26, fontWeight: 800, lineHeight: 1.05, color: '#fff',
          minWidth: 78, flexShrink: 0,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.78)', lineHeight: 1.35 }}>
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
    <Card
      dark
      kicker="The finding"
      title={`The average senior high school runs ${data.avgStrands.toFixed(1)} of the 8 tracks and strands on offer`}
      subtitle="A learner can only enrol in a strand their own school runs. The real gap is between regions."
    >
      {/* Figures spread over the leftover height of the card. */}
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'grid',
            gap: 12,
            paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.16)',
          }}
        >
          <Figure
            value={data.avgStrands.toFixed(2)}
            label="strands per school on average, out of 8"
          />
          <Figure
            value={`${data.pctLearnersOneStrand.toFixed(1)}%`}
            label="of senior high learners attend a one strand school"
          />
          <Figure
            value={data.oneStrandSchools.toLocaleString()}
            label={`of ${data.schools.toLocaleString()} schools run a single strand`}
          />
        </div>

        <Disclosure dark summary="What this does not say">
          {data.pctSchoolsOneStrand.toFixed(0)}% of schools run only one strand, but those hold
          just {data.pctLearnersOneStrand.toFixed(1)}% of learners because they are small.
          <br />
          The eight are five academic strands (ABM, HUMSS, STEM, GAS and Pre Baccalaureate
          Maritime) and three whole tracks (TVL, Arts &amp; Design and Sports). They are counted
          together because a learner picks one of the eight, whatever DepEd calls it.
          <br />
          It does not measure preference. Enrollment records what learners took, not what they
          wanted, and this data cannot separate the two. Availability is inferred from
          enrollment, since the source file has no offerings column.{' '}
          <a
            href={WRITEUP}
            target="_blank"
            rel="noreferrer"
            style={{ color: colors.blueSoft, fontWeight: 600 }}
          >
            Full method and limits →
          </a>
        </Disclosure>
      </div>
    </Card>
  );
}