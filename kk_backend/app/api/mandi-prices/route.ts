import { NextRequest, NextResponse } from "next/server";
import { getMandiPrice } from "@/lib/external/mandiApi";

export async function GET(req: NextRequest) {
  const crop = req.nextUrl.searchParams.get("crop");
  const location = req.nextUrl.searchParams.get("location") ?? "";

  if (!crop) {
    return NextResponse.json({ error: "crop required" }, { status: 400 });
  }

  const price = await getMandiPrice(crop, location);
  return NextResponse.json({ price });
}
