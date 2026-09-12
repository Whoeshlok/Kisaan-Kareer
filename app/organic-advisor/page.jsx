"use client";

import { useState, useEffect } from "react";
import { Sprout, ShieldAlert, CheckCircle2, ListChecks } from "lucide-react";
import { getFarmerProfile } from "@/lib/supabaseClient";
import { requestRecommendation } from "@/lib/getRecommendationClient";

const DEMO_PROFILE_ID = process.env.NEXT_PUBLIC_DEMO_PROFILE_ID || "demo-farmer";

export default function OrganicAdvisorPage() {
  const [profile, setProfile] = useState(null);
  const [cards, setCards] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getFarmerProfile(DEMO_PROFILE_ID).then(setProfile);
  }, []);

  async function handleAsk() {
    setLoading(true);
    try {
      const result = await requestRecommendation(profile, {}, "organic");
      setCards(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center gap-2 mb-1">
        <Sprout size={20} color="var(--gold-500)" />
        <h1 className="text-lg font-semibold text-ink-900">Organic Advisor</h1>
      </div>
      <p className="text-sm text-ink-600 mb-5">
        A safer switch to organic farming, one step at a time — tailored to your {profile?.crop || "crop"}.
      </p>

      {!cards && (
        <button
          onClick={handleAsk}
          disabled={loading || !profile}
          className="w-full rounded-md bg-gold-500 text-paper py-3 font-medium disabled:opacity-60"
        >
          {loading ? "Thinking..." : "Should I switch to organic?"}
        </button>
      )}

      {cards && (
        <div className="flex flex-col gap-3 mt-2">
          <AdvisorCard
            icon={ShieldAlert}
            label="The common fear"
            title={cards.fear?.title}
            detail={cards.fear?.detail}
            accent="var(--clay-500)"
          />
          <AdvisorCard
            icon={CheckCircle2}
            label="The counter-fact"
            title={cards.counterFact?.title}
            detail={cards.counterFact?.detail}
            accent="var(--sky-500)"
          />
          <AdvisorCard
            icon={ListChecks}
            label="Your phased step"
            title={cards.phasedStep?.title}
            detail={cards.phasedStep?.detail}
            accent="var(--green-600)"
          />
        </div>
      )}
    </div>
  );
}

function AdvisorCard({ icon: Icon, label, title, detail, accent }) {
  return (
    <div className="rounded-md bg-paper border border-line p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} color={accent} />
        <span className="text-xs font-medium" style={{ color: accent }}>
          {label}
        </span>
      </div>
      <p className="text-sm font-medium text-ink-900">{title}</p>
      <p className="text-xs text-ink-600 mt-1">{detail}</p>
    </div>
  );
}
