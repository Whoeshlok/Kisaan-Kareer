import { NextRequest, NextResponse } from "next/server";
import { visionModel } from "@/lib/gemini/client";
import { buildDiseasePrompt } from "@/lib/gemini/diseasePrompt";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    const cropName = (formData.get("crop") as string) ?? "unknown crop";

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = bytes.toString("base64");

    const result = await visionModel.generateContent([
      buildDiseasePrompt(cropName),
      { inlineData: { data: base64, mimeType: file.type } },
    ]);

    const raw = result.response.text().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("disease-detection error", err);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
