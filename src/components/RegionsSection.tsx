// src/components/RegionsSection.tsx
// Learners by region as a treemap. Each tile's area is its share of the
// country's learners, so the whole rectangle is the whole country.
// These are the 17 regions plus PSO, Philippine Schools Overseas, which
// DepEd files in the Region column but which is not a region.
//
// Why a treemap. The question here is "how big is each part of the
// whole", and bars answer it with 18 rows and a lot of height. A treemap
// answers it in one compact block, and the tiles are big enough to click.
//
// Reading it. Tiles with room show the region name and its learners.
// A tight tile shows the short name, such as R VIII. The smallest tiles
// show nothing, to avoid cramped text. Hover any tile for its name and
// number.
//
// Color. Gray by default. Blue marks the selected region, or the largest
// one when nothing is selected, so the title and the tile always match.
// The selected region also gets a dark outline.
//
// Clicking a tile filters the whole dashboard to that region. Enter or
// Space does the same for keyboard users.

import { useEffect, useState } from 'react';
import { Treemap, Tooltip, ResponsiveContainer, type TreemapNode } from 'recharts';
import { getTopRegions, type RegionRow } from '../lib/queries';
import { type Filters } from '../lib/filters';
import { compact, shareText } from '../lib/format';
import { colors } from '../constants/theme';
import { Card, ErrorState } from './ui';

const CHART_HEIGHT = 300;

// Draws one tile. Called by the Treemap for every node.
function Tile({
  node, marked, onPick,
}: { node: TreemapNode; marked: string | undefined; onPick: (r: string) => void }) {
  // The treemap also hands over its invisible root. It is not a region,
  // so it draws nothing and cannot be clicked.
  if (node.depth === 0) return <g />;

  const { x, y, width, height, name, value } = node;
  const isMarked = name === marked;
  const textColor = isMarked ? '#fff' : colors.ink;

  // Use the full name when it fits. Otherwise try the short form, "R VIII"
  // for "Region VIII". If even that does not fit, show no name at all,
  // since a cut off name such as "Regio…" tells the reader nothing.
  const fits = (s: string) => s.length * 6.8 + 14 <= width;
  const short = name.replace(/^Region /, 'R ');
  const label = fits(name) ? name : fits(short) ? short : '';

  // Text only goes where it fits. Name needs room across, the learner
  // count also needs a second line of height.
  const showName = label !== '' && height >= 30;
  const showValue = label !== '' && height >= 50;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${name}, ${value.toLocaleString()} learners. Filter the dashboard to this region.`}
      style={{ cursor: 'pointer', outline: 'none' }}
      onClick={() => onPick(name)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPick(name);
        }
      }}
    >
      <rect
        x={x} y={y} width={width} height={height} rx={6}
        fill={isMarked ? colors.highlight : colors.gray}
        stroke={isMarked ? colors.ink : '#fff'}
        strokeWidth={isMarked ? 2 : 1}
      />
      {showName && (
        <text x={x + 8} y={y + 18} fontSize={12} fontWeight={700} fill={textColor}>
          {label}
        </text>
      )}
      {showValue && (
        <text x={x + 8} y={y + 34} fontSize={11.5} fill={textColor} opacity={0.85}>
          {compact(value)}
        </text>
      )}
    </g>
  );
}

export default function RegionsSection({
  filters, onPick,
}: {
  filters: Filters;
  onPick: (r: string) => void;
}) {
  const [data, setData] = useState<RegionRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    getTopRegions()
      .then((rows) => { setData(rows); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') return null;
  if (status === 'error') return <ErrorState />;

  const all = data.reduce((s, r) => s + r.total, 0);
  const top = data[0];
  const pct = top && all ? Math.round((top.total / all) * 100) : 0;
  const marked = filters.region ?? top?.region;

  // The title names the largest region. This adds the top three together
  // and the smallest region. PSO is not a region, so it is left out of
  // the smallest.
  const regionsOnly = data.filter((r) => r.region !== 'PSO');
  const small = regionsOnly.reduce((a, b) => (b.total < a.total ? b : a), regionsOnly[0]);
  const top3Share = all ? (data.slice(0, 3).reduce((s, r) => s + r.total, 0) / all) * 100 : 0;
  const finding = data.length >= 4 && small
    ? `The three largest regions hold ${shareText(top3Share)} of learners. ${small.region} is the smallest region at ${compact(small.total)}.`
    : undefined;

  // The treemap reads plain name and size fields, largest first.
  const tiles = data.map((r) => ({ name: r.region, size: r.total }));

  return (
    <Card
      finding={finding}
      title={top ? `${top.region} has the most learners, ${pct}% of the country` : 'Enrollment by region'}
      subtitle="Tile size shows how many learners. Click a tile to filter the whole dashboard to that region. Hover a small tile to see its name."
    >
      <div style={{ height: CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={tiles}
            dataKey="size"
            nameKey="name"
            nodeGap={3}
            isAnimationActive={false}
            content={(node) => <Tile node={node} marked={marked} onPick={onPick} />}
          >
            {/* Shows the region name first, then its learners. */}
            <Tooltip
              separator=", "
              formatter={(v, n) => [`${Number(v).toLocaleString()} learners`, String(n)]}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}