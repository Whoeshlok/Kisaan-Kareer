import { NextResponse } from "next/server";
import { getRecommendation } from "@/lib/geminiEngine";
import { insertAlert } from "@/lib/supabaseClient";

export async function POST(request) {
  try {
    const { farmerProfile, context, task } = await request.json();
    if (!task) {
      return NextResponse.json({ error: "task is required" }, { status: 400 });
    }

    const result = await getRecommendation(farmerProfile, context, task);

    // Proactive alerts: if Gemini found something worth flagging, write it
    // straight into Supabase so the Alerts page just reads the table.
    if (task === "alert" && result?.alert && farmerProfile?.id) {
      const saved = await insertAlert(farmerProfile.id, result.alert.title, result.alert.detail);
      return NextResponse.json({ alert: saved });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("recommend route error:", err);
    return NextResponse.json({ error: "Failed to get recommendation" }, { status: 500 });
  }
}
