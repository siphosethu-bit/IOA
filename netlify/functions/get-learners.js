import { neon } from "@netlify/neon";

const sql = neon();

export async function handler() {
  try {
    const learners = await sql`
      SELECT * FROM learners
      ORDER BY created_at DESC
    `;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(learners),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
