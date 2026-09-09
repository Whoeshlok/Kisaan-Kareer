// Deploy: supabase functions deploy proactive-alerts
// Schedule via pg_cron, e.g. every 3 hours.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async () => {
  const { data: farms } = await supabase.from("farms").select("*, farmers(*)");

  for (const farm of farms ?? []) {
    // Fetch weather + mandi context per farm, then call Gemini
    // via the Next.js /api/decision-engine endpoint (server-to-server).
    const res = await fetch(
      `${Deno.env.get("APP_URL")}/api/decision-engine`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farm }),
      }
    );

    const decision = await res.json();

    if (decision.urgency === "high" || decision.urgency === "medium") {
      await supabase.from("alerts").insert({
        farmer_id: farm.farmer_id,
        type: "proactive",
        message: decision.recommendation,
        urgency: decision.urgency,
      });
    }
  }

  return new Response("done");
});
