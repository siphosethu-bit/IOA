import { neon } from "@netlify/neon";

const sql = neon();
const jsonHeaders = { "Content-Type": "application/json" };

const json = (statusCode, body) => ({
  statusCode,
  headers: jsonHeaders,
  body: JSON.stringify(body),
});

const parseLearnerId = (value) => {
  const id = String(value ?? "").trim();
  return id ? id : null;
};

const parseInteger = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
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
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method Not Allowed" });
  }

  try {
    await ensureMarksTable();

    const {
      learnerId,
      term,
      assessmentName,
      subject,
      mark,
      total,
      assessmentDate,
    } = JSON.parse(event.body || "{}");

    const learnerIdValue = parseLearnerId(learnerId);
    const termNumber = parseInteger(term);
    const numericMark = Number(mark);
    const numericTotal = Number(total);
    const percentage =
      numericTotal > 0 ? Math.round((numericMark / numericTotal) * 1000) / 10 : 0;

    if (
      !learnerIdValue ||
      !termNumber ||
      !assessmentName ||
      !subject ||
      !Number.isFinite(numericMark) ||
      !Number.isFinite(numericTotal) ||
      numericMark < 0 ||
      numericTotal <= 0 ||
      numericMark > numericTotal
    ) {
      return json(400, {
        error:
          "learnerId, term, assessmentName, subject, mark, and total are required",
      });
    }

    const [row] = await sql`
      INSERT INTO learner_marks (
        learner_id,
        term,
        assessment_name,
        subject,
        mark,
        total,
        percentage,
        assessment_date,
        updated_at
      )
      VALUES (
        ${learnerIdValue},
        ${termNumber},
        ${assessmentName},
        ${subject},
        ${numericMark},
        ${numericTotal},
        ${percentage},
        ${assessmentDate || new Date().toISOString().slice(0, 10)}::date,
        NOW()
      )
      ON CONFLICT (learner_id, term, assessment_name, subject)
      DO UPDATE SET
        mark = EXCLUDED.mark,
        total = EXCLUDED.total,
        percentage = EXCLUDED.percentage,
        assessment_date = EXCLUDED.assessment_date,
        updated_at = NOW()
      RETURNING
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
    `;

    return json(200, row);
  } catch (error) {
    return json(500, { error: error.message });
  }
}
