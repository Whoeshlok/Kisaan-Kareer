"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mic, TrendingUp, Sprout, Bell, CloudSun } from "lucide-react";
import QuickAccessCard from "@/components/QuickAccessCard";
import {
  getFarmerProfile,
  getBestMandiPriceForCrop,
  getUnreadAlertCount,
  getAlerts,
} from "@/lib/supabaseClient";
import { requestRecommendation, requestWeather } from "@/lib/getRecommendationClient";

// TODO: replace with real auth/session profile id once auth exists.
const DEMO_PROFILE_ID = process.env.NEXT_PUBLIC_DEMO_PROFILE_ID || "demo-farmer";

export default function HomePage() {
  const [profile, setProfile] = useState(null);
  const [weather, setWeather] = useState(null);
  const [mandiSubtitle, setMandiSubtitle] = useState("Nearby mandi prices");
  const [alertsSubtitle, setAlertsSubtitle] = useState("Loading live farm data...");
  const [roadmap, setRoadmap] = useState(null);

  useEffect(() => {
    (async () => {
      const p = await getFarmerProfile(DEMO_PROFILE_ID);
      setProfile(p);
      if (!p) return;

      // Weather for the hero card
      if (p.lat && p.lon) {
        const w = await requestWeather({ lat: p.lat, lon: p.lon });
        setWeather(w);
      } else if (p.location) {
        const w = await requestWeather({ city: p.location });
        setWeather(w);
      }

      // Change 2: Mandi card shows the farmer's crop's current best price
      const priceRow = await getBestMandiPriceForCrop(p.crop);
      if (priceRow) {
        const arrow = priceRow.change_pct > 0 ? "↑" : priceRow.change_pct < 0 ? "↓" : "";
        setMandiSubtitle(`${priceRow.crop} ₹${priceRow.price} ${arrow}`.trim());
      } else {
        setMandiSubtitle("Nearby mandi prices");
      }

      // Change 3: run the proactive alert check on Home load too
      const mandiForAlert = priceRow;
      requestRecommendation(
        p,
        { weather: weather, mandiPrice: mandiForAlert },
        "alert"
      ).catch(() => {});

      // Change 2: Alerts card shows unread count / most recent title
      const unread = await getUnreadAlertCount(p.id);
      if (unread > 0) {
        setAlertsSubtitle(`${unread} new alert${unread > 1 ? "s" : ""}`);
      } else {
        const [latest] = await getAlerts(p.id);
        setAlertsSubtitle(latest ? latest.title : "No alerts today");
      }

      // Roadmap hero card
      const rm = await requestRecommendation(p, { weather, mandiPrice: priceRow }, "roadmap");
      setRoadmap(rm?.items?.[0] || null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstName = profile?.name?.split(" ")[0] || "there";

  return (
    <div className="px-5 pt-2">
      <div className="rounded-lg bg-green-950 text-cream-50 p-5 flex flex-col gap-1 relative overflow-hidden">
        <p className="text-xs text-green-200 flex items-center gap-1">
          <CloudSun size={14} /> {profile?.location || "Your farm"}
        </p>
        <h1 className="text-2xl font-semibold">Good morning, {firstName}</h1>
        <p className="text-sm text-green-200">Here is what matters for your farm today.</p>

        <div className="absolute top-4 right-4 text-right text-xs text-green-200">
          {weather ? (
            <>
              <p>{Math.round(weather.tempC)}°C</p>
              <p>{weather.description}</p>
            </>
          ) : (
            <p>Weather unavailable</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 mb-3">
        <h2 className="text-sm font-medium text-ink-900">Quick access</h2>
        <Link href="#" className="text-xs text-ink-600">
          View all
        </Link>
      </div>

      {/* Change 1: Ask, Mandi, Organic Advisor (hero), Alerts */}
      <div className="grid grid-cols-2 gap-3">
        <QuickAccessCard
          href="/ask"
          icon={Mic}
          title="Ask"
          subtitle="Tell me in the way that feels easiest."
        />
        <QuickAccessCard
          href="/mandi"
          icon={TrendingUp}
          title="Mandi"
          subtitle={mandiSubtitle}
        />
        <QuickAccessCard
          href="/organic-advisor"
          icon={Sprout}
          title="Organic Advisor"
          subtitle="A safer switch, one step at a time"
          hero
        />
        <QuickAccessCard
          href="/alerts"
          icon={Bell}
          title="Alerts"
          subtitle={alertsSubtitle}
        />
      </div>

      {roadmap && (
        <div className="mt-6 rounded-lg bg-paper border border-line p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-ink-900">Your day on the farm</h3>
            <span className="text-xs text-ink-400">{roadmap.date}</span>
          </div>
          <p className="text-sm font-medium text-ink-900">{roadmap.title}</p>
          <p className="text-xs text-ink-600 mt-1">{roadmap.detail}</p>
        </div>
      )}
    </div>
  );
}
