// src/components/AvailabilitySection.tsx
// The evidence behind the finding, one metric per card.
//
// Rendered twice by the dashboard, in the same order as the written
// analysis: how many strands a school runs, then how many learners have
// no alternative. Keeping the two in step means the page and the writeup
// can never drift apart.
//
// Deliberately NOT filtered. Every other chart narrows when you pick a
// region; this one always shows all 18 bars — the country's 17 regions
// plus PSO, Philippine Schools Overseas, which DepEd files in the same
// column but which is not a region — because its job is to be the
// benchmark. Filtering it to a single bar would leave nothing to compare
// against. The active filter outlines a bar instead of removing the rest.
//
// Sorting happens here, never in SQL. Ordering by a raw SUM while drawing
// a percentage put this chart in the wrong order and produced a false
// headline — the sort must use the same number the bars use.
//
// Each chart is built to carry ONE point, in three parts: a title that
// states the claim, a shaded band on the plot telling the eye where to
// look, and a paragraph underneath giving the context and saying where
// the claim stops. Eighteen bars with a neutral title is a table drawn
// slowly; the reader has to find the story themselves and usually does
// not. Every word in the band labels and the paragraph is generated from
// the rows being drawn, so the prose cannot drift away from the bars.
//
// The six charts in the collapsed context block deliberately do NOT get
// this treatment. They describe the dataset rather than argue anything,
// and annotating all eight would mean eight stories, which is none.

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine, ReferenceArea, Label,
} from 'recharts';
import { getAvailability, getAvailabilityByRegion, type AvailabilityRegionRow } from '../lib/story';
import { type Filters } from '../lib/filters';
import { colors } from '../constants/theme';
import { Card, ErrorState, ChartNote } from './ui';

export type Metric = 'avgStrands' | 'pctLearnersOneStrand';

// How many bars each shaded band covers, top and bottom.
const BAND = 3;

type Row = AvailabilityRegionRow;

const names = (rows: Row[]) => {
  const n = rows.map((r) => r.region);
  return `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`;
};

// Each metric carries its own scale, wording, and sense of which
// direction is bad — kept together so they cannot fall out of sync.
const SPEC = {
  avgStrands: {
    axis: 'Average tracks and strands a school runs (of 8)',
    max: 8,
    ticks: [0, 2, 4, 6, 8],
    format: (v: number) => v.toFixed(2),
    tickFormat: (v: number) => `${v}`,
    tooltip: 'Average tracks and strands per school',
    worseWhen: 'below' as const,
    sortAsc: true,          // fewest strands first — worst at the top
    bandTop: 'Fewest on offer',
    bandBottom: 'Most on offer',
    note: (top: Row[], bottom: Row[], nat: number, _agree: number) => {
      void _agree;
      const f = (v: number) => v.toFixed(2);
      const tLo = Math.min(...top.map((r) => r.avgStrands));
      const tHi = Math.max(...top.map((r) => r.avgStrands));
      const bLo = Math.min(...bottom.map((r) => r.avgStrands));
      const bHi = Math.max(...bottom.map((r) => r.avgStrands));
      return `The shaded band at the top — ${names(top)} — runs ${f(tLo)} to ${f(tHi)} `
        + `of the eight tracks and strands, against ${f(nat)} nationally and ${f(bLo)} to `
        + `${f(bHi)} in the band at the bottom. Senior high is built around choosing a `
        + `track, but where a school runs two, choosing means choosing between two or `
        + `travelling. This counts what schools offer. It says nothing about the learners `
        + `inside them.`;
    },
  },
  pctLearnersOneStrand: {
    axis: '% of senior-high learners in a single-strand school',
    max: null,
    ticks: null,
    format: (v: number) => `${v.toFixed(1)}%`,
    tickFormat: (v: number) => `${v}%`,
    tooltip: 'Learners in single-strand schools',
    worseWhen: 'above' as const,
    sortAsc: false,         // highest share first — worst at the top
    bandTop: 'Least choice',
    bandBottom: 'Most choice',
    note: (top: Row[], bottom: Row[], nat: number, agree: number) => {
      const f = (v: number) => `${v.toFixed(1)}%`;
      const worst = top[0];
      const best = [...bottom].sort(
        (a, b) => a.pctLearnersOneStrand - b.pctLearnersOneStrand)[0];
      const ratio = best.pctLearnersOneStrand
        ? worst.pctLearnersOneStrand / best.pctLearnersOneStrand : 0;
      // Ratio rounded the same way the chart title rounds it. Two
      // precisions for one number on one card reads as a discrepancy.
      const overlap = agree === BAND
        ? `All ${BAND} also sit in the worst ${BAND} on the chart above`
        : `${agree} of the ${BAND} also sit in the worst ${BAND} on the chart above`;
      return `In ${worst.region}, ${f(worst.pctLearnersOneStrand)} of senior-high learners `
        + `attend a school running a single strand — no alternative without changing `
        + `school. In ${best.region} it is ${f(best.pctLearnersOneStrand)}, and nationally `
        + `${f(nat)}. That is a ${ratio.toFixed(0)}× spread inside one country. `
        + `${overlap}, which is two rankings built from different numbers pointing at the `
        + `same places. What none of it tells you is whether those learners wanted that `
        + `strand — enrollment records what they took. Which regions to widen first is `
        + `below.`;
    },
  },
};

