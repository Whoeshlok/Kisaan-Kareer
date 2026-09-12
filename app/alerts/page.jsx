"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
  getFarmerProfile,
  getAlerts,
  getBestMandiPriceForCrop,
} from "@/lib/supabaseClient";
import { requestRecommendation, requestWeather } from "@/lib/getRecommendationClient";

const DEMO_PROFILE_ID = process.env.NEXT_PUBLIC_DEMO_PROFILE_ID || "demo-farmer";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const profile = await getFarmerProfile(DEMO_PROFILE_ID);
      if (!profile) {
        setChecking(false);
        return;
      }

      // Change 3: proactive alert check, reusing the same getRecommendation call.
      const weather = profile.lat && profile.lon
        ? await requestWeather({ lat: profile.lat, lon: profile.lon })
        : profile.location
        ? await requestWeather({ city: profile.location })
        : null;
      const mandiPrice = await getBestMandiPriceForCrop(profile.crop);

      try {
        await requestRecommendation(profile, { weather, mandiPrice }, "alert");
      } catch (e) {
        // Non-fatal — the alert list below still loads whatever already exists.
        console.error("proactive alert check failed", e);
      }

      const rows = await getAlerts(profile.id);
      setAlerts(rows);
      setChecking(false);
    })();
  }, []);

  return (
    <div className="px-5 pt-4">
      <h1 className="text-lg font-semibold text-ink-900 mb-1">Alerts</h1>
      <p className="text-xs text-ink-400 mb-4">
        {checking ? "Checking for anything worth flagging today..." : `${alerts.length} alert${alerts.length === 1 ? "" : "s"}`}
      </p>

      <div className="flex flex-col gap-2">
        {alerts.length === 0 && !checking && (
          <p className="text-sm text-ink-400">Nothing to flag today. Check back tomorrow.</p>
        )}
        {alerts.map((a) => (
          <div key={a.id} className="rounded-md bg-paper border border-line p-3 flex gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-sm bg-clay-100 text-clay-500 shrink-0">
              <Bell size={16} />
            </span>
            <div>
              <p className="text-sm font-medium text-ink-900">{a.title}</p>
              <p className="text-xs text-ink-600 mt-0.5">{a.detail}</p>
              <p className="text-xs text-ink-400 mt-1">{formatWhen(a.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatWhen(createdAt) {
  if (!createdAt) return "Just now";
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(createdAt).toLocaleDateString();
}
