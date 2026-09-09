import { WeatherSnapshot } from "@/types";

// Swap in India Meteorological Department (IMD) API or OpenWeather here.
export async function getWeather(location: string): Promise<WeatherSnapshot> {
  const apiKey = process.env.WEATHER_API_KEY!;
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      location
    )}&appid=${apiKey}&units=metric`,
    { next: { revalidate: 1800 } }
  );

  if (!res.ok) throw new Error("Weather fetch failed");
  const data = await res.json();

  return {
    temperature_c: data.main.temp,
    rainfall_probability: data.rain ? 80 : 20,
    humidity: data.main.humidity,
    wind_kmph: data.wind.speed * 3.6,
    summary: data.weather?.[0]?.description ?? "Clear",
  };
}
