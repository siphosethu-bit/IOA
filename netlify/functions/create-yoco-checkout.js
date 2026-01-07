// netlify/functions/create-yoco-checkout.js

export async function handler(event) {
  try {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    const { amount, description, successUrl, cancelUrl } = JSON.parse(event.body);

    if (!amount) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Amount is required" }),
      };
    }

    // Yoco API request
    const response = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount: amount * 100, // Yoco uses cents
        currency: "ZAR",
        description: description || "Inevitable Online Academy booking",
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Yoco error:", data);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to create checkout" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        checkoutUrl: data.redirectUrl,
      }),
    };
  } catch (err) {
    console.error("Server error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
}
