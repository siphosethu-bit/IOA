import { neon } from "@netlify/neon";

const sql = neon();
const jsonHeaders = { "Content-Type": "application/json" };

const json = (statusCode, body) => ({
  statusCode,
  headers: jsonHeaders,
  body: JSON.stringify(body),
});

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return [];

  const candidates = new Set([digits]);

  if (digits.startsWith("0") && digits.length >= 10) {
    candidates.add(`27${digits.slice(1)}`);
  }

  if (digits.startsWith("27") && digits.length >= 11) {
    candidates.add(`0${digits.slice(2)}`);
  }

  if (digits.startsWith("0027") && digits.length >= 13) {
    candidates.add(`0${digits.slice(4)}`);
    candidates.add(digits.slice(2));
  }

  return Array.from(candidates);
}

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function currentWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  return {
    from: dateKey(monday),
    to: dateKey(friday),
    weekKey: dateKey(monday),
  };
}

async function ensureTables() {
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

  await sql`
    CREATE TABLE IF NOT EXISTS learner_payments (
      id SERIAL PRIMARY KEY,
      learner_id TEXT NOT NULL,
      month_key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'not_paid',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE learner_payments
    ALTER COLUMN learner_id TYPE TEXT
    USING learner_id::text
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS learner_payments_unique_month
    ON learner_payments (learner_id, month_key)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS dashboard_focus (
      id SERIAL PRIMARY KEY,
      week_key TEXT NOT NULL UNIQUE,
      focus_topics TEXT NOT NULL DEFAULT '',
      lesson_plan TEXT NOT NULL DEFAULT '',
      tutor_notes TEXT NOT NULL DEFAULT '',
      weekly_goals TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function handler(event) {
  if (!["GET", "POST"].includes(event.httpMethod)) {
    return json(405, { error: "Method Not Allowed" });
  }

  try {
    await ensureTables();

    const body =
      event.httpMethod === "POST" ? JSON.parse(event.body || "{}") : {};
    const params = new URLSearchParams(event.rawQuery || "");
    const phone = body.phone || params.get("phone");
    const phoneCandidates = normalizePhone(phone);

    if (!phoneCandidates.length) {
      return json(400, { error: "A parent phone number is required." });
    }

    const learners = await sql`
      SELECT
        id::text AS id,
        name,
        grade::text AS grade,
        school,
        parent_name,
        parent_phone,
        strengths,
        weaknesses,
        career
      FROM learners
      WHERE regexp_replace(COALESCE(parent_phone, ''), '[^0-9]', '', 'g') = ANY(${phoneCandidates})
      ORDER BY name ASC
    `;

    if (!learners.length) {
      return json(200, { learners: [] });
    }

    const ids = learners.map((learner) => String(learner.id));
    const { from, to, weekKey } = currentWeekRange();
    const monthKey = currentMonthKey();

    const [marks, attendance, payments, focusRows] = await Promise.all([
      sql`
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
        WHERE learner_id = ANY(${ids})
        ORDER BY assessment_date DESC, updated_at DESC
      `,
      sql`
        SELECT
          id,
          learner_id,
          attendance_date::text AS attendance_date,
          status,
          notes,
          updated_at
        FROM learner_attendance
        WHERE learner_id = ANY(${ids})
          AND attendance_date BETWEEN ${from}::date AND ${to}::date
        ORDER BY attendance_date DESC
      `,
      sql`
        SELECT id, learner_id, month_key, status, updated_at
        FROM learner_payments
        WHERE learner_id = ANY(${ids})
          AND month_key = ${monthKey}
      `,
      sql`
        SELECT week_key, focus_topics, lesson_plan, tutor_notes, weekly_goals, updated_at
        FROM dashboard_focus
        WHERE week_key = ${weekKey}
        LIMIT 1
      `,
    ]);

    const focus = focusRows[0] || null;

    const enrichedLearners = learners.map((learner) => ({
      ...learner,
      marks: marks.filter((mark) => mark.learner_id === learner.id),
      attendance: attendance.filter((item) => item.learner_id === learner.id),
      payment:
        payments.find((payment) => payment.learner_id === learner.id) || null,
      focus,
    }));

    return json(200, { learners: enrichedLearners });
  } catch (error) {
    return json(500, { error: error.message });
  }
}
