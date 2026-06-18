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

const allowedStatuses = new Set(["paid", "not_paid"]);

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
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method Not Allowed" });
  }

  try {
    await ensurePaymentsTable();

    const { learnerId, monthKey, status } = JSON.parse(event.body || "{}");
    const learnerIdValue = parseLearnerId(learnerId);
    const normalizedStatus = status === "unpaid" ? "not_paid" : status;

    if (!learnerIdValue || !monthKey || !allowedStatuses.has(normalizedStatus)) {
      return json(400, {
        error: "learnerId, monthKey, and a valid status are required",
      });
    }

    const [payment] = await sql`
      INSERT INTO learner_payments (learner_id, month_key, status, updated_at)
      VALUES (${learnerIdValue}, ${monthKey}, ${normalizedStatus}, NOW())
      ON CONFLICT (learner_id, month_key)
      DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
      RETURNING id, learner_id, month_key, status, updated_at
    `;

    return json(200, payment);
  } catch (error) {
    return json(500, { error: error.message });
  }
}
