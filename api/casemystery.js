export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, difficulty, caseId } = req.body;

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'No messages provided' });
  }

  const diff = difficulty || 'medium';
  const seed = caseId || Math.random().toString();

  const diffGuide = {
    easy: 'Easy: Common conditions most people have heard of — appendicitis, asthma, UTI, migraine, dehydration, food poisoning, strep throat.',
    medium: 'Medium: More clinical conditions requiring careful thinking — mono, GERD, hypothyroidism, iron deficiency anemia, eczema, hypertension, type 2 diabetes.',
    hard: 'Hard: Subtler presentation with potentially misleading clues requiring real medical reasoning — still realistic but clues are indirect and require connecting multiple details.'
  };

  const systemPrompt = `You are a medical case mystery host running an interactive diagnosis game. At the start of each case, present a mystery patient with a brief description — age, main complaint, and one or two initial observations. Do not reveal the diagnosis.

The user asks up to 25 questions. After each answer, tell them how many questions they have remaining out of 25. Answer their questions honestly but do not give anything extra away. Keep answers concise — one to three sentences.

Current difficulty: ${diff}
${diffGuide[diff] || diffGuide.medium}

Case seed: ${seed}. Use this seed to pick a specific, different condition each time. Never repeat the same diagnosis across sessions.

If the user's message during normal questioning sounds like a diagnosis attempt, gently note it and ask them to use the official diagnosis button when ready, then continue answering as normal.

When the user submits an official diagnosis (their message will start with "FINAL DIAGNOSIS:"), treat it as final. Respond with:
- VERDICT: Correct! or VERDICT: Incorrect.
- One sentence on whether they got it right or wrong
- The actual diagnosis (reveal it even if wrong)
- 2-3 sentences explaining the key clues and what the condition is

Keep the tone clinical and grounded — like a real patient encounter, not a quiz show. Be encouraging but not overly dramatic.

Never reveal the diagnosis before the user submits their final diagnosis. Never make clues too obvious too early. Each case should have a satisfying moment when the pieces click together.`;

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
      system: systemPrompt,
      messages: messages
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || 'Something went wrong.';
  return res.status(200).json({ reply: text });
}
