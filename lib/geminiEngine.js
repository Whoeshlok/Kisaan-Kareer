import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * The one shared AI function. Every feature (roadmap, organic advisor,
 * ask/voice chat, proactive alerts) calls this with a different `task`.
 *
 * @param {object} farmerProfile - row from `profiles`
 * @param {object} context - extra data for this call (weather, mandi price, question text, etc.)
 * @param {"roadmap"|"organic"|"ask"|"alert"} task
 * @returns {Promise<object>} parsed JSON matching the shape for that task
 */
export async function getRecommendation(farmerProfile, context, task) {
  const prompt = buildPrompt(farmerProfile, context, task);

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });

  const raw = result.response.text();
  try {
    return JSON.parse(raw);
  } catch (e) {
    // Gemini occasionally wraps JSON in prose/backticks despite the config — salvage it.
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Gemini did not return parseable JSON");
  }
}

function buildPrompt(farmerProfile, context, task) {
  const profileBlock = `Farmer profile:\n${JSON.stringify(farmerProfile || {}, null, 2)}`;
  const contextBlock = `Context:\n${JSON.stringify(context || {}, null, 2)}`;

  switch (task) {
    case "roadmap":
      return `${profileBlock}\n${contextBlock}\n\nYou are an agricultural advisor. Based on the farmer's profile, current weather, crop stage, and mandi prices, return 2-3 short, dated action items for today. Respond ONLY as JSON: {"items":[{"date":"...","title":"...","detail":"..."}]}`;

    case "organic":
      return `${profileBlock}\n${contextBlock}\n\nThe farmer tapped "Should I switch to organic?". Considering their crop and current practice, respond ONLY as JSON with exactly these three cards: {"fear":{"title":"...","detail":"..."},"counterFact":{"title":"...","detail":"..."},"phasedStep":{"title":"...","detail":"..."}}. Keep each detail to one short sentence.`;

    case "ask":
      return `${profileBlock}\n${contextBlock}\n\nThe farmer asked: "${context?.question || ""}". Answer plainly and practically in their context. Respond ONLY as JSON: {"answer":"..."}`;

    case "alert":
      return `${profileBlock}\n${contextBlock}\n\nUsing the farmer's profile, current weather, and current mandi price for their crop, decide if there is ONE thing genuinely worth flagging today (e.g. weather risk, a price spike, a pest/irrigation timing issue). If nothing is worth flagging, return {"alert":null}. Otherwise respond ONLY as JSON: {"alert":{"title":"...","detail":"..."}}. The title should be under 6 words and the detail a single short sentence.`;

    default:
      throw new Error(`Unknown task: ${task}`);
  }
}
