export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    const { amount, description, successUrl, cancelUrl } = JSON.parse(event.body || "{}");

    if (amount == null || !successUrl || !cancelUrl) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing required fields (amount, successUrl, cancelUrl)" }),
      };
    }

    const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;
    if (!YOCO_SECRET_KEY) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "YOCO_SECRET_KEY not set" }),
      };
    }

    const amountInCents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: `Invalid amount: ${amount}` }),
      };
    }

    const response = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${YOCO_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency: "ZAR",
        description: description || "Inevitable Online Academy payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    });

    const data = await response.json();

    // If Yoco returns an error, pass it straight back to the browser
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Yoco checkout creation failed",
          yoco: data,
        }),
      };
    }

    // ✅ Yoco URL field might differ — accept all common variants
    const checkoutUrl =
      data.redirect_url ||
      data.url ||
      data.redirectUrl ||
      data.redirectURL ||
      data.redirect;

    if (!checkoutUrl) {
      // Return the full Yoco payload so we can see what it actually contains
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "No checkout URL returned from Yoco",
          yoco: data,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkoutUrl }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message }),
    };
  }
}
