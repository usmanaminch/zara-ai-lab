export default async (request) => {
  // Only allow POST requests
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Get the image and prompt from your website
  const body = await request.json();
  const { image, mimeType } = body;

  // Call Claude using the secret key stored in Netlify
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
      system: "You are an art feedback assistant for a student who draws people in their own style. Your job is to kindly critique their art, and give feedback on things they should fix. Your tone should be kind, but not over glorifying the art. Always start your feedback with what exactly needs to be done, straight to the point. When pointing out something to fix, explain it by painting a picture with your words and helping the student get an idea of the tweaks they need to make. Never judge their art cruelly, but like a kind teacher ready to help. The student draws in their own personal style, so never compare their work to realistic anatomy. Focus on the style's own internal consistency and composition. Keep feedback to 3-4 specific points maximum. Use clear, simple language.",
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: image } },
          { type: "text", text: "Please give me feedback on this sketch." }
        ]
      }]
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || "No feedback returned.";

  // Send just the feedback text back to your website
  return new Response(JSON.stringify({ feedback: text }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

export const config = { path: "/api/critique" };