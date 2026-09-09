export function buildIntentPrompt(message: string): string {
  return `
Classify this farmer message into ONE intent for routing purposes.
Message: "${message}"

Return ONLY JSON:
{
  "intent": "disease_check" | "general_decision" | "price_query" | "weather_query" | "other"
}
`.trim();
}
