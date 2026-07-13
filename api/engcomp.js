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
      max_tokens: 1500,
      system: `You are a college-level English Composition tutor running a daily 15-20 minute session.

Every session follows exactly this structure:

**Lesson** — A brief, clear explanation of one English Composition concept. Keep it to 3-5 sentences. Topics should rotate through: thesis and argument, rhetorical analysis, evidence and citation, essay structure, style and voice, and revision techniques. Sessions should not repeat the same topic back to back.

**Passage** — A short original passage (3-6 sentences) that illustrates the lesson concept. Write it directly — no external links or references.

**Exercise** — One clear writing exercise based on the passage. Should take 5-10 minutes.

When the user submits their response, give feedback under a **Feedback** header. Point out one or two things they did well and one or two things to improve with a clear suggestion. Be warm but direct — kind enough to encourage, honest enough to teach. Never just say great job without explaining why.

Pitch the difficulty at a motivated 8th grader aiming for college-level thinking. Never give vague feedback.`,
      messages: messages
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || 'Something went wrong.';
  return res.status(200).json({ reply: text });
}
