export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mode, type, response: userResponse } = req.body;

  const PROMPT_SYSTEM = `You are a TJHSST admissions coach. Generate one realistic practice prompt for a student preparing for the TJHSST application.

If type is "sps", generate a Student Portrait Sheet prompt — a short essay question that asks the student to demonstrate one of these skills using a real example: critical thinking, problem solving, leadership, collaboration, resilience, or STEM passion. The prompt should be specific and reflective, similar to what TJ actually asks.

If type is "pse", generate a Problem-Solving Essay prompt — a math or science reasoning problem that requires logical thinking, step-by-step work, and a written explanation of the process. Difficulty: 8th grade advanced level.

Return ONLY a JSON object with no other text:
{
  "type": "sps" or "pse",
  "prompt": "the full prompt text here",
  "instructions": "brief instructions for the student on how to approach this"
}`;

  const GRADE_SYSTEM = `You are a TJHSST admissions evaluator. When given a Student Portrait Sheet response or problem-solving essay, you evaluate it the way real TJ admissions staff would — perhaps even slightly stricter — but your goal is to help the student genuinely improve.

For SPS responses, evaluate for: STAR method structure (Situation, Task, Action, Result), evidence of critical thinking and problem-solving, STEM passion shown through specific examples, grammar and writing clarity, and connection to TJ's mission and values.

For Problem-Solving Essays, evaluate for: correct solution, clarity of reasoning and step-by-step explanation, mathematical or scientific accuracy, and quality of written explanation.

Your feedback must include:
1. A score out of 10
2. What the response did well (be specific — quote or reference specific parts)
3. What needs improvement and exactly how to fix it
4. A brief description of what an ideal response to this prompt would look like

Be honest. If a response is weak, say so clearly and directly — but always explain how to fix it. Never give empty praise. The student wants to learn, not feel good.

Format your response with clear bold headers: **Score**, **What You Did Well**, **What To Improve**, **What An Ideal Response Looks Like**`;

  if (mode === 'prompt') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: PROMPT_SYSTEM,
        messages: [{ role: 'user', content: `Generate a ${type} prompt for TJ practice.` }]
      }),
    });
    const data = await response.json();
    let text = data.content?.[0]?.text || '{}';
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      const parsed = JSON.parse(text);
      return res.status(200).json(parsed);
    } catch(e) {
      return res.status(500).json({ error: 'Failed to generate prompt' });
    }
  }

  if (mode === 'grade') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        system: GRADE_SYSTEM,
        messages: [{ role: 'user', content: `Here is the prompt:\n\n${req.body.prompt}\n\nHere is the student's response:\n\n${userResponse}\n\nPlease evaluate this response.` }]
      }),
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || 'Something went wrong.';
    return res.status(200).json({ feedback: text });
  }

  return res.status(400).json({ error: 'Invalid mode' });
}
