// QVAC Personal Mission Statement Writer — core logic.
// Given core values and what the user wants to be known for, writes a short
// personal mission statement grounded in those specifics.

import { completion } from "@qvac/sdk";

function looksUnusable(text) {
  if (!text || text.trim().length === 0) return true;
  if (text.length > 700) return true;
  const bad = ["i cannot", "i can't", "as an ai", "i'm not able", "i am not able"];
  const lower = text.toLowerCase();
  return bad.some((phrase) => lower.includes(phrase));
}

function cleanText(text) {
  return text
    .trim()
    .replace(/^here'?s[^:\n]*:\s*/i, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

// Grounding check: the statement should actually mention at least one
// significant word from the user's values or "known for" input, so it
// doesn't drift into a generic statement disconnected from what was typed.
function isGrounded(statement, values, knownFor) {
  const combined = `${values} ${knownFor}`.toLowerCase();
  let inputWords = combined.split(/[^a-z0-9]+/).filter((w) => w.length > 4);
  // If every word in the input is short (e.g. "fun", "art", "kids"), the
  // length>4 filter used to leave inputWords empty, which made the check
  // trivially pass with no real grounding verified. Fall back to shorter
  // words (still skipping filler words) so short inputs are still checked.
  if (inputWords.length === 0) {
    const filler = new Set(["and", "for", "the", "with", "that", "who"]);
    inputWords = combined.split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !filler.has(w));
  }
  if (inputWords.length === 0) return true;
  const lowerStatement = statement.toLowerCase();
  return inputWords.some((w) => lowerStatement.includes(w));
}

function fallbackStatement(values, knownFor) {
  return `I strive to live by ${values}, and to be known for ${knownFor}. Every day, I aim to act in ways that reflect these values and move me closer to that reputation.`;
}

export async function writeMission(modelId, body) {
  const values = (body.values || "").trim();
  const knownFor = (body.knownFor || "").trim();
  if (!values || !knownFor) {
    const err = new Error("Please fill in both your core values and what you want to be known for.");
    err.statusCode = 400;
    throw err;
  }

  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          "You write short personal mission statements. Given the person's core " +
          "values and what they want to be known for, write ONE short mission " +
          "statement (2-3 sentences) in first person that is clearly grounded " +
          "in the specific values and reputation they listed. Do not invent " +
          "values or goals they didn't mention. Reply with ONLY the statement, " +
          "no preamble, no quotes.",
      },
      {
        role: "user",
        content: "Core values: honesty, curiosity, resilience. Want to be known for: helping others grow.",
      },
      {
        role: "assistant",
        content:
          "I lead with honesty and curiosity, staying resilient through setbacks so I can " +
          "keep showing up for the people around me. My aim is to be known as someone who " +
          "helps others grow, one honest conversation and one small act of encouragement at a time.",
      },
      {
        role: "user",
        content: `Core values: ${values}. Want to be known for: ${knownFor}.`,
      },
    ],
    stream: true,
    completionOpts: { temperature: 0.7, maxTokens: 200 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;
  text = cleanText(text);

  const usable = !looksUnusable(text) && isGrounded(text, values, knownFor);
  const statement = usable ? text : fallbackStatement(values, knownFor);

  return { values, knownFor, statement };
}
