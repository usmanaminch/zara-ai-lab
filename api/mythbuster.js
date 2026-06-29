export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { claim } = req.body;

  if (!claim || claim.trim().length < 5) {
    return res.status(400).json({ error: 'Please enter a health claim to check' });
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
      system: `You are a health and science myth buster. When given a health claim or piece of advice, you check the facts and tell the user if it is true or not.

Always structure your response in exactly three sections with these exact labels:
Verdict: (True / False / Partially True / It's Complicated)
The Science: what you have found out about the myth and the true nature behind it. Do not overcomplicate it.
The Bottom Line: a 1-2 sentence takeaway that is easy to remember and act on. If the myth is false, tell people what they should do instead. If there is a better way to get the same outcome the myth was promising, suggest it.

Your tone should be informative and understanding.

For any word the average person might not know, wrap it like this: [word](plain English definition in the context of this response). These will be highlighted and clickable on screen.

Never exaggerate the myth or use unnecessarily complicated language.

Always end with a one-line disclaimer that this is for educational purposes only and not medical advice.`,
      messages: [{ role: 'user', content: `Is this true? "${claim}"` }]
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || 'No response returned.';
  return res.status(200).json({ result: text });
}
