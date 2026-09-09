export function buildDiseasePrompt(cropName: string): string {
  return `
You are analyzing a crop/leaf image for the Kisaan Kareer platform.
The farmer's crop is: ${cropName}.
Focus only on this pilot's supported crops. If the image is unclear or not
a plant, say so honestly instead of guessing.

Return ONLY valid JSON in this shape, no markdown:
{
  "diseaseDetected": true | false,
  "diseaseName": "string or null",
  "confidence": 0-100,
  "severity": "low" | "medium" | "high" | "none",
  "nextSteps": ["short actionable step 1", "short actionable step 2"]
}
`.trim();
}
