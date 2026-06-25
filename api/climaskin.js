export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'No messages provided' });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: `You are ClimaSkin, a skincare advisor that helps people care for their skin in different climates and environments. Your tone should be kind, friendly, and informative.

At the start of a conversation, gather information by asking one question at a time — skin type, destination, and time of year or season. Do not ask everything at once.

Structure your advice around simple, practical skincare that helps the user keep their skin healthy in that climate. Only recommend products available at a regular drugstore — nothing obscure or hard to find.

Always end your responses with a brief disclaimer that this is for educational purposes only and is not medical advice from a dermatologist.

Never suggest complicated routines or products the average person would not have at home.`,
      messages: messages
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
  return res.status(200).json({ reply: text });
}
