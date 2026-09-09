import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSON, textModel } from "@/lib/gemini/client";
import { buildIntentPrompt } from "@/lib/gemini/chatPrompt";
import { buildDecisionPrompt } from "@/lib/gemini/decisionPrompt";
import { DecisionEngineInput, DecisionEngineOutput } from "@/types";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();
  const { farmerId, message, context } = body as {
    farmerId: string;
    message: string;
    context: DecisionEngineInput;
  };

  // 1. store farmer message
  await supabase.from("chat_messages").insert({
    farmer_id: farmerId,
    role: "farmer",
    type: "text",
    content: message,
  });

  // 2. classify intent
  const { intent } = await generateJSON<{ intent: string }>(
    buildIntentPrompt(message)
  );

  let replyText: string;

  if (intent === "general_decision" || intent === "price_query" || intent === "weather_query") {
    const decision = await generateJSON<DecisionEngineOutput>(
      buildDecisionPrompt({ ...context, question: message })
    );
    replyText = `${decision.recommendation} ${decision.reasoning}`;
  } else {
    // fallback: plain conversational answer, still farmer-context aware
    const result = await textModel.generateContent(
      `You are Kisaan Kareer's farming assistant. Farmer asked: "${message}".
       Answer briefly and practically in ${context.farmer.preferred_language}.`
    );
    replyText = result.response.text();
  }

  // 3. store AI reply
  await supabase.from("chat_messages").insert({
    farmer_id: farmerId,
    role: "ai",
    type: "text",
    content: replyText,
  });

  return NextResponse.json({ reply: replyText });
}
