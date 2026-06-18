// netlify/functions/create-learner.js
import { neon } from "@netlify/neon";

const sql = neon();
const jsonHeaders = { "Content-Type": "application/json" };

const json = (statusCode, body) => ({
  statusCode,
  headers: jsonHeaders,
  body: JSON.stringify(body),
});

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method Not Allowed" });
  }

  try {
    const {
      name,
      grade,
      school,
      parent_name,
      parent_phone,
      strengths,
      weaknesses,
      career,
    } = JSON.parse(event.body || "{}");

    if (!name || !grade || !parent_phone) {
      return json(400, {
        error: "Learner name, grade, and parent phone number are required",
      });
    }

    const [learner] = await sql`
      INSERT INTO learners (
        name, grade, school,
        parent_name, parent_phone,
        strengths, weaknesses, career
      )
      VALUES (
        ${name}, ${grade}, ${school},
        ${parent_name}, ${parent_phone},
        ${strengths}, ${weaknesses}, ${career}
      )
      RETURNING *
    `;

    return json(200, learner);
  } catch (error) {
    return json(500, { error: error.message });
  }
}
