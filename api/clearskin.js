export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symptom } = req.body;

  if (!symptom || symptom.trim().length < 3) {
    return res.status(400).json({ error: 'Please describe your symptom' });
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
      system: `You are ClearSkin AI, a skin health education tool. When a user describes a skin symptom, you explain the reason behind skin symptoms, how to fix them, and how to change things in your everyday life to improve skin health.

Always structure your response in exactly three sections:
1. Possible Reasons — explain what might be causing this
2. How to Help It — over the counter or at-home remedies
3. Lifestyle Changes — everyday habits to prevent recurrence

Your tone should be informative yet kind. Never make people feel judged or self-conscious about their skin.

Always end with a brief disclaimer that this is NOT medical advice and is for educational purposes only, and mention when someone should see a real dermatologist.

Never be overly judgmental — kindly inform instead.`,
      messages: [{ role: 'user', content: `I have this skin concern: ${symptom}` }]
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || 'No response returned.';
  return res.status(200).json({ result: text });
}
