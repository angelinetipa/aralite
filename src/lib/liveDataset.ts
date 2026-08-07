// src/lib/liveDataset.ts
// Remembers which dataset is currently published to the dashboard.
//
// Why not useState? Because React state dies when you navigate away from
// the admin page, so coming back always showed "DEFAULT" even when a
// custom dataset was live. A module variable outlives page changes.
//
// It is deliberately NOT saved to disk. The uploaded data lives in
// DuckDB's memory and disappears on refresh, so this label has to
// disappear at exactly the same moment or it would start lying.

let liveName: string | null = null;

export function getLiveDataset(): string | null {
  return liveName;
}

export function setLiveDataset(name: string | null): void {
  liveName = name;
}