export default async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await request.json();
  const { topic, mode } = body;

  if (!topic) {
    return new Response(JSON.stringify({ error: "No topic provided" }), { status: 400 });
  }

  const LESSON_SYSTEM = `You are a science tutor that explains topics in clear, friendly language. When given a topic, write a short educational article about it.

Always highlight key terms by wrapping them like this: [term](definition) and give a short definition or explanation of the word in plain English. If it's a word with multiple meanings, give the definition that makes the most sense to how the word is used in the sentence.

Your writing should be pitched at a curious middle/high school student and written to be informative yet not too confusing.

Never use jargon without explaining it. Aim for 3-4 short paragraphs. Include at least 6-8 highlighted key terms. Do not use markdown headings like # or ##.`;

  const QUIZ_SYSTEM = `You are a quiz generator. Based on the topic given, generate exactly 5 multiple choice questions.

You must respond with ONLY a JSON array, no other text, no markdown code blocks. The format should be exactly:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "answer": "...",
    "explanation": "..."
  }
]

Questions should test understanding, not just memorization. The answer field must be the exact text of the correct option, copied word for word from the options array. Never include the answer inside the question itself.`;

  const DIAGRAM_SYSTEM = `You are a diagram generator. Create a very simple SVG diagram for the given topic using only basic shapes: rectangles, circles, arrows (lines with polygon arrowheads), and text labels.

STRICT RULES:
- Return ONLY raw SVG code starting with <svg and ending with </svg>. No other text whatsoever.
- Use viewBox="0 0 600 380" width="100%" xmlns="http://www.w3.org/2000/svg"
- Maximum 15 shapes total. Keep it extremely simple.
- Only use these colors: #3AAFA9 (teal), #8B7FD4 (lavender), #1C1C2E (dark), #5A5A7A (grey), #F0F0F0 (light), #FFFFFF (white)
- Only use rect, circle, line, polygon, text elements. No path, no foreignObject, no image.
- All text must have font-family="Arial, sans-serif"
- If the topic cannot be shown as a simple labeled diagram, return exactly: NO_DIAGRAM
- Good topics: cell division stages, body systems, simple cycles, step-by-step processes
- Bad topics: abstract ideas, history, definitions`;

  const systemPrompt = mode === 'quiz' ? QUIZ_SYSTEM : mode === 'diagram' ? DIAGRAM_SYSTEM : LESSON_SYSTEM;
  const userMessage = mode === 'quiz'
    ? `Generate a quiz about: ${topic}`
    : mode === 'diagram'
    ? `Create a simple labeled diagram for: ${topic}. Use only basic shapes and keep it under 15 elements.`
    : `Write a lesson about: ${topic}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: mode === "diagram" ? 1500 : 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }]
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || "";

  return new Response(JSON.stringify({ result: text }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

export const config = { path: "/api/studylab" };
