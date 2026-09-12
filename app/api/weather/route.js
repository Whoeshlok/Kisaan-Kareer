import { NextResponse } from "next/server";

// Reuse this one route for every weather need (hero widget + alert generation)
// so there is never a second OpenWeather integration in the codebase.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const city = searchParams.get("city");

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENWEATHER_API_KEY not set" }, { status: 500 });
  }

  let url;
  if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  } else if (city) {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
  } else {
    return NextResponse.json({ error: "lat/lon or city is required" }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OpenWeather responded ${res.status}`);
    const data = await res.json();

    return NextResponse.json({
      condition: data.weather?.[0]?.main || "Unknown",
      description: data.weather?.[0]?.description || "",
      tempC: data.main?.temp ?? null,
      humidity: data.main?.humidity ?? null,
      willRain: (data.weather?.[0]?.main || "").toLowerCase().includes("rain"),
      location: data.name || city || "",
    });
  } catch (err) {
    console.error("weather route error:", err);
    return NextResponse.json({ error: "Weather unavailable" }, { status: 502 });
  }
}
