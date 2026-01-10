// netlify/functions/create-learner.js
import { neon } from "@netlify/neon";

const sql = neon();

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const {
    name,
    grade,
    school,
    parent_name,
    parent_phone,
    strengths,
    weaknesses,
    career,
  } = JSON.parse(event.body);

  try {
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

    return {
      statusCode: 200,
      body: JSON.stringify(learner),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
