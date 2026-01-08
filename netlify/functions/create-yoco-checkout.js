export async function handler(event) {
  try {
    // Only allow POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    // Parse request body
    const { amount, description, successUrl, cancelUrl } = JSON.parse(event.body);

    // Basic validation
    if (!amount || !successUrl || !cancelUrl) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // Load secret key
    const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;
    if (!YOCO_SECRET_KEY) {
      throw new Error("YOCO_SECRET_KEY not set");
    }

    // Convert rands → cents
    const amountInCents = Math.round(Number(amount) * 100);

    // Create Yoco checkout
    const response = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${YOCO_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency: "ZAR",
        description,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    });

    const data = await response.json();

    // Handle Yoco API errors
    if (!response.ok) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      };
    }

    // ✅ SUCCESS RESPONSE (THIS FIXES YOUR ISSUE)
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        checkoutUrl: data.url, // Yoco hosted checkout URL
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: err.message }),
    };
  }
}
