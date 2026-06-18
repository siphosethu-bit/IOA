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

const allowedStatuses = new Set(["present", "absent", "late", "excused"]);

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
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method Not Allowed" });
  }

  try {
    await ensureAttendanceTable();

    const { learnerId, date, status, notes = "" } = JSON.parse(event.body || "{}");
    const learnerIdValue = parseLearnerId(learnerId);
    const normalizedStatus = String(status || "").toLowerCase();

    if (!learnerIdValue || !date || !allowedStatuses.has(normalizedStatus)) {
      return json(400, {
        error: "learnerId, date, and a valid status are required",
      });
    }

    const [row] = await sql`
      INSERT INTO learner_attendance (
        learner_id,
        attendance_date,
        status,
        notes,
        updated_at
      )
      VALUES (
        ${learnerIdValue},
        ${date}::date,
        ${normalizedStatus},
        ${notes},
        NOW()
      )
      ON CONFLICT (learner_id, attendance_date)
      DO UPDATE SET
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING
        id,
        learner_id,
        attendance_date::text AS attendance_date,
        status,
        notes,
        updated_at
    `;

    return json(200, row);
  } catch (error) {
    return json(500, { error: error.message });
  }
}
