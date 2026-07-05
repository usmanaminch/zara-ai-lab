export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, difficulty, caseId, avoidCondition } = req.body;

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'No messages provided' });
  }

  const diff = difficulty || 'medium';
  const seed = caseId || Math.random().toString();

  const easyConditions = [
    'appendicitis', 'asthma attack', 'UTI', 'migraine', 'food poisoning',
    'strep throat', 'dehydration', 'sunstroke', 'allergic reaction', 'pink eye',
    'ear infection', 'acid reflux', 'sprained ankle', 'kidney stones', 'chicken pox'
  ];

  const mediumConditions = [
    'hypothyroidism', 'iron deficiency anemia', 'mono (mononucleosis)', 'GERD',
    'type 2 diabetes', 'hypertension', 'eczema', 'sleep apnea', 'celiac disease',
    'irritable bowel syndrome', 'polycystic ovary syndrome', 'gout', 'shingles',
    'carpal tunnel syndrome', 'vitamin D deficiency', 'peptic ulcer', 'bronchitis',
    'plantar fasciitis', 'rosacea', 'costochondritis'
  ];

  const hardConditions = [
    'Lyme disease', 'lupus', 'multiple sclerosis (early)', 'Crohn\'s disease',
    'endometriosis', 'pancreatitis', 'pulmonary embolism', 'aortic dissection',
    'pericarditis', 'myasthenia gravis', 'Addison\'s disease', 'sarcoidosis',
    'hemochromatosis', 'fibromyalgia', 'giant cell arteritis', 'meningitis',
    'ectopic pregnancy', 'diabetic ketoacidosis', 'hyperthyroidism', 'reactive arthritis'
  ];

  const poolMap = { easy: easyConditions, medium: mediumConditions, hard: hardConditions };
  const pool = poolMap[diff] || mediumConditions;
  const poolList = pool.join(', ');

  const avoidNote = avoidCondition ? `Do NOT use ${avoidCondition} or anything similar.` : '';

  const systemPrompt = `You are a medical case mystery host running an interactive diagnosis game.

CONDITION POOL for ${diff} difficulty — choose ONLY from this list: ${poolList}
${avoidNote}
Use the case seed ${seed} to pick a specific condition from the list above. Pick unpredictably — vary across the full list.

PATIENT VARIETY — randomize these every case:
- Age: vary widely — children (5-15), young adults (18-30), middle-aged (35-55), elderly (60-80)
- Gender: alternate between male, female, and non-binary patients
- Background: vary occupation, lifestyle, and context

At the start of each case, present the mystery patient with: age, gender, main complaint, and 1-2 initial observations. Do not reveal the diagnosis.

The user asks up to 25 questions. After each answer, tell them how many questions they have remaining. Answer honestly but concisely — do not give extra clues beyond what is asked.

If the user's message sounds like a diagnosis attempt during questioning, note it and ask them to use the official diagnosis button, then continue the case.

When the user submits a message starting with "FINAL DIAGNOSIS:", treat it as final and respond with:
- VERDICT: Correct! or VERDICT: Incorrect.
- Whether they got it right or wrong
- The actual diagnosis (reveal even if wrong)
- 2-3 sentences on the key clues and what the condition is

Keep the tone clinical and grounded. Never reveal the diagnosis before the final submission.`;

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
