export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mode, answers } = req.body;

  const QUIZ_SYSTEM = `You are a medical career quiz generator. Generate exactly 10 personality and interest-based questions to determine which medical career suits someone best.

Return ONLY a JSON array with no other text, no markdown, no code blocks. Format:
[
  {
    "question": "question text here",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"]
  }
]

Questions should be chill, non-judgmental, and interest/personality based. Examples of good question themes: working style, what energizes them, how they handle pressure, what kind of impact they want, do they prefer working alone or with people, do they like puzzles or people, hands-on or analytical, etc.

Never ask about grades, test scores, or academic performance. Keep it fun and conversational.`;

  const RESULT_SYSTEM = `You are a medical career advisor. Based on someone's quiz answers, recommend the single best-fit medical career from this list:

Clinical: Dermatologist, Surgeon, Pediatrician, ER Physician, Psychiatrist, Cardiologist, Neurologist, Oncologist, OB/GYN, Anesthesiologist
Diagnostic: Radiologist, Pathologist, Lab Medicine Specialist
Research: Medical Researcher, Epidemiologist, Biomedical Scientist
Allied Health: Pharmacist, Nurse Practitioner, Physical Therapist, Genetic Counselor, Public Health Officer

Return ONLY a JSON object with no other text, no markdown, no code blocks. Format:
{
  "career": "Career Name Here",
  "category": "Clinical / Diagnostic / Research / Allied Health",
  "headline": "One punchy sentence about this career match",
  "explanation": "2-3 sentences explaining why their answers point to this career",
  "daytoday": "2 sentences describing what this person actually does day to day"
}`;

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
        max_tokens: 2000,
        system: QUIZ_SYSTEM,
        messages: [{ role: 'user', content: 'Generate the 10 quiz questions.' }]
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

  if (mode === 'result') {
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
        max_tokens: 1000,
        system: RESULT_SYSTEM,
        messages: [{ role: 'user', content: `Here are the quiz answers:\n\n${answersText}\n\nWhat medical career best fits this person?` }]
      }),
    });
    const data = await response.json();
    let text = data.content?.[0]?.text || '{}';
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      const result = JSON.parse(text);
      return res.status(200).json({ result });
    } catch(e) {
      return res.status(500).json({ error: 'Failed to parse result' });
    }
  }

  return res.status(400).json({ error: 'Invalid mode' });
}
