// src/lib/ai.ts
// "Ask the data" — turns a plain-English question into SQL using the
// user's OWN API key (BYOK: bring your own key). We support Groq and
// Gemini. The key stays in the browser and is never sent to us.
//
// SAFETY: we only ever run read-only SELECT queries. Anything else is
// blocked before it can touch the database.

export type Provider = 'groq' | 'gemini';

// The database shape we tell the AI about, so it writes correct SQL.
// Two tables: schools (one row per school) and enrollment (long form).
const SCHEMA = `
You write DuckDB SQL for a Philippine school-enrollment database.

Table "schools" (one row per school):
  "Region", "Division", "District", "BEIS School ID", "School Name",
  "Province", "Municipality", "Barangay", "Sector" (Public/Private/SUCsLUCs/PSO),
  "School Type", "Total Enrollment"

Table "enrollment" (one row per school-grade-strand-gender):
  "BEIS School ID", enrollment (number), grade, strand, gender

  grade values: 'K','G1'..'G12','Elem NG','JHS NG'
  strand values (senior high only): 'ACAD STEM','ACAD - ABM','ACAD - HUMSS',
    'ACAD GAS','ACAD PBM','TVL','SPORTS','ARTS' (NULL for non-senior-high)
  gender values: 'Male','Female'

Join the tables on "BEIS School ID".
Rules:
- Return ONE SELECT statement only. No comments, no explanation.
- Column names with spaces MUST be in double quotes exactly as written,
  e.g. "BEIS School ID", "School Name", "Total Enrollment".
- NEVER rename columns with underscores. Use the exact names above.
- The join key is "BEIS School ID" in BOTH tables:
  JOIN enrollment e ON s."BEIS School ID" = e."BEIS School ID"
- Always alias sums (e.g. SUM(enrollment) AS total).
- Limit results to 50 rows unless the question implies a single number.
`;

// Ask the chosen provider to convert the question into SQL.
export async function questionToSQL(
  provider: Provider,
  apiKey: string,
  question: string
): Promise<string> {
  const prompt = `${SCHEMA}\nQuestion: ${question}\nSQL:`;

  let text: string;
  if (provider === 'groq') {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
      }),
    });
    if (!res.ok) throw new Error('Groq request failed — check your API key.');
    const data = await res.json();
    text = data.choices?.[0]?.message?.content ?? '';
  } else {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!res.ok) throw new Error('Gemini request failed — check your API key.');
    const data = await res.json();
    text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  return cleanSQL(text);
}

// Strip markdown fences / stray text so we have a bare SQL statement.
function cleanSQL(raw: string): string {
  let s = raw.trim();
  s = s.replace(/```sql/gi, '').replace(/```/g, '').trim();
  // keep from the first SELECT onward
  const i = s.toUpperCase().indexOf('SELECT');
  if (i >= 0) s = s.slice(i);
  // cut at the first semicolon (one statement only)
  const semi = s.indexOf(';');
  if (semi >= 0) s = s.slice(0, semi);
  return s.trim();
}

// SAFETY GATE: allow only a single read-only SELECT. Block any keyword
// that could change data. This runs BEFORE we execute anything.
export function isSafeSelect(sql: string): boolean {
  const up = sql.toUpperCase();
  if (!up.startsWith('SELECT')) return false;
  const banned = [
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE',
    'ATTACH', 'COPY', 'PRAGMA', 'INSTALL', 'LOAD', ';',
  ];
  return !banned.some((word) => up.includes(word));
}