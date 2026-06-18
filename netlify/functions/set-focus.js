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
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method Not Allowed" });
  }

  try {
    await ensureFocusTable();

    const {
      weekKey,
      focusTopics = "",
      lessonPlan = "",
      tutorNotes = "",
      weeklyGoals = "",
    } = JSON.parse(event.body || "{}");

    if (!weekKey) {
      return json(400, { error: "weekKey is required" });
    }

    const [focus] = await sql`
      INSERT INTO dashboard_focus (
        week_key,
        focus_topics,
        lesson_plan,
        tutor_notes,
        weekly_goals,
        updated_at
      )
      VALUES (
        ${weekKey},
        ${focusTopics},
        ${lessonPlan},
        ${tutorNotes},
        ${weeklyGoals},
        NOW()
      )
      ON CONFLICT (week_key)
      DO UPDATE SET
        focus_topics = EXCLUDED.focus_topics,
        lesson_plan = EXCLUDED.lesson_plan,
        tutor_notes = EXCLUDED.tutor_notes,
        weekly_goals = EXCLUDED.weekly_goals,
        updated_at = NOW()
      RETURNING id, week_key, focus_topics, lesson_plan, tutor_notes, weekly_goals, updated_at
    `;

    return json(200, focus);
  } catch (error) {
    return json(500, { error: error.message });
  }
}
