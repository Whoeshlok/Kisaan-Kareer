import { NextRequest, NextResponse } from "next/server";
import { getWeather } from "@/lib/external/weatherApi";

export async function GET(req: NextRequest) {
  const location = req.nextUrl.searchParams.get("location");
  if (!location) {
    return NextResponse.json({ error: "location required" }, { status: 400 });
  }

  try {
    const weather = await getWeather(location);
    return NextResponse.json(weather);
  } catch (err) {
    return NextResponse.json({ error: "weather fetch failed" }, { status: 500 });
  }
}
