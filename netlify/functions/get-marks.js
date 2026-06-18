import { neon } from "@netlify/neon";

const sql = neon();
const jsonHeaders = { "Content-Type": "application/json" };

const json = (statusCode, body) => ({
  statusCode,
  headers: jsonHeaders,
  body: JSON.stringify(body),
});

const parseInteger = (value, fallback = 1) => {
  const number = Number(value ?? fallback);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

async function ensureMarksTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS learner_marks (
      id SERIAL PRIMARY KEY,
      learner_id TEXT NOT NULL,
      term INTEGER NOT NULL,
      assessment_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      mark NUMERIC NOT NULL,
      total NUMERIC NOT NULL,
      percentage NUMERIC NOT NULL,
      assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE learner_marks
    ALTER COLUMN learner_id TYPE TEXT
    USING learner_id::text
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS learner_marks_unique_assessment
    ON learner_marks (learner_id, term, assessment_name, subject)
  `;
}

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method Not Allowed" });
  }

  try {
    await ensureMarksTable();

    const params = new URLSearchParams(event.rawQuery || "");
    const term = parseInteger(params.get("term"), 1);

    const marks = await sql`
      SELECT
        id,
        learner_id,
        term,
        assessment_name,
        subject,
        mark::float AS mark,
        total::float AS total,
        percentage::float AS percentage,
        assessment_date::text AS assessment_date,
        updated_at
      FROM learner_marks
      WHERE term = ${term}
      ORDER BY assessment_date DESC, assessment_name ASC, subject ASC
    `;

    return json(200, marks);
  } catch (error) {
    return json(500, { error: error.message });
  }
}
