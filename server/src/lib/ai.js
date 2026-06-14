import OpenAI from "openai";

const MODEL = "deepseek-ai/DeepSeek-V3-0324";
let aiClient = null;

function getAI() {
  if (!aiClient) {
    aiClient = new OpenAI({
      baseURL: "https://api.featherless.ai/v1",
      apiKey: process.env.FEATHERLESS_API_KEY,
    });
  }
  return aiClient;
}

function normalizeSources(sources) {
  if (!Array.isArray(sources)) return [];

  return sources
    .map((source) => {
      if (!source) return null;
      if (typeof source === "string") {
        return { title: source, url: source };
      }
      if (typeof source === "object") {
        const title = typeof source.title === "string" ? source.title.trim() : "";
        const url = typeof source.url === "string" ? source.url.trim() : "";
        if (!url) return null;
        return { title: title || url, url };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 2);
}

export async function generateCurriculum(topic, difficulty = "Intermediate") {
  const prompt = `You are an expert curriculum designer and educator with deep knowledge across 
all subjects. Generate a comprehensive, accurate learning curriculum for the 
given topic.

For each lesson node, write 6-8 sentences that:
- Explain the concept clearly and thoroughly
- Include a concrete real-world example or analogy
- Connect to adjacent concepts where relevant

For sources, include 2 real, well-known URLs per node that a learner can visit 
for more context. Only include URLs you are highly confident exist and are 
relevant - prefer Wikipedia, Khan Academy, MDN, official documentation, or 
major educational institutions.

Difficulty level: ${difficulty}
- Beginner: plain language, everyday analogies, no assumed prior knowledge
- Intermediate: proper terminology, practical context, assumes basic familiarity
- Advanced: technical depth, edge cases, common misconceptions, assumes strong 
  prior knowledge

Return ONLY valid JSON, no markdown, no explanation:
{
  "topic": "...",
  "branches": [
    {
      "title": "Branch title (major concept)",
      "nodes": [
        {
          "title": "Lesson title",
          "lesson": "6-8 sentence detailed explanation with example",
          "sources": [
            { "title": "Source name", "url": "https://..." },
            { "title": "Source name", "url": "https://..." }
          ]
        }
      ]
    }
  ]
}

Generate 3-4 branches, each with 3-4 nodes. Order from foundational to advanced.

Topic: ${topic}
Difficulty: ${difficulty}`;

  const response = await fetch("https://api.featherless.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.FEATHERLESS_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Curriculum generation failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Curriculum generation failed: empty model response");
  }
  const cleaned = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  const curriculum = JSON.parse(cleaned);
  curriculum.branches = Array.isArray(curriculum.branches) ? curriculum.branches : [];
  curriculum.branches = curriculum.branches.map((branch) => ({
    ...branch,
    nodes: Array.isArray(branch.nodes)
      ? branch.nodes.map((node) => ({
          ...node,
          sources: normalizeSources(node.sources),
        }))
      : [],
  }));
  return curriculum;
}

export async function generateQuestion(lessonContent, difficulty) {
  const prompt = `You are a tutor. The learner just studied this lesson: "${lessonContent}"
Ask ONE question that tests understanding of ONLY what was covered in this 
lesson. Do not ask about concepts not mentioned in the lesson. Frame it as 
'Based on what you just learned...' Keep it proportional to this difficulty 
level: ${difficulty}. Return only the question, nothing else.`;

  const res = await getAI().chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 256,
  });

  return res.choices[0].message.content.trim();
}

export async function evaluateAnswer(lessonContent, question, answer) {
  const prompt = `Lesson: "${lessonContent}"
Question asked: "${question}"
Learner's answer: "${answer}"
Score this answer from 0-100. Be strict - partial understanding scores 40-60, solid understanding scores 70-85, excellent scores 86-100. Return ONLY a JSON object:
{"score": <integer>, "feedback": "<one sentence of specific feedback>"}`;

  const res = await getAI().chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 256,
  });

  const text = res.choices[0].message.content.trim();
  const cleaned = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}
