import { neon } from "@netlify/neon";

const sql = neon();
const jsonHeaders = { "Content-Type": "application/json" };

const json = (statusCode, body) => ({
  statusCode,
  headers: jsonHeaders,
  body: JSON.stringify(body),
});

async function ensureAttendanceTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS learner_attendance (
      id SERIAL PRIMARY KEY,
      learner_id TEXT NOT NULL,
      attendance_date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'absent',
      notes TEXT DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE learner_attendance
    ALTER COLUMN learner_id TYPE TEXT
    USING learner_id::text
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS learner_attendance_unique_day
    ON learner_attendance (learner_id, attendance_date)
  `;
}

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method Not Allowed" });
  }

  try {
    await ensureAttendanceTable();

    const params = new URLSearchParams(event.rawQuery || "");
    const from = params.get("from");
    const to = params.get("to");

    if (!from || !to) {
      return json(400, { error: "from and to query parameters are required" });
    }

    const rows = await sql`
      SELECT
        id,
        learner_id,
        attendance_date::text AS attendance_date,
        status,
        notes,
        updated_at
      FROM learner_attendance
      WHERE attendance_date BETWEEN ${from}::date AND ${to}::date
      ORDER BY attendance_date ASC, learner_id ASC
    `;

    return json(200, rows);
  } catch (error) {
    return json(500, { error: error.message });
  }
}
