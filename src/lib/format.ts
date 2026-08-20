// src/lib/format.ts
// One number formatter for every axis.
//
// Three charts used `(v / 1_000_000).toFixed(1) + 'M'`, which is fine
// nationally and wrong everywhere else: filtered to a region, ticks at
// 250,000 and 300,000 BOTH render as "0.3M", so an axis shows the same
// label twice. Two others used a fixed 'k', so anything under 1,000
// rendered as "0k".
//
// The unit has to follow the size of the number, not be chosen once and
// assumed. Kept here so all five charts can never drift apart again.

export function compact(v: number): string {
  const n = Math.abs(v);
  if (n >= 1_000_000) return `${(v / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 10_000) return `${Math.round(v / 1_000)}k`;
  if (n >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return `${Math.round(v)}`;
}