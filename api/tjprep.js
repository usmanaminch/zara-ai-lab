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
      spec: `Two things move relative to each other, or a resource is consumed over time, and a hard limit governs the whole situation. The prompt must carve out overhead from the budget (reserve fuel, required hover or setup time, a mandatory stop) so that a student who uses the full budget gets the wrong answer. Ask for a decision — when to depart, whether it can be done, what the latest possible start is — not simply for a distance or a total.
MODEL: the 2016 TJ helicopter prompt. An injured man on a boat moving toward the pilot at 10 mph from 400 miles away; 6600 lbs of fuel burning at 1200 lbs/hour; cruise 150 mph; 30 minutes of hovering; one extra hour of fuel held in reserve. When should the pilot depart?`
    },
    {
      name: 'model-given prediction and inversion',
      spec: `State the TYPE of mathematical relationship outright (exponential decay, linear growth, quadratic trajectory, inverse variation) and supply two data points. Ask for several forward predictions at given inputs, then invert it: ask for the INPUT that produces a specified output. The inversion is the real question and must require working backwards through the model.
MODEL: Principia's Hot Pizza prompt. A pizza leaves a 450F oven at 5:00 PM into a 75F room and is 300F after 5 minutes. Predict its temperature at 5:10 PM, 5:30 PM, and 7:00 PM. If you want it at 125F before eating, at what time can you begin?`
    },
    {
      name: 'constrained counting or arrangement',
      spec: `Give a set of interacting constraints on digits, arrangements, selections or schedules, where one constraint cascades into the others so the count cannot be done with a single formula. Ask for the total number of possibilities. Then change ONE constraint and ask how the count changes. Finish with an open conceptual question about the underlying idea.
MODEL: Principia's Password prompt. A 4-digit password where the hundreds digit is at least twice the ones digit, the tens digit is at least three times the ones digit, and the thousands digit is the sum of the ones and hundreds digits. How many users can the site host? What if only even passwords are accepted? What goes into making a strong password, and why?`
    },
    {
      name: 'qualitative science reasoning with no arithmetic',
      spec: `Contains NO CALCULATION AT ALL. State a definition, classification rule, or scientific principle precisely, then ask three to six "why" and "how is this possible" questions that can only be answered by reasoning from the stated rule. Include at least one apparent paradox the student must resolve (two facts that seem to contradict until a hidden variable such as density, resonance, or frame of reference is identified). Do not ask for any number.
MODEL: Principia's Pluto and Charon prompt. The three criteria for planethood are stated; the student must explain why Pluto fails the third, why a 3:2 orbital resonance prevents collision despite overlapping orbits, how Eris can be more massive than Pluto but smaller in diameter, and whether a binary system's orbits differ from a planet-moon system's.`
    }
  ];

  const MATH_TOPICS = [
    'rates and variation (direct and inverse)',
    'describing mathematical expressions and models',
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

  const PROMPT_SYSTEM = `You are writing practice prompts for the TJHSST admissions writing test. Your prompts must be indistinguishable from real ones.

=== PROBLEM-SOLVING ESSAY (PSE) ===

LENGTH IS CRITICAL. Real prompts are SHORT - one paragraph of setup followed by the questions, or a few clearly labelled parts. Never more than roughly 150 words. If your prompt is longer than the models given to you, it is wrong. Students are told "in 3700 characters or fewer, answer the following" - the prompt itself is brief; the ANSWER is long.

Every PSE prompt must do all four of these:
1. STATE THE GOVERNING PRINCIPLE, definition, or classification rule explicitly in the opening sentences. The prompt hands the student the tool and then tests whether they pick it up instead of reasoning from intuition.
2. STACK TWO TO FIVE QUESTIONS, either labelled (Part 1, Part 2 / a, b, c) or run together in a single paragraph.
3. END ON AN OPEN CONCEPTUAL QUESTION that cannot be computed - "why or why not", "how is this possible", "what goes into", "would this be different".
4. Where the problem is quantitative, include a constraint that defeats the obvious first approach.

BEFORE WRITING, solve your own problem internally. Discard and redesign it if any of these fail:
- The solution takes at least four distinct steps that cannot be collapsed
- At least two different relationships must be combined
- A constraint rules out the approach a rushing student would take first
- The answer is not obtainable by plugging numbers into one formula

FORBIDDEN - these are textbook-standard and far too easy:
- Any problem solved by multiplying quantities by unit prices and summing them
- Two-item or three-item pricing systems
- Budget problems where you total the costs and subtract from an amount given
- A single "distance equals rate times time" with no complication
- Questions phrased as "how much will it cost in total" or "determine how many of each"

=== STUDENT PORTRAIT SHEET (SPS) ===

Write ONE short reflective prompt on the assigned subject. Real SPS prompts are two to four sentences and often ask several things at once ("How do you deal with conflict? Include a time when you experienced conflict and what you learned"). The student has 1500 characters and roughly 15 minutes. Do not name a Portrait of a Graduate trait in the prompt - real prompts never do.

For type "sps-sim", produce FOUR prompts of DIFFERENT subjects as a JSON array of 4 objects with fields: prompt, trait.

=== OUTPUT ===
Return ONLY a JSON object, no markdown, no code fences:
{
  "type": "sps" or "pse",
  "prompt": "the full prompt text",
  "instructions": "one or two sentences on how to approach this"
}`;

  const GRADE_SYSTEM = `You are a TJHSST admissions evaluator. Grade slightly stricter than the real readers, but always show the student how to fix what is wrong. Never give empty praise.

STEP ONE, BEFORE ANYTHING ELSE - PROMPT COMPLIANCE.
List every distinct thing the prompt asked for. Then state, for each one, whether the response delivered it and where. A response that ignores a stated requirement, constraint, or category has not answered the prompt however well written it is. Say so explicitly and weight it heavily. Watch especially for a student who acknowledges the mismatch mid-essay ("though this is not exactly a book...", "though she didn't tell me this directly...") - that is a failure to answer, not a saving grace, and must be called out.

=== GRADING AN SPS ===
- Hook: does the opening draw the reader in, and does it contain information that appears nowhere else? An opening that merely previews the next sentence is wasted space.
- Paragraphs 1-2: situation, task, action, result - present but not mechanical.
- Paragraph 3: reflection, what the student does differently NOW, and a brief forward reference to TJ. The TJ reference should be about one sentence; flag it if it swells past that, and flag it if it is missing where it would fit naturally.
- Reflection quality: a named, present-tense habit beats a lesson or a feeling. "Now I slow down and ask whether we've heard from the other side" is strong; "I learned the value of teamwork" is weak.
- Specificity: concrete artifacts, numbers, names. Vague praise of a program or a school signals the student did not look it up.
- 1500 character limit. Note badly under-used space (below ~1200) as a missed opportunity.

=== GRADING A PSE ===
Grade against this structure, which is what the student has been taught:
- INTRODUCTION: final answer, method, and main assumption stated UP FRONT. An opening that announces the student is about to think ("X would aid in predicting Y") instead of stating the conclusion is a structural failure - say so.
- BODY (1-3 paragraphs): the actual solving, step by step, with reasoning visible. Showing the work matters more than arriving at the right number, BUT an answer asserted in one sentence with no derivation earns no credit for reasoning - there is nothing to grade.
- CRITICAL INSIGHTS (1-2 paragraphs): the assumptions and real-world factors the problem glosses over.
- CONCLUSION, if present: a restatement of the thesis worded DIFFERENTLY from the introduction, then ONE application explored deeply enough to explain HOW the concept is applied rather than merely that it is, then a sense of ending - ideally returning to the opening hook.

Penalise explicitly, by name:
- Self-congratulation of any kind ("I did a great job", "I am proud of my solution", "I believe my answer is correct")
- ANY mention of TJ or of the student's own candidacy. The PSE is not an application essay and must contain no reference to TJ.
- A conclusion that softens or walks back the analysis instead of extending it
- Any stated principle, formula, or definition given in the prompt that the response failed to use explicitly
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
- Math from the TJ PSE curriculum: rates and variation, linear functions, ratio and proportion, statistics, logic, quadratics, triangles, polygons, coordinate geometry, three-dimensional figures, circles and sectors, exponential functions, piecewise functions, permutations and combinations, probability
- Science: atomic structure, phases of matter, stoichiometry, density, forces and energy, buoyancy, heat transfer, genetics, ecology, orbital mechanics
- PSE structure: thesis-first ordering, stating assumptions, critical insights, what belongs in a conclusion, what must never appear
- SPS structure: hooks, three-paragraph form, reflection quality, prompt compliance
- TJ application facts: character limits, number of prompts, timing

Return ONLY a JSON array, no markdown, no code fences:
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
    return data.content?.[0]?.text || '';
  };

  if (mode === 'concept') {
    let text = await callClaude(CONCEPT_SYSTEM, 'Generate 5 concept check questions.', 1500);
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      return res.status(200).json({ questions: JSON.parse(text) });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to generate questions' });
    }
  }

  if (mode === 'prompt') {
    let userMsg;

    if (baseType === 'pse') {
      const arch = PSE_ARCHETYPES[slotFrom(type, 'pse', PSE_ARCHETYPES.length)];
      const pool = Math.random() < 0.6 ? MATH_TOPICS : SCIENCE_TOPICS;
      const topic = pool[Math.floor(Math.random() * pool.length)];

      userMsg = `Generate ONE Problem-Solving Essay prompt.

ARCHETYPE (required): ${arch.name}

${arch.spec}

TOPIC to build it around: ${topic}

Match the archetype's shape and the model prompt's LENGTH. Short. Run your four-point self-check before returning it. Seed: ${Math.random()}`;

    } else if (baseType === 'sps' && type === 'sps-sim') {
      userMsg = `Generate 4 SPS prompts for a full simulation, each on a different subject drawn from this list: ${SPS_SLOTS.join('; ')}. Return a JSON array of 4 objects with fields: prompt and trait. Seed: ${Math.random()}`;

    } else {
      const subject = SPS_SLOTS[slotFrom(type, 'sps', SPS_SLOTS.length)];
      userMsg = `Generate ONE SPS prompt on this subject: ${subject}

Two to four sentences. It may ask more than one thing. Do not name a Portrait of a Graduate trait. Seed: ${Math.random()}`;
    }

    let text = await callClaude(PROMPT_SYSTEM, userMsg, 900);
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      return res.status(200).json(JSON.parse(text));
    } catch (e) {
      return res.status(500).json({ error: 'Failed to generate prompt' });
    }
  }

  if (mode === 'grade') {
    const feedback = await callClaude(
      GRADE_SYSTEM,
      `Here is the prompt:\n\n${req.body.prompt}\n\nHere is the student's response:\n\n${userResponse}\n\nEvaluate it.`,
      1600
    );
    return res.status(200).json({ feedback: feedback || 'Something went wrong.' });
  }

  return res.status(400).json({ error: 'Invalid mode' });
}
