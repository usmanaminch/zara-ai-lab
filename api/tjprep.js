export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mode, type, response: userResponse } = req.body;

  const PROMPT_SYSTEM = `You are a TJHSST admissions coach. Generate one realistic practice prompt for a student preparing for the TJHSST application.

If type is "sps", generate ONE Student Portrait Sheet prompt — a short essay question asking the student to demonstrate one of these skills: critical thinking, problem solving, leadership, collaboration, resilience, or STEM passion. Make it specific and reflective, similar to what TJ actually asks. If type is "sps-sim", generate FOUR different Student Portrait Sheet prompts, each testing a DIFFERENT Portrait of a Graduate trait. Return them as a JSON array of 4 objects, each with fields: prompt and trait.

If type is "pse", generate a Problem-Solving Essay prompt. Rotate through ALL of these topic areas — do not repeat the same topic twice in a row and do not default to probability: MATH topics: rate/distance/time problems, unit conversions, multi-step algebra, systems of equations, geometry (area, volume, perimeter, angles), ratios and proportions, percentages and discounts, number patterns and sequences, budget and cost problems, mixture problems, work rate problems. SCIENCE topics: genetics and Punnett squares, basic physics (speed, force, energy, motion), environmental science, biology reasoning (populations, ecosystems), chemistry reasoning (mixtures, concentrations), scientific data interpretation. Each prompt must use a DIFFERENT topic from the list above. Use a random seed to vary selection. Difficulty: 8th grade advanced to early high school level. The problem must require multiple steps AND a written explanation of reasoning — not just a single calculation. The response should be written in essay format — prose sentences explaining the reasoning, not bullet points.

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


  const CONCEPT_SYSTEM = `You are a TJ admissions prep quiz master. Generate exactly 5 multiple choice concept check questions for a student preparing for TJHSST.

Mix questions from these three areas:
- Math concepts (rate problems, ratios, proportions, area/volume formulas, algebra basics, unit conversions, probability)
- SPS writing structure (STAR method, Portrait of a Graduate traits, what makes a strong SPS response, common mistakes)
- TJ application knowledge (character limits, number of prompts, PSE time limit, what TJ looks for, key dates)

Return ONLY a JSON array with no other text, no markdown, no code blocks:
[
  {
    "area": "Math" or "SPS Writing" or "TJ Knowledge",
    "question": "question text here",
    "options": ["A. option one", "B. option two", "C. option three", "D. option four"],
    "answer": "A. option one",
    "explanation": "brief explanation of why this is correct"
  }
]

Make questions genuinely useful for TJ prep. Not too easy, not too hard. The answer field must exactly match one of the options.`;

  if (mode === 'concept') {
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
        system: CONCEPT_SYSTEM,
        messages: [{ role: 'user', content: 'Generate 5 concept check questions.' }]
      }),
    });
    const data = await response.json();
    let text = data.content?.[0]?.text || '[]';
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      const questions = JSON.parse(text);
      return res.status(200).json({ questions });
    } catch(e) {
      return res.status(500).json({ error: 'Failed to generate questions' });
    }
  }

  if (mode === 'sim') {
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
        system: `You are a TJHSST admissions coach. Generate exactly 4 different Student Portrait Sheet prompts for a full simulation test. Each prompt must test a DIFFERENT Portrait of a Graduate trait: Communicator, Collaborator, Creative and Critical Thinker, Ethical and Global Citizen, or Goal-Directed and Resilient Individual. Each prompt should be specific, reflective, and similar to what TJ actually asks. Return ONLY a JSON array with no other text, no markdown: [{"trait": "trait name", "prompt": "full prompt text"}]`,
        messages: [{ role: 'user', content: 'Generate 4 SPS simulation prompts now.' }]
      }),
    });
    const data = await response.json();
    let text = data.content?.[0]?.text || '[]';
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      const prompts = JSON.parse(text);
      return res.status(200).json({ prompts });
    } catch(e) {
      return res.status(500).json({ error: 'Failed to generate simulation prompts' });
    }
  }

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
        messages: [{ role: 'user', content: type === 'pse' ? (() => { const topics = ["rate/distance/time", "genetics/Punnett squares", "geometry (area and volume)", "unit conversions", "systems of equations", "basic physics (speed and force)", "budget and cost problems", "ratios and proportions", "environmental science", "mixture problems", "number patterns and sequences", "biology reasoning", "multi-step algebra", "percentages and discounts", "chemistry reasoning"]; const topic = topics[Math.floor(Math.random() * topics.length)]; return `Generate a PSE prompt about: ${topic}. Seed: ${Math.random()}. Write a multi-step problem that requires essay-format written explanation. Do NOT use probability or train/city distance problems.`; })() : type === 'sps-sim' ? `Generate 4 SPS prompts for a full simulation. Seed: ${Math.random()}. Each must test a different Portrait of a Graduate trait. Return JSON array of 4 objects with fields: prompt and trait.` : `Generate a fresh SPS prompt. Seed: ${Math.random()}. Pick a different Portrait of a Graduate trait each time.` }]
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
