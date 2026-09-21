const OpenAI = require('openai');
const { heuristicScore } = require('./heuristic');

// Lazy client — do NOT create OpenAI at import time or the server
// crashes when OPENAI_API_KEY is missing.
function getGroqClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.startsWith('your_') || key === 'replace_with_a_long_random_string') {
    return null;
  }
  return new OpenAI({
    apiKey: key,
    baseURL: 'https://api.groq.com/openai/v1',
  });
}

const JUDGE_SYSTEM_PROMPT = `You are a careful writing-analysis assistant.
Given a piece of text, judge how likely it is to be AI-generated versus human-written.
Consider: uniformity of sentence structure, overuse of generic transition phrases,
vocabulary variety, presence of personal opinion/informal markers, and repetitiveness.

Respond with ONLY a JSON object, no extra text, in exactly this shape:
{"aiProbability": <integer 0-100>, "reasoning": "<one or two sentence explanation>"}`;

function parseModelJson(raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Model returned empty content');
  }
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Model did not return a JSON object');
  const parsed = JSON.parse(match[0]);

  if (
    typeof parsed.aiProbability !== 'number' ||
    Number.isNaN(parsed.aiProbability) ||
    parsed.aiProbability < 0 ||
    parsed.aiProbability > 100
  ) {
    throw new Error('Model returned an invalid aiProbability value');
  }
  return {
    aiProbability: Math.round(parsed.aiProbability),
    reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning.trim() : null,
  };
}

/**
 * Analyze text for likely AI vs human authorship.
 * Primary signal: LLM judgment. Secondary: heuristic fallback.
 */
async function analyzeText(text) {
  const cleaned = text.trim();
  const heuristic = heuristicScore(cleaned);

  const groq = getGroqClient();
  if (!groq) {
    return {
      ai: heuristic.ai,
      human: heuristic.human,
      wordCount: heuristic.wordCount,
      source: 'heuristic_fallback',
      modelReasoning: null,
      heuristicScore: { ai: heuristic.ai, human: heuristic.human },
    };
  }

  try {
    // Valid Groq models (as of 2025/2026): llama-3.3-70b-versatile,
    // llama-3.1-8b-instant, mixtral-8x7b-32768, gemma2-9b-it, etc.
    // Using a fast, high-quality open model available on Groq.
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: JUDGE_SYSTEM_PROMPT },
        { role: 'user', content: cleaned.slice(0, 6000) },
      ],
      temperature: 0.2,
      max_tokens: 200,
    });

    const raw = completion.choices?.[0]?.message?.content;
    const { aiProbability, reasoning } = parseModelJson(raw);

    const blendedAi = Math.round(aiProbability * 0.75 + heuristic.ai * 0.25);
    const ai = Math.min(98, Math.max(2, blendedAi));
    const human = 100 - ai;

    return {
      ai,
      human,
      wordCount: heuristic.wordCount,
      source: 'ai_model',
      modelReasoning: reasoning,
      heuristicScore: { ai: heuristic.ai, human: heuristic.human },
    };
  } catch (err) {
    // Network error, rate limit, bad model response, etc. — degrade gracefully
    console.error('AI provider call failed, falling back to heuristic:', err.message);
    return {
      ai: heuristic.ai,
      human: heuristic.human,
      wordCount: heuristic.wordCount,
      source: 'heuristic_fallback',
      modelReasoning: null,
      heuristicScore: { ai: heuristic.ai, human: heuristic.human },
    };
  }
}

module.exports = { analyzeText };
