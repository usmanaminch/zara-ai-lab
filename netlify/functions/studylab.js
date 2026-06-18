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

Never use jargon without explaining it. Aim for 3-4 short paragraphs. Include at least 6-8 highlighted key terms.`;

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

  const systemPrompt = mode === 'quiz' ? QUIZ_SYSTEM : LESSON_SYSTEM;
  const userMessage = mode === 'quiz'
    ? `Generate a quiz about: ${topic}`
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
      max_tokens: 2000,
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
