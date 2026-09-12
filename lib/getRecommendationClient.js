export async function requestRecommendation(farmerProfile, context, task) {
  const res = await fetch("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ farmerProfile, context, task }),
  });
  if (!res.ok) throw new Error("Recommendation request failed");
  return res.json();
}

export async function requestWeather({ lat, lon, city }) {
  const params = new URLSearchParams();
  if (lat && lon) {
    params.set("lat", lat);
    params.set("lon", lon);
  } else if (city) {
    params.set("city", city);
  }
  const res = await fetch(`/api/weather?${params.toString()}`);
  if (!res.ok) return null;
  return res.json();
}
