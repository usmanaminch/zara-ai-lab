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
    'scheduling under competing constraints',
    'mixtures and concentrations',
    'population or ecological reasoning',
    'genetics and inheritance probability',
    'work rates with competing forces',
    'number patterns and growth over time'
  ];

  const PROMPT_SYSTEM = `You are writing practice prompts for the TJHSST admissions test.

FOR SPS PROMPTS:
Write ONE short prompt, one to three sentences maximum. Never name the Portrait of a Graduate trait being tested. Do not list sub-questions exhaustively, ask at most two things. Real TJ prompts are vague and leave the student to work out what a good answer requires.

Roughly one prompt in three must contain an embedded constraint the student could easily miss: a time window such as "in the last year", a location limit such as "outside of school", a required forward connection such as "how will this inform your actions at TJ", or a relationship limit such as "with someone older than you". Bury it in natural phrasing.

Examples of the right length and vagueness:
"Describe a challenge that has been hard for you. How did you tackle it, and how will that experience inform your actions at TJ?"
"What is something you learned in the last year that has had a lasting effect on you?"
"Tell us about a time you changed your mind about something."

Return ONLY a JSON object, no markdown:
{"type":"sps","prompt":"the prompt text","instructions":"one short line on approach"}

FOR PSE PROMPTS:

Here is a real TJHSST prompt from 2016. Match this difficulty exactly.

"It is 5:30 AM and you, a helicopter pilot, have just been told there is an injured man on a boat you need to get to a hospital. The boat is travelling toward you at 10 mph but is currently 400 miles away. You need to reach him as soon as possible, but you have only 6600 lb of fuel, which burns at 1200 lb per hour, and the helicopter always travels at 150 mph. You must also account for 30 minutes of fuel spent hovering over the boat to load the man, and one extra hour of fuel reserve due to helicopter standards. Under these circumstances, when should you depart your station to reach the man as soon as possible?"

Study why that is hard. Seven numbers buried in prose. A target that is itself moving. A fuel ceiling that makes the obvious answer, leaving immediately, physically impossible, forcing the counterintuitive answer of waiting eight hours. A question vague enough that the student must state their interpretation.

BEFORE WRITING THE PROMPT, solve your own problem internally and check all of the following. If any check fails, discard it and design a harder one.
- The solution takes at least four distinct steps that cannot be collapsed
- At least two different relationships must be combined
- A constraint rules out the approach a rushing student would take first
- The answer is not obtainable by plugging numbers into one formula

HARD REQUIREMENTS:
- Six to eight distinct numbers, embedded in sentences, never listed
- Five to eight sentences of scenario
- Exactly ONE question at the end, worded ambiguously. Never numbered parts. Never state what to calculate.

FORBIDDEN, these are textbook-standard and far too easy:
- Any problem solved by multiplying quantities by unit prices and summing
- Two-item or three-item pricing systems
- Budget problems where you total the costs and subtract from a given amount
- Single distance equals rate times time with no complication
- Questions phrased as "how much will it cost in total" or "determine how many of each"

No calculus and no memorized physics formulas, but the reasoning should take a strong eighth grader a full twenty-five minutes.

Return ONLY a JSON object, no markdown:
{"type":"pse","prompt":"the prompt text","instructions":"one short line on approach"}`;

  const GRADE_SYSTEM = `You are a TJHSST admissions evaluator. Evaluate as real TJ admissions staff would, slightly stricter, but your goal is to help the student improve.

FIRST, before anything else: check whether the response respected every constraint in the prompt. Time windows, location limits, required connections, reserved quantities, what is included versus excluded. A response that ignores a stated constraint has not answered the prompt however well written it is. Say so explicitly and weight it heavily.

For SPS: evaluate structure across three paragraphs, a specific real moment rather than a general habit, the student's own actions rather than the group's, a result, and a reflection saying what changed in how they think rather than a generic lesson.

For PSE: evaluate whether the final answer is correct, whether every step is shown in essay prose, whether units appear throughout, whether the answer was verified, and whether the student stated an interpretation when the question was ambiguous.

Your feedback must include:
1. A score out of 10
2. Whether any prompt constraint was missed, named explicitly
3. What the response did well, with specifics
4. What needs improvement and exactly how to fix it
5. What an ideal response would look like

Be honest. Never give empty praise. Use bold headers: **Score**, **Constraints**, **What You Did Well**, **What To Improve**, **What An Ideal Response Looks Like**`;

  const CONCEPT_SYSTEM = `You are a TJ admissions prep quiz master. Generate exactly 5 multiple choice concept check questions.

Mix three areas: math concepts, SPS writing structure, and TJ application knowledge.

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
    const simSystem = 'You are writing TJHSST SPS practice prompts. Generate exactly 4, each one to three sentences, each testing a different Portrait of a Graduate trait without naming it. Keep them vague like real TJ prompts. At least one must contain an embedded constraint the student could miss. Return ONLY a JSON array: [{"trait":"name","prompt":"text"}]';
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
      userContent = 'Generate a PSE prompt about: ' + topic + '. Seed: ' + Date.now() + '. Solve it yourself first and confirm it passes all four difficulty checks before writing it. Match the helicopter prompt exactly in length, number density, ambiguity and trap.';
    } else {
      const idx = parseInt((type || 'sps-0').split('-')[1] || '0', 10) % SPS_SLOTS.length;
      userContent = 'Generate an SPS prompt for this slot: ' + SPS_SLOTS[idx] + '. Seed: ' + Date.now() + '. One to three sentences, do not name the trait.';
    }
    const text = stripFences(await callClaude(PROMPT_SYSTEM, userContent, 1200));
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
