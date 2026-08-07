// src/lib/db.ts
// The data layer. UI never talks to DuckDB directly — it calls these
// functions. DuckDB-WASM runs a real SQL database INSIDE the browser:
// no server, no Supabase, no limits.
//
// Two data sources feed the same `schools` + `enrollment` views:
//   1. the shipped parquet files (default)
//   2. a dataset the user uploads (reshaped here with SQL)
// Charts never know the difference — they just query the views.

import * as duckdb from '@duckdb/duckdb-wasm';

// Cache the boot PROMISE, not just the instance. If many charts load at
// once they all await the SAME boot instead of each starting a worker
// (which froze the browser before).
let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;

async function boot(): Promise<duckdb.AsyncDuckDB> {
  const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());
  // Browsers block loading a Worker straight from a CDN (CORS). Wrap the
  // CDN URL in a local blob so it counts as same-origin.
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' })
  );
  const worker = new Worker(workerUrl);
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
  const database = new duckdb.AsyncDuckDB(logger, worker);
  await database.instantiate(bundle.mainModule, bundle.pthreadWorker);
  return database;
}

export async function getDB(): Promise<duckdb.AsyncDuckDB> {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    const database = await boot();
    // Default source: the parquet files served from /public/data.
    const base = window.location.origin;
    const conn = await database.connect();
    await conn.query(`
      CREATE OR REPLACE VIEW schools AS
        SELECT * FROM read_parquet('${base}/data/schools.parquet');
      CREATE OR REPLACE VIEW enrollment AS
        SELECT * FROM read_parquet('${base}/data/enrollment.parquet');
    `);
    await conn.close();
    return database;
  })();
  return dbPromise;
}

// Run any SQL, get plain JS objects back for charts.
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

// Quote a column name safely for SQL.
function q(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

// ---------------------------------------------------------------------
// LOAD AN UPLOADED DATASET
// We register the cleaned CSV as a virtual file, read it into a wide
// table, then reshape wide -> long IN SQL. DuckDB expands the millions
// of rows internally (fast, no JS memory blow-up). This mirrors the
// melt + parse steps in pipeline/clean.py — but at query time.
// ---------------------------------------------------------------------
export async function loadUploadedData(
  csvText: string,
  enrollmentCols: string[]
): Promise<void> {
  const database = await getDB();
  const conn = await database.connect();
  try {
    // 1. Register the CSV text as a file DuckDB can read.
    await database.registerFileText('upload.csv', csvText);

    // 2. Read the wide upload into a table (all columns as-is).
    await conn.query(`
      CREATE OR REPLACE TABLE raw_upload AS
        SELECT * FROM read_csv_auto('upload.csv', header=true, all_varchar=true);
    `);

    // 3. schools view = every uploaded column, PLUS a calculated
    //    "Total Enrollment".
    //    The raw DepEd file does not ship that column — clean.py adds it
    //    by summing the grade columns. We must do the same here, or every
    //    chart that asks for it fails and renders nothing.
    //    Everything arrives as text (all_varchar), so each value is cast
    //    before adding; anything unparseable counts as 0.
    const totalExpr =
      enrollmentCols.length > 0
        ? enrollmentCols.map((c) => `COALESCE(TRY_CAST(${q(c)} AS BIGINT), 0)`).join(' + ')
        : '0';

    // If the upload already carries a "Total Enrollment" column it is
    // text, which cannot be summed — so drop it and use ours instead.
    const described = await conn.query(`DESCRIBE raw_upload;`);
    const existing = described
      .toArray()
      .map((r) => String((r.toJSON() as { column_name: string }).column_name));
    const keep = existing.includes('Total Enrollment')
      ? `* EXCLUDE ("Total Enrollment")`
      : `*`;

    await conn.query(`
      CREATE OR REPLACE VIEW schools AS
        SELECT ${keep}, (${totalExpr}) AS "Total Enrollment"
        FROM raw_upload;
    `);

    // 4. enrollment view = UNPIVOT the enrollment columns into long form,
    //    then parse each column name into grade / strand / gender —
    //    the same logic as the Python parser.
    const colList = enrollmentCols.map(q).join(', ');
    // strip the trailing " Male"/" Female" to get the "rest" once.
    const rest = `regexp_replace(col, ' (Male|Female)$', '')`;
    await conn.query(`
      CREATE OR REPLACE VIEW enrollment AS
      SELECT
        "BEIS School ID",
        TRY_CAST(value AS BIGINT) AS enrollment,          -- bad/empty -> NULL
        CASE WHEN col LIKE '% Male' THEN 'Male' ELSE 'Female' END AS gender,
        CASE
          WHEN ${rest} IN ('Elem NG', 'JHS NG') THEN ${rest}   -- non-graded stays whole
          ELSE split_part(${rest}, ' ', 1)                     -- else first token = grade
        END AS grade,
        CASE
          WHEN ${rest} IN ('Elem NG', 'JHS NG') THEN NULL
          WHEN position(' ' IN ${rest}) = 0 THEN NULL          -- no strand
          ELSE substr(${rest}, position(' ' IN ${rest}) + 1)   -- rest = strand
        END AS strand
      FROM (
        UNPIVOT (SELECT "BEIS School ID", ${colList} FROM raw_upload)
        ON ${colList}
        INTO NAME col VALUE value
      )
      WHERE TRY_CAST(value AS BIGINT) IS NOT NULL;             -- drop non-numeric rows
    `);
  } finally {
    await conn.close();
  }
}

// Switch back to the shipped parquet data.
export async function resetToDefault(): Promise<void> {
  const database = await getDB();
  const base = window.location.origin;
  const conn = await database.connect();
  try {
    await conn.query(`
      CREATE OR REPLACE VIEW schools AS
        SELECT * FROM read_parquet('${base}/data/schools.parquet');
      CREATE OR REPLACE VIEW enrollment AS
        SELECT * FROM read_parquet('${base}/data/enrollment.parquet');
    `);
  } finally {
    await conn.close();
  }
}