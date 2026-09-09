import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const textModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export const visionModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export async function generateJSON<T>(prompt: string): Promise<T> {
  const result = await textModel.generateContent(prompt);
  const raw = result.response.text();
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as T;
}
