import { neon } from "@netlify/neon";

const sql = neon();
const jsonHeaders = { "Content-Type": "application/json" };

export async function handler() {
  try {
    const learners = await sql`
      SELECT * FROM learners
      ORDER BY created_at DESC
    `;

    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify(learners),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
