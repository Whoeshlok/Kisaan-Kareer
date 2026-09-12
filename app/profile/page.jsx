"use client";

import { useEffect, useState } from "react";
import { getFarmerProfile, saveFarmerProfile } from "@/lib/supabaseClient";

const DEMO_PROFILE_ID = process.env.NEXT_PUBLIC_DEMO_PROFILE_ID || "demo-farmer";

const FIELDS = [
  { key: "name", label: "Name" },
  { key: "location", label: "Location" },
  { key: "language", label: "Preferred language" },
  { key: "crop", label: "Crop" },
  { key: "variety", label: "Variety" },
  { key: "crop_stage", label: "Crop stage" },
  { key: "farm_size", label: "Farm size" },
  { key: "irrigation_method", label: "Irrigation method" },
  { key: "organic_preference", label: "Organic vs conventional" },
];

export default function ProfilePage() {
  const [form, setForm] = useState({ id: DEMO_PROFILE_ID });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getFarmerProfile(DEMO_PROFILE_ID).then((p) => {
      if (p) setForm(p);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await saveFarmerProfile(form);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-5 pt-4">
      <h1 className="text-lg font-semibold text-ink-900 mb-1">Your farm profile</h1>
      <p className="text-sm text-ink-600 mb-4">
        This is the brain every other feature reads from — keep it up to date.
      </p>

      <div className="flex flex-col gap-3">
        {FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className="text-xs text-ink-600">{label}</label>
            <input
              value={form[key] || ""}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full mt-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-5 rounded-md bg-green-800 text-paper py-3 font-medium disabled:opacity-60"
      >
        {saving ? "Saving..." : saved ? "Saved ✓" : "Save changes"}
      </button>
    </div>
  );
}
