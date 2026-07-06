// src/lib/db.ts
// The data layer. UI never talks to DuckDB directly — it calls these
// functions. (Component -> hook -> this file, same rule as Fyropy.)
//
// DuckDB-WASM runs a real SQL database INSIDE the browser. No server,
// no Supabase, no limits. We load the parquet files once, then every
// chart is just a SQL query against them.

import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;

// Boot DuckDB once and register our two parquet files as SQL tables.
// We cache the instance so repeated calls are instant.
export async function getDB(): Promise<duckdb.AsyncDuckDB> {
  if (db) return db;

  // duckdb-wasm ships a few builds; this picks the right one for the browser.
  const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());
  // Browsers block loading a Worker script straight from a CDN (CORS).
  // Wrap the CDN URL in a local blob so it counts as same-origin.
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], {
      type: 'text/javascript',
    })
  );
  const worker = new Worker(workerUrl);
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  // Point DuckDB at the parquet files served from /public/data.
  // "read_parquet" streams them — we don't load everything into memory.
  const base = window.location.origin;
  const conn = await db.connect();
  await conn.query(`
    CREATE VIEW enrollment AS
      SELECT * FROM read_parquet('${base}/data/enrollment.parquet');
    CREATE VIEW schools AS
      SELECT * FROM read_parquet('${base}/data/schools.parquet');
  `);
  await conn.close();
  return db;
}

// Run any SQL and get back plain JS objects for charts.
export async function query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const database = await getDB();
  const conn = await database.connect();
  try {
    const result = await conn.query(sql);
    return result.toArray().map((row) => row.toJSON() as T);
  } finally {
    await conn.close();
  }
}