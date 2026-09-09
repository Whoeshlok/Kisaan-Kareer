import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const farmerId = req.nextUrl.searchParams.get("farmerId");
  const supabase = createClient();

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("farmer_id", farmerId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alerts: data });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();

  const { error } = await supabase.from("alerts").insert({
    farmer_id: body.farmerId,
    type: body.type,
    message: body.message,
    urgency: body.urgency ?? "low",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
