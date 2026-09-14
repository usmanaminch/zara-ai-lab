export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mode, type, response: userResponse } = req.body;

  const SPS_SLOTS = [
    'Communicator',
    'Collaborator',
    'Goal-Directed and Resilient Individual',
    'Creative and Critical Thinker',
    'Ethical and Global Citizen',
    'why TJHSST / future goals',
    'personality and interests outside school'
  ];

  const PSE_TOPICS = [
    'rate, distance and time with a moving target',
    'fuel, supply or resource budgeting under a hard limit',
    'unit conversion across several steps',
    'geometry and volume in a real-world setting',
    'cost, budget and purchasing decisions',
    'mixtures and concentrations',
    'population or ecological reasoning',
    'genetics and inheritance probability',
    'work rates with competing forces',
    'number patterns and growth over time'
  ];

  const PROMPT_SYSTEM = `You are writing practice prompts for the TJHSST admissions test.

FOR SPS PROMPTS:
Write ONE short prompt, one to three sentences maximum. Never name the Portrait of a Graduate trait being tested. Do not list out sub-questions exhaustively — ask at most two things. Real TJ prompts are vague and leave the student to figure out what a good answer requires.

Roughly one prompt in three must contain an embedded constraint the student could easily miss: a time window such as "in the last year", a location limit such as "outside of school", a required forward connection such as "how will this inform your actions at TJ", or a relationship limit such as "with someone older than you". Bury the constraint in natural phrasing rather than emphasizing it.

Good examples of the right length and vagueness:
"Describe a challenge that has been hard for you. How did you tackle it, and how will that experience inform your actions at TJ?"
"What is something you learned in the last year that has had a lasting effect on you?"
"Tell us about a time you changed your mind about something."
"What do you do outside of school that you would keep doing even if no one knew about it?"

Return ONLY a JSON object, no markdown:
{"type":"sps","prompt":"the prompt text","instructions":"one short line on approach"}

FOR PSE PROMPTS:
Model the real 2016 TJHSST prompt, which described a helicopter rescue with seven separate numbers woven into narrative prose and asked a single ambiguous question.

Requirements: the scenario runs five to eight sentences. Embed five to eight numbers inside the prose rather than listing them. Ask exactly ONE question at the end — never numbered parts, never sub-steps. Word the question ambiguously so the student must state an interpretation. Include at least one constraint that makes the intuitive first approach fail, so a student who rushes gets a wrong answer.

Solvable with arithmetic, ratios, rates and basic algebra only. No calculus, no memorized physics formulas.

Return ONLY a JSON object, no markdown:
{"type":"pse","prompt":"the prompt text","instructions":"one short line on approach"}`;

  const GRADE_SYSTEM = `You are a TJHSST admissions evaluator. Evaluate the way real TJ admissions staff would, slightly stricter, but your goal is to help the student improve.

FIRST, before anything else: check whether the response respected every constraint in the prompt. Time windows, location limits, required connections, reserved quantities, what is included versus excluded. A response that ignores a stated constraint has not answered the prompt, however well written it is. Say so explicitly and weight it heavily.

For SPS: evaluate story structure across three paragraphs, a specific real moment rather than a general habit, the student's own actions rather than the group's, a result, and a reflection that says what changed in how they think rather than a generic lesson.

For PSE: evaluate whether the final answer is correct, whether every step is shown in essay prose, whether units appear throughout, whether the answer was verified, and whether the student stated an interpretation when the question was ambiguous.

Your feedback must include:
1. A score out of 10
2. Whether any prompt constraint was missed, named explicitly
3. What the response did well, with specifics
4. What needs improvement and exactly how to fix it
5. What an ideal response would look like

Be honest. Never give empty praise. Use bold headers: **Score**, **Constraints**, **What You Did Well**, **What To Improve**, **What An Ideal Response Looks Like**`;

  const CONCEPT_SYSTEM = `You are a TJ admissions prep quiz master. Generate exactly 5 multiple choice concept check questions.

Mix three areas: math concepts (rates, ratios, proportions, area and volume, algebra, unit conversion, probability), SPS writing structure (story structure, Portrait of a Graduate traits, what makes a strong response, common mistakes), and TJ application knowledge (character limits, number of prompts, timing, what TJ looks for, key dates).

Return ONLY a JSON array, no markdown:
[{"area":"Math","question":"text","options":["A. one","B. two","C. three","D. four"],"answer":"A. one","explanation":"why"}]

The answer field must exactly match one of the options.`;

  async function callClaude(system, userContent, maxTokens) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        system: system,
        messages: [{ role: 'user', content: userContent }]
      }),
    });
    const data = await r.json();
    return data.content?.[0]?.text || '';
  }

  function stripFences(t) {
    return t.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }

  if (mode === 'concept') {
    const text = stripFences(await callClaude(CONCEPT_SYSTEM, 'Generate 5 concept check questions. Seed: ' + Date.now(), 1500));
    try {
      return res.status(200).json({ questions: JSON.parse(text) });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to generate questions' });
    }
  }

  if (mode === 'sim') {
    const simSystem = 'You are writing practice prompts for the TJHSST SPS. Generate exactly 4 prompts, each one to three sentences, each testing a different Portrait of a Graduate trait without naming it. Keep them vague like real TJ prompts. At least one must contain an embedded constraint the student could miss. Return ONLY a JSON array: [{"trait":"name","prompt":"text"}]';
    const text = stripFences(await callClaude(simSystem, 'Generate 4 simulation prompts. Seed: ' + Date.now(), 1500));
    try {
      return res.status(200).json({ prompts: JSON.parse(text) });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to generate simulation prompts' });
    }
  }

  if (mode === 'prompt') {
    let userContent;
    if (type === 'pse') {
      const topic = PSE_TOPICS[Math.floor(Math.random() * PSE_TOPICS.length)];
      userContent = 'Generate a PSE prompt about: ' + topic + '. Seed: ' + Date.now() + '. Follow the helicopter-prompt model exactly: long narrative scenario, numbers buried in prose, one ambiguous question, and a constraint that defeats the obvious approach.';
    } else {
      const idx = parseInt((type || 'sps-0').split('-')[1] || '0', 10) % SPS_SLOTS.length;
      userContent = 'Generate an SPS prompt for this slot: ' + SPS_SLOTS[idx] + '. Seed: ' + Date.now() + '. Keep it to one to three sentences and do not name the trait.';
    }
    const text = stripFences(await callClaude(PROMPT_SYSTEM, userContent, 900));
    try {
      return res.status(200).json(JSON.parse(text));
    } catch (e) {
      return res.status(500).json({ error: 'Failed to generate prompt' });
    }
  }

  if (mode === 'grade') {
    const text = await callClaude(
      GRADE_SYSTEM,
      'Here is the prompt:\n\n' + req.body.prompt + '\n\nHere is the student response:\n\n' + userResponse + '\n\nEvaluate it.',
      1400
    );
    return res.status(200).json({ feedback: text });
  }

  return res.status(400).json({ error: 'Invalid mode' });
}
