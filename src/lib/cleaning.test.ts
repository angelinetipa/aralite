// src/lib/cleaning.test.ts
// Tests for the cleaning rules. Pure functions = easy to test and the
// highest-value thing to lock down (they enforce the prof's rules).

import { describe, it, expect } from 'vitest';
import { cleanTable, looksLikeDepEd, toCSV } from './cleaning';

describe('cleanTable', () => {
  it('repairs mojibake (Ã‘ -> Ñ)', () => {
    // Build the broken string from bytes so the test file's own encoding
    // can't distort it: these bytes are "Ñ" (U+00D1) misread as Latin-1.
    const broken = 'SABA' + String.fromCharCode(0xc3, 0x91) + 'GAN';
    const { cleaned, report } = cleanTable([{ Region: broken }]);
    expect(cleaned[0].Region).toBe('SABAÑGAN');
    expect(report.mojibakeFixed).toBe(1);
  });

  it('strips leading junk characters', () => {
    const { cleaned, report } = cleanTable([{ Barangay: '-Brgy. 20' }]);
    expect(cleaned[0].Barangay).toBe('Brgy. 20');
    expect(report.junkStripped).toBe(1);
  });

  it('collapses double spaces', () => {
    const { cleaned } = cleanTable([{ Name: 'Bacarra  I' }]);
    expect(cleaned[0].Name).toBe('Bacarra I');
  });

  it('labels invalid placeholder values', () => {
    const { cleaned, report } = cleanTable([{ Street: 'N/A' }, { Street: 'NONE' }]);
    expect(cleaned[0].Street).toBe('Not Provided');
    expect(cleaned[1].Street).toBe('Not Provided');
    expect(report.invalidLabeled).toBe(2);
  });

  it('keeps numbers untouched (0 enrollment is real)', () => {
    const { cleaned } = cleanTable([{ 'K Male': 0 }]);
    expect(cleaned[0]['K Male']).toBe(0);
  });

  it('standardizes school name into a new column, keeping the original', () => {
    const { cleaned, report } = cleanTable([{ 'School Name': 'Buyon ES' }]);
    expect(cleaned[0]['School Name']).toBe('Buyon ES');           // original kept
    expect(cleaned[0]['School Name Clean']).toBe('Buyon Elementary School');
    expect(report.namesStandardized).toBe(1);
  });

  it('never drops rows (zero data loss)', () => {
    const input = [{ a: 'x' }, { a: 'N/A' }, { a: '-' }];
    const { cleaned } = cleanTable(input);
    expect(cleaned).toHaveLength(3);
  });
});

describe('looksLikeDepEd', () => {
  it('accepts DepEd-shaped rows', () => {
    expect(looksLikeDepEd([{ Region: 'I', 'BEIS School ID': 1, 'School Name': 'x' }])).toBe(true);
  });
  it('rejects unrelated files', () => {
    expect(looksLikeDepEd([{ foo: 'bar' }])).toBe(false);
  });
});

describe('toCSV', () => {
  it('quotes values containing commas', () => {
    const csv = toCSV([{ name: 'Bacarra, Ilocos' }]);
    expect(csv).toContain('"Bacarra, Ilocos"');
  });
});