import { neon } from "@netlify/neon";

const sql = neon();
const jsonHeaders = { "Content-Type": "application/json" };

const json = (statusCode, body) => ({
  statusCode,
  headers: jsonHeaders,
  body: JSON.stringify(body),
});

async function ensurePaymentsTable() {
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
}

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method Not Allowed" });
  }

  try {
    await ensurePaymentsTable();

    const params = new URLSearchParams(event.rawQuery || "");
    const monthKey = params.get("monthKey");

    if (!monthKey) {
      return json(400, { error: "monthKey query parameter is required" });
    }

    const payments = await sql`
      SELECT id, learner_id, month_key, status, updated_at
      FROM learner_payments
      WHERE month_key = ${monthKey}
      ORDER BY updated_at DESC
    `;

    return json(200, payments);
  } catch (error) {
    return json(500, { error: error.message });
  }
}
