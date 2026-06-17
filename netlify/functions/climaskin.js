export default async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await request.json();
  const { messages } = body;

  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages provided" }), { status: 400 });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: `You are ClimaSkin, a skincare advisor that helps people care for their skin in different climates and environments. Your tone should be kind, friendly, and informative.

At the start of a conversation, gather information by asking one question at a time — skin type, destination, and time of year or season. Don't ask everything at once.

Structure your advice around simple, practical skincare that helps the user keep their skin healthy in that climate. Only recommend products available at a regular drugstore — nothing obscure or hard to find.

Always end your responses with a brief disclaimer that this is for educational purposes only and is not medical advice from a dermatologist.

Never suggest complicated routines or products the average person wouldn't have at home.`,
      messages: messages
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || "Sorry, I couldn't generate a response.";

  return new Response(JSON.stringify({ reply: text }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

export const config = { path: "/api/climaskin" };
