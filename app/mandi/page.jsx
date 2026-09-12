"use client";

import { useEffect, useState } from "react";
import { getFarmerProfile, getMandiPrices } from "@/lib/supabaseClient";

const DEMO_PROFILE_ID = process.env.NEXT_PUBLIC_DEMO_PROFILE_ID || "demo-farmer";

export default function MandiPage() {
  const [profile, setProfile] = useState(null);
  const [prices, setPrices] = useState([]);
  const [filter, setFilter] = useState("mine"); // "mine" | "all"

  useEffect(() => {
    (async () => {
      const p = await getFarmerProfile(DEMO_PROFILE_ID);
      setProfile(p);
      const rows = await getMandiPrices(filter === "mine" ? p?.crop : null);
      setPrices(rows);
    })();
  }, [filter]);

  return (
    <div className="px-5 pt-4">
      <h1 className="text-lg font-semibold text-ink-900 mb-3">Mandi prices</h1>

      <div className="flex gap-2 mb-4">
        <TabButton active={filter === "mine"} onClick={() => setFilter("mine")}>
          My crop{profile?.crop ? ` (${profile.crop})` : ""}
        </TabButton>
        <TabButton active={filter === "all"} onClick={() => setFilter("all")}>
          All crops
        </TabButton>
      </div>

      <div className="flex flex-col gap-2">
        {prices.length === 0 && (
          <p className="text-sm text-ink-400">No price data yet.</p>
        )}
        {prices.map((row) => (
          <div
            key={row.id}
            className="rounded-md bg-paper border border-line p-3 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-ink-900">{row.crop}</p>
              <p className="text-xs text-ink-600">{row.market}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-ink-900">
                ₹{row.price} <span className="text-xs text-ink-600">/{row.unit}</span>
              </p>
              {typeof row.change_pct === "number" && (
                <p
                  className="text-xs"
                  style={{ color: row.change_pct >= 0 ? "var(--green-600)" : "var(--clay-500)" }}
                >
                  {row.change_pct >= 0 ? "↑" : "↓"} {Math.abs(row.change_pct)}%
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-sm text-xs font-medium border ${
        active
          ? "bg-green-800 text-paper border-green-800"
          : "bg-paper text-ink-600 border-line"
      }`}
    >
      {children}
    </button>
  );
}
