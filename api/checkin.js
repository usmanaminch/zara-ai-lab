export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mode, answers } = req.body;

  const QUESTIONS_SYSTEM = `You are a gentle mental health check-in tool. Generate exactly 5 short multiple choice questions about how someone is feeling today.

Return ONLY a JSON array with no other text, no markdown, no code blocks. Format:
[
  {
    "question": "question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"]
  }
]

Cover these five areas, one per question: mood, energy level, sleep quality, stress level, and connection to others.
Keep questions warm and non-clinical. Options should range from positive to struggling — never use clinical or alarming language.
Example options for mood: "Really good", "Pretty good", "Just okay", "Not great"`;

  const REFLECTION_SYSTEM = `You are a gentle, warm mental health check-in companion. Based on someone's answers to a 5-question check-in, give a short warm reflection.

Acknowledge what they shared. Highlight anything positive. Gently note anything they might want to tend to. Offer one or two simple, evidence-based suggestions (like going outside, a breathing exercise, journaling, or talking to someone they trust).

Keep your reflection under 150 words. Warm and conversational — like a thoughtful friend, not a doctor.

End with exactly this paragraph:
"Remember: this check-in is not a substitute for professional mental health support. If you need to talk to someone, you can call or text 988 (Suicide & Crisis Lifeline) or text HOME to 741741 (Crisis Text Line)."

Never diagnose. Never assign a score or label. Never minimize what someone shared.`;

  if (mode === 'generate') {
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
        system: QUESTIONS_SYSTEM,
        messages: [{ role: 'user', content: 'Generate the 5 check-in questions.' }]
      }),
    });
    const data = await response.json();
    let text = data.content?.[0]?.text || '[]';
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      const questions = JSON.parse(text);
      return res.status(200).json({ questions });
    } catch(e) {
      return res.status(500).json({ error: 'Failed to parse questions' });
    }
  }

  if (mode === 'reflect') {
    const answersText = answers.map((a, i) => `Q${i+1}: ${a.question}\nAnswer: ${a.selected}`).join('\n\n');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: REFLECTION_SYSTEM,
        messages: [{ role: 'user', content: `Here are the check-in answers:\n\n${answersText}\n\nPlease give me a warm reflection.` }]
      }),
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    return res.status(200).json({ reflection: text });
  }

  return res.status(400).json({ error: 'Invalid mode' });
}
