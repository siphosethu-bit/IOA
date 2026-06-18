import { neon } from "@netlify/neon";

const sql = neon();
const jsonHeaders = { "Content-Type": "application/json" };

const json = (statusCode, body) => ({
  statusCode,
  headers: jsonHeaders,
  body: JSON.stringify(body),
});

async function ensureFocusTable() {
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
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method Not Allowed" });
  }

  try {
    await ensureFocusTable();

    const params = new URLSearchParams(event.rawQuery || "");
    const weekKey = params.get("weekKey");

    if (!weekKey) {
      return json(400, { error: "weekKey query parameter is required" });
    }

    const [focus] = await sql`
      SELECT id, week_key, focus_topics, lesson_plan, tutor_notes, weekly_goals, updated_at
      FROM dashboard_focus
      WHERE week_key = ${weekKey}
      LIMIT 1
    `;

    return json(
      200,
      focus || {
        week_key: weekKey,
        focus_topics: "",
        lesson_plan: "",
        tutor_notes: "",
        weekly_goals: "",
      }
    );
  } catch (error) {
    return json(500, { error: error.message });
  }
}
