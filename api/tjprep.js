let lastPseArch = -1;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mode, type, response: userResponse } = req.body;

  const SPS_SLOTS = [
    'conflict or disagreement with another person, and what you learned',
    'your greatest STEM accomplishment',
    'what you will do if you do NOT attend TJHSST',
    'the best piece of advice you have received, who gave it, and its effect',
    'define a concept or quality (for example, what makes someone a scientist)',
    'a book, artwork, or concept that changed the way you think',
    'your greatest weakness, and what it has cost you',
    'a time you changed your mind about something you believed',
    'how TJHSST will help you reach your future goals',
    'a problem with no obvious solution, and how you approached it',
    'an unintended impact you or your community had on others',
    'your interests, personality, or pursuits outside of school'
  ];

  const PSE_ARCHETYPES = [
    {
      name: 'rate or resource under a hard constraint',
      science: false,
      spec: `Two things move relative to each other, or a resource is consumed over time, and a hard limit governs the situation. Carve overhead out of the budget (reserve fuel, required hover or setup time, a mandatory stop) so a student who spends the full budget gets the wrong answer. Ask for a DECISION - when to depart, whether it can be done, the latest possible start - not a distance or a total.
MODEL: the 2016 TJ helicopter prompt. An injured man on a boat moving toward the pilot at 10 mph from 400 miles away; 6600 lbs of fuel burning at 1200 lbs/hour; cruise 150 mph; 30 minutes of hovering; one extra hour of fuel held in reserve. When should the pilot depart?`
    },
    {
      name: 'model-given prediction and inversion',
      science: false,
      spec: `State the TYPE of relationship outright (exponential decay, linear growth, quadratic trajectory, inverse variation) and give two data points. Ask for two or three forward predictions, then invert it: ask for the INPUT that produces a stated output. The inversion is the real question.
MODEL: Principia's Hot Pizza prompt. A pizza leaves a 450F oven at 5:00 PM into a 75F room and is 300F after 5 minutes. Predict its temperature at 5:10 PM, 5:30 PM and 7:00 PM. If you want it at 125F before eating, at what time can you begin?`
    },
    {
      name: 'constrained counting or arrangement',
      science: false,
      spec: `Give AT MOST THREE interacting constraints on digits, arrangements, selections or schedules, where one constraint cascades into the others so the count cannot be done with a single formula. Ask for the total. Then change ONE constraint and ask how the count changes. Finish with an open conceptual question.
MODEL: Principia's Password prompt. A 4-digit password where the hundreds digit is at least twice the ones digit, the tens digit is at least three times the ones digit, and the thousands digit is the sum of the ones and hundreds digits. How many users can the site host? What if only even passwords are accepted? What goes into making a strong password, and why?
HARD LIMIT: three constraints, like the model. Four or more becomes fiddly bookkeeping rather than reasoning. Do not bolt an extra sub-question onto the end that introduces a new idea.`
    },
    {
      name: 'qualitative science reasoning with no arithmetic',
      science: true,
      spec: `Contains NO CALCULATION AT ALL. State a definition, classification rule or scientific principle precisely, then ask three to five "why" and "how is this possible" questions answerable only by reasoning from that stated rule. Include one apparent paradox the student must resolve - two facts that seem to contradict until a hidden variable (density, resonance, frame of reference, surface area) is identified. Ask for no number.
MODEL: Principia's Pluto and Charon prompt. The three criteria for planethood are stated; the student explains why Pluto fails the third, why a 3:2 orbital resonance prevents collision despite overlapping orbits, how Eris can be more massive than Pluto but smaller in diameter, and whether a binary system's orbits differ from a planet-moon system's.`
    }
  ];

  const FORMATS = [
    'ONE continuous paragraph. Setup first, then the questions run together at the end of the same paragraph. No labels, no "Part 1", no bullets, no line breaks. Most real prompts look like this.',
    'ONE continuous paragraph. Setup first, then the questions run together at the end of the same paragraph. No labels, no "Part 1", no bullets, no line breaks.',
    'ONE continuous paragraph. Setup first, then the questions run together at the end of the same paragraph. No labels, no "Part 1", no bullets, no line breaks.',
    'Labelled parts (Part 1, Part 2, Part 3), each with a short setup and one or two sub-questions.'
  ];

  const MATH_TOPICS = [
    'rates and variation (direct and inverse)',
    'linear functions',
    'ratio, proportion and percentage',
    'data collection and statistics',
    'logic foundations',
    'quadratic functions',
    'triangles',
    'quadrilaterals and polygons',
    'coordinate geometry',
    'spatial reasoning and three-dimensional figures',
    'circles, cylinders, arcs and sectors',
    'exponential functions',
    'piecewise functions',
    'permutations and combinations',
    'probability'
  ];

  const SCIENCE_TOPICS = [
    'atomic structure and the periodic table',
    'phases of matter and phase changes',
    'stoichiometry and balancing chemical equations',
    'density, mass and volume relationships',
    'forces, motion and energy',
    'buoyancy and fluid displacement',
    'heat transfer and thermal equilibrium',
    'genetics and inheritance',
    'cells, systems and homeostasis',
    'ecology, populations and food webs',
    'orbital mechanics and the solar system',
    'waves, light and sound'
  ];

  const slotFrom = (t, prefix, len) => {
    const m = typeof t === 'string' && t.startsWith(prefix + '-')
      ? parseInt(t.slice(prefix.length + 1), 10)
      : NaN;
    return Number.isFinite(m) ? m % len : Math.floor(Date.now() / 60000) % len;
  };

  const baseType = typeof type === 'string' ? type.split('-')[0] : type;

  const stripFences = (t) =>
    t.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  const safeParse = (raw) => {
    const t = stripFences(raw);
    try { return JSON.parse(t); } catch (e) {}
    let out = '', inStr = false, esc = false;
    for (const ch of t) {
      if (esc) { out += ch; esc = false; continue; }
      if (ch === '\\') { out += ch; esc = true; continue; }
      if (ch === '"') { inStr = !inStr; out += ch; continue; }
      if (inStr && ch === '\n') { out += '\\n'; continue; }
      if (inStr && ch === '\r') { continue; }
      if (inStr && ch === '\t') { out += '\\t'; continue; }
      out += ch;
    }
    return JSON.parse(out);
  };

  const PROMPT_SYSTEM = `You are writing practice prompts for the TJHSST admissions writing test. Your prompts must be indistinguishable from real ones.

=== PROBLEM-SOLVING ESSAY (PSE) ===

LENGTH. Real prompts are SHORT - roughly 80 to 150 words. If yours is longer than the model prompt you were given, it is wrong. The prompt is brief; the ANSWER is long.

REALISM. This matters as much as difficulty:
- The scenario must be something that could plausibly happen. Never invent an artificial object whose rules exist only to create a puzzle. A "quad code" with arbitrary digit relationships is not a real thing; a password policy is.
- If the topic is a SCIENCE topic, the science must do real work. A counting puzzle wearing biology vocabulary is not a biology problem. Inheritance rules must be actual inheritance (dominant/recessive, Punnett squares, carrier probability), not arbitrary letter-ordering rules.
- Prefer concrete, ordinary settings: a vehicle, a kitchen, a lab bench, a garden, a pool, a delivery route, an orbit.

DIFFICULTY TARGET. A strong, well-prepared 8th grader should solve it carefully in 20 to 25 minutes. If an adult would need more than 30 minutes, it is TOO HARD - simplify it. Depth beats bookkeeping: one idea that must be seen is better than five constraints that must be tracked.

Every PSE prompt must do all four of these:
1. STATE THE GOVERNING PRINCIPLE, definition or rule explicitly in the opening sentences. The prompt hands the student the tool and tests whether they pick it up instead of reasoning from intuition.
2. ASK TWO TO FOUR QUESTIONS total.
3. END ON AN OPEN CONCEPTUAL QUESTION that cannot be computed - "why or why not", "how is this possible", "what goes into", "would this be different".
4. Where the problem is quantitative, include ONE constraint that defeats the obvious first approach.

BEFORE WRITING, solve your own problem internally. Discard and redesign if any fail:
- The solution takes at least four distinct steps that cannot be collapsed
- At least two different relationships must be combined
- A constraint rules out the approach a rushing student takes first
- The answer is not obtainable by plugging numbers into one formula
- You yourself can solve it in under 30 minutes

FORBIDDEN - textbook-standard and far too easy:
- Multiplying quantities by unit prices and summing them
- Two-item or three-item pricing systems
- Budget problems where you total costs and subtract from a given amount
- A single "distance equals rate times time" with no complication
- "How much will it cost in total" or "determine how many of each"

ALSO FORBIDDEN - too fiddly:
- More than three interacting constraints
- Invented objects with made-up rules
- Stacking an unrelated extra question onto the end

=== STUDENT PORTRAIT SHEET (SPS) ===

Write ONE short reflective prompt on the assigned subject. Real SPS prompts are two to four sentences and often ask several things at once ("How do you deal with conflict? Include a time when you experienced conflict and what you learned"). The student has 1500 characters and about 15 minutes. Never name a Portrait of a Graduate trait - real prompts do not.

For type "sps-sim", produce FOUR prompts on DIFFERENT subjects as a JSON array of 4 objects with fields: prompt, trait.

=== OUTPUT FORMAT - READ THIS TWICE ===
Return ONLY a JSON object. No markdown. No code fences. No text before or after.

CRITICAL: JSON strings cannot contain real line breaks. If your prompt has multiple parts, write the breaks as the two characters backslash-n inside the string. A literal newline makes the response unparseable and the generation fails.

{
  "type": "sps" or "pse",
  "prompt": "the full prompt text, with \\n for any line breaks",
  "instructions": "one or two sentences on how to approach this"
}`;

  const GRADE_SYSTEM = `You are a TJHSST admissions evaluator. Grade slightly stricter than the real readers, but always show the student how to fix what is wrong. Never give empty praise.

STEP ONE, BEFORE ANYTHING ELSE - PROMPT COMPLIANCE.
List every distinct thing the prompt asked for. Then state, for each, whether the response delivered it and where. A response that ignores a stated requirement, constraint or category has not answered the prompt however well written it is. Say so explicitly and weight it heavily. Watch especially for a student who acknowledges the mismatch mid-essay ("though this is not exactly a book...", "though she didn't tell me this directly...") - that is a failure to answer, not a saving grace, and must be called out.

=== GRADING AN SPS ===
- Hook: does the opening draw the reader in, and does it contain information appearing nowhere else? An opening that merely previews the next sentence is wasted space.
- Paragraphs 1-2: situation, task, action, result - present but not mechanical.
- Paragraph 3: reflection, what the student does differently NOW, and a brief forward reference to TJ. That reference should be about one sentence; flag it if it swells past that, and flag it if it is missing where it would fit naturally.
- Reflection quality: a named, present-tense habit beats a lesson or a feeling. "Now I slow down and ask whether we've heard from the other side" is strong; "I learned the value of teamwork" is weak.
- Specificity: concrete artifacts, numbers, names. Vague praise of a program or school signals the student did not look it up.
- 1500 character limit. Note badly under-used space (below ~1200) as a missed opportunity.

=== GRADING A PSE ===
- INTRODUCTION: final answer, method and main assumption stated UP FRONT. An opening that announces the student is about to think ("X would aid in predicting Y") instead of stating the conclusion is a structural failure - say so.
- BODY (1-3 paragraphs): the solving, step by step, reasoning visible. Showing work matters more than the right number, BUT an answer asserted in one sentence with no derivation earns no credit for reasoning - there is nothing to grade.
- CRITICAL INSIGHTS (1-2 paragraphs): assumptions and real-world factors the problem glosses over.
- CONCLUSION, if present: a restatement worded DIFFERENTLY from the introduction, then ONE application explored deeply enough to explain HOW the concept is applied rather than that it is, then a sense of ending - ideally returning to the hook.

Penalise explicitly, by name:
- Self-congratulation ("I did a great job", "I am proud of my solution", "I believe my answer is correct")
- ANY mention of TJ or the student's candidacy. The PSE is not an application essay.
- A conclusion that softens or walks back the analysis instead of extending it
- Any principle, formula or definition given in the prompt that the response failed to use explicitly
- 3700 character limit.

=== OUTPUT FORMAT ===
Use these exact bold headers:
**Score** - out of 10, stated as a number, with one sentence of justification
**Prompt Compliance** - the checklist described above
**What You Did Well** - specific, quoting the response
**What To Improve** - numbered, each with the exact fix
**What An Ideal Response Looks Like**`;

  const CONCEPT_SYSTEM = `You are a TJ admissions prep quiz master. Generate exactly 5 multiple choice concept check questions.

Draw from:
- Math: rates and variation, linear functions, ratio and proportion, statistics, logic, quadratics, triangles, polygons, coordinate geometry, three-dimensional figures, circles and sectors, exponential functions, piecewise functions, permutations and combinations, probability
- Science: atomic structure, phases of matter, stoichiometry, density, forces and energy, buoyancy, heat transfer, genetics, ecology, orbital mechanics
- PSE structure: thesis-first ordering, stating assumptions, critical insights, what belongs in a conclusion, what must never appear
- SPS structure: hooks, three-paragraph form, reflection quality, prompt compliance
- TJ application facts: character limits, number of prompts, timing

Return ONLY a JSON array. No markdown, no code fences. Use \\n for any line break inside a string; never a literal newline.
[
  {
    "area": "Math" or "Science" or "PSE Structure" or "SPS Writing" or "TJ Knowledge",
    "question": "question text",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "answer": "A. ...",
    "explanation": "why this is correct"
  }
]

The answer field must exactly match one of the options.`;

  const callClaude = async (system, user, maxTokens) => {
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
        system,
        messages: [{ role: 'user', content: user }]
      }),
    });
    const data = await r.json();
    if (data.error) return { text: '', err: data.error.message || 'api error' };
    return { text: data.content?.[0]?.text || '', err: null };
  };

  if (mode === 'concept') {
    const { text, err } = await callClaude(CONCEPT_SYSTEM, 'Generate 5 concept check questions.', 2000);
    if (err) return res.status(500).json({ error: 'API error: ' + err });
    try {
      return res.status(200).json({ questions: safeParse(text) });
    } catch (e) {
      return res.status(500).json({ error: 'Parse failed: ' + e.message, raw: text.slice(0, 500) });
    }
  }

  if (mode === 'prompt') {
    let userMsg;

    if (baseType === 'pse') {
      let archIdx;
      if (typeof type === 'string' && type.startsWith('pse-')) {
        archIdx = slotFrom(type, 'pse', PSE_ARCHETYPES.length);
      } else {
        do {
          archIdx = Math.floor(Math.random() * PSE_ARCHETYPES.length);
        } while (archIdx === lastPseArch);
      }
      lastPseArch = archIdx;

      const arch = PSE_ARCHETYPES[archIdx];
      const pool = arch.science
        ? SCIENCE_TOPICS
        : (Math.random() < 0.8 ? MATH_TOPICS : SCIENCE_TOPICS);
      const topic = pool[Math.floor(Math.random() * pool.length)];
      const format = FORMATS[Math.floor(Math.random() * FORMATS.length)];

      userMsg = `Generate ONE Problem-Solving Essay prompt.

ARCHETYPE (required): ${arch.name}

${arch.spec}

TOPIC to build it around: ${topic}

FORMAT (required): ${format}

Keep it SHORT, realistic and solvable in 20-25 minutes. Run your self-check before returning it. No literal newlines inside the JSON string. Seed: ${Math.random()}`;

    } else if (type === 'sps-sim') {
      userMsg = `Generate 4 SPS prompts for a full simulation, each on a different subject drawn from this list: ${SPS_SLOTS.join('; ')}. Return a JSON array of 4 objects with fields: prompt and trait. Seed: ${Math.random()}`;

    } else {
      const subject = SPS_SLOTS[slotFrom(type, 'sps', SPS_SLOTS.length)];
      userMsg = `Generate ONE SPS prompt on this subject: ${subject}

Two to four sentences. It may ask more than one thing. Do not name a Portrait of a Graduate trait. Seed: ${Math.random()}`;
    }

    const { text, err } = await callClaude(PROMPT_SYSTEM, userMsg, 1500);
    if (err) return res.status(500).json({ error: 'API error: ' + err });
    try {
      return res.status(200).json(safeParse(text));
    } catch (e) {
      return res.status(500).json({ error: 'Parse failed: ' + e.message, raw: text.slice(0, 500) });
    }
  }

  if (mode === 'grade') {
    const { text, err } = await callClaude(
      GRADE_SYSTEM,
      `Here is the prompt:\n\n${req.body.prompt}\n\nHere is the student's response:\n\n${userResponse}\n\nEvaluate it.`,
      1800
    );
    if (err) return res.status(500).json({ error: 'API error: ' + err });
    return res.status(200).json({ feedback: text || 'Something went wrong.' });
  }

  return res.status(400).json({ error: 'Invalid mode' });
}
