export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ingredients, image, mimeType } = req.body;

  if (!ingredients && !image) {
    return res.status(400).json({ error: 'Please paste ingredients or upload a photo' });
  }

  const userContent = image
    ? [
        { type: 'image', source: { type: 'base64', media_type: mimeType || 'image/jpeg', data: image } },
        { type: 'text', text: 'Please read the ingredient list from this image and analyze the skincare ingredients.' }
      ]
    : `Please analyze these skincare ingredients:\n\n${ingredients}`;

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
      system: `You are a skincare ingredient analyst. When given a list of skincare product ingredients, you give an overview of the product and advice on it.

Focus only on the notable ingredients — the ones that are meaningfully good or bad for skin. Skip minor filler ingredients.

Always organize your response into exactly three sections:
1. The Good — ingredients that benefit the skin and what they do
2. Watch Out For — any ingredients worth being aware of, explained gently
3. Overall Verdict — a simple rating (Great / Good / Mixed / Skip) with a brief explanation and 2-3 examples of better alternatives if needed

Your tone should be helpful, friendly, and informative — like a knowledgeable friend, not a scary warning label.

If any ingredients are worth avoiding, suggest specific better skincare products the user could try instead and how to use them.

Never exaggerate or alarm the user — keep everything calm and practical.

Always end with a brief disclaimer that this is for educational purposes only and not medical advice.`,
      messages: [{ role: 'user', content: userContent }]
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || 'No response returned.';
  return res.status(200).json({ result: text });
}
