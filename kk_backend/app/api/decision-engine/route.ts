import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini/client";
import { buildDecisionPrompt } from "@/lib/gemini/decisionPrompt";
import { DecisionEngineInput, DecisionEngineOutput } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DecisionEngineInput;
    const prompt = buildDecisionPrompt(body);

    const result = await generateJSON<DecisionEngineOutput>(prompt);

    return NextResponse.json(result);
  } catch (err) {
    console.error("decision-engine error", err);
    return NextResponse.json(
      { error: "Failed to generate recommendation" },
      { status: 500 }
    );
  }
}