export default function AvailabilitySection({
  filters, metric,
}: { filters: Filters; metric: Metric }) {
  const [rows, setRows] = useState<AvailabilityRegionRow[]>([]);
  const [national, setNational] = useState({ avgStrands: 0, pctLearnersOneStrand: 0 });
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    setStatus('loading');
    Promise.all([getAvailabilityByRegion(), getAvailability({})])
      .then(([r, a]) => {
        setRows(r);
        setNational({
          avgStrands: a.national.avgStrands,
          pctLearnersOneStrand: a.national.pctLearnersOneStrand,
        });
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') return null;
  if (status === 'error') return <ErrorState />;
  if (rows.length === 0) return null;

  const spec = SPEC[metric];
  const nat = national[metric];

  // Sort by the metric actually being drawn, worst region first.
  const data = [...rows].sort((a, b) =>
    spec.sortAsc ? a[metric] - b[metric] : b[metric] - a[metric]);

  const worst = data[0];
  const best = data[data.length - 1];

  // Top and bottom bands. Skipped entirely if there are not enough bars
  // for two distinct groups — a band covering half the chart points at
  // nothing.
  const banded = data.length >= BAND * 2;
  const topBand = data.slice(0, BAND);
  const bottomBand = data.slice(-BAND);

  // How many of this chart's worst regions are also worst on the OTHER
  // metric. Counted, not asserted: the two rankings happen to agree
  // completely on this data, and writing that into the prose would make
  // it a claim that silently goes stale the day the data changes.
  const other: Metric = metric === 'avgStrands' ? 'pctLearnersOneStrand' : 'avgStrands';
  const otherWorst = [...rows]
    .sort((a, b) => (SPEC[other].sortAsc
      ? a[other] - b[other]
      : b[other] - a[other]))
    .slice(0, BAND);
  const agree = topBand.filter(
    (r) => otherWorst.some((o) => o.region === r.region)).length;

  // Round the axis up to a clean number. Leaving it at the exact maximum
  // printed a tick reading "22.49897703308118%".
  const dataMax = Math.max(...data.map((r) => r[metric]));
  const axisMax = spec.max ?? Math.ceil(dataMax / 5) * 5;
  const ticks = spec.ticks ?? Array.from(
    { length: axisMax / 5 + 1 }, (_, i) => i * 5);

  const title = metric === 'avgStrands'
    ? `The average senior high school runs ${nat.toFixed(1)} of the 8 tracks and strands on offer — in ${worst.region} it is closer to ${Math.round(worst.avgStrands)}`
    : `A senior-high learner in ${worst.region} is ${(worst[metric] / best[metric]).toFixed(0)}× more likely than one in ${best.region} to attend a school running only one strand`;

  const subtitle = metric === 'avgStrands'
    ? `Fewest first. Dashed line is the national figure, ${nat.toFixed(2)} — all 17 regions plus overseas schools, counted together.`
    : `Share of learners whose school runs a single strand. Dashed line is the national figure, ${nat.toFixed(1)}%.`;

  return (
    <Card
      title={title}
      accent={metric === 'avgStrands' ? colors.blue : colors.red}
      subtitle={subtitle}
    >
      <div style={{ height: 460 }}>
        <ResponsiveContainer width="100%" height="100%">
          {/* Top margin leaves room for the reference-line label, which was
              being clipped by the plot area. */}
          <BarChart data={data} layout="vertical" margin={{ top: 26, right: 28, bottom: 24, left: 8 }}>
            <CartesianGrid stroke={colors.line} horizontal={false} />
            <XAxis
              type="number"
              domain={[0, axisMax]}
              ticks={ticks}
              tick={{ fontSize: 12, fill: colors.inkSoft }}
              tickFormatter={spec.tickFormat}
              label={{
                value: spec.axis,
                position: 'insideBottom', offset: -14,
                style: { fontSize: 11, fill: colors.inkSoft },
              }}
            />
            <YAxis
              type="category" dataKey="region" width={104} interval={0}
              tick={{ fontSize: 11.5, fill: colors.ink }}
            />
            <Tooltip formatter={(v) => [spec.format(Number(v)), spec.tooltip]} />
            <ReferenceLine
              x={nat}
              stroke={colors.ink}
              strokeDasharray="4 4"
              strokeWidth={1.4}
              ifOverflow="extendDomain"
              label={{
                value: `National ${spec.format(nat)}`,
                position: 'top', offset: 8,
                style: { fontSize: 11, fill: colors.ink, fontWeight: 700 },
              }}
            />
            {/* Shaded bands are drawn BEFORE the bars so the bars sit on
                top of them and stay fully legible. */}
            {banded && (
              <ReferenceArea
                y1={topBand[0].region} y2={topBand[BAND - 1].region}
                x1={0} x2={axisMax}
                fill={colors.red} fillOpacity={0.06} stroke="none"
              >
                <Label
                  value={spec.bandTop}
                  position="insideBottomRight"
                  offset={10}
                  style={{ fontSize: 11, fontWeight: 800, fill: colors.red }}
                />
              </ReferenceArea>
            )}
            {banded && (
              <ReferenceArea
                y1={bottomBand[0].region} y2={bottomBand[BAND - 1].region}
                x1={0} x2={axisMax}
                fill={colors.blue} fillOpacity={0.05} stroke="none"
              >
                <Label
                  value={spec.bandBottom}
                  position="insideTopRight"
                  offset={10}
                  style={{ fontSize: 11, fontWeight: 800, fill: colors.blue }}
                />
              </ReferenceArea>
            )}
            <Bar dataKey={metric} radius={[0, 6, 6, 0]}>
              {data.map((r) => {
                const worse = spec.worseWhen === 'above' ? r[metric] > nat : r[metric] < nat;
                return (
                  <Cell
                    key={r.region}
                    fill={worse ? colors.red : colors.blueSoft}
                    stroke={filters.region === r.region ? colors.ink : undefined}
                    strokeWidth={filters.region === r.region ? 2 : 0}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {banded && <ChartNote>{spec.note(topBand, bottomBand, nat, agree)}</ChartNote>}
    </Card>
  );
}