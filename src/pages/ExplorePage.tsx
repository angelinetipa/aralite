// src/pages/ExplorePage.tsx
// The tools, kept away from the argument.
//
// The dashboard makes one claim and supports it. These two features do
// something different: they let a visitor go and check something of
// their own — look up their school, or ask a question the dashboard
// never anticipated. Mixed into the dashboard they competed with the
// finding for attention; on their own page they are the point.
//
// Public on purpose, not behind /admin. Admin manages the dataset;
// these are for anyone reading.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDB } from '../lib/db';
import { colors } from '../constants/theme';
import NavHeader from '../components/NavHeader';
import Spinner from '../components/Spinner';
import FinderSection from '../components/FinderSection';
import AskSection from '../components/AskSection';
import DataNote from '../components/DataNote';

export default function ExplorePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getDB().then(() => setReady(true)).catch(() => setReady(true));
  }, []);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 2rem', color: colors.ink }}>
      <NavHeader />

      <div style={{ marginTop: '1.5rem', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>Explore the data yourself</h2>
        <p style={{ color: colors.inkSoft, fontSize: 14.5, lineHeight: 1.65, margin: 0, maxWidth: '64ch' }}>
          The{' '}
          <Link to="/" style={{ color: colors.blue, fontWeight: 600 }}>dashboard</Link>{' '}
          makes one argument about senior-high strand availability. This page makes none — it is
          for looking up a specific school, or asking something the dashboard was never built to
          answer. Same data, same SQL engine, running in your browser.
        </p>
      </div>

      {!ready && <Spinner />}

      <div style={{ display: ready ? 'block' : 'none' }}>
        <FinderSection />
        <AskSection />
        <DataNote />
      </div>

      <p style={{ color: colors.inkSoft, fontSize: 12, textAlign: 'center', margin: '8px 0 24px' }}>
        Data: DepEd Learner Information System, SY 2023–2024 · Built with DuckDB-WASM + React
      </p>
    </div>
  );
}