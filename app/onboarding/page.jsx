"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveFarmerProfile } from "@/lib/supabaseClient";

const DEMO_PROFILE_ID = process.env.NEXT_PUBLIC_DEMO_PROFILE_ID || "demo-farmer";

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    id: DEMO_PROFILE_ID,
    name: "",
    location: "",
    language: "English",
    crop: "",
    variety: "",
    crop_stage: "",
    farm_size: "",
    irrigation_method: "",
    organic_preference: "conventional",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveFarmerProfile(form);
      router.push("/");
    } finally {
      setSaving(false);
    }
  }

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="px-5 pt-6">
      <h1 className="text-xl font-semibold text-ink-900 mb-1">Your field companion is ready</h1>
      <p className="text-sm text-ink-600 mb-5">
        A couple of quick details, and every screen after this is built around your farm.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Name" value={form.name} onChange={(v) => update("name", v)} required />
        <Field label="Location (village/town)" value={form.location} onChange={(v) => update("location", v)} required />

        <div>
          <label className="text-xs text-ink-600">Preferred language</label>
          <select
            value={form.language}
            onChange={(e) => update("language", e.target.value)}
            className="w-full mt-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900"
          >
            <option>English</option>
            <option>हिंदी</option>
            <option>मराठी</option>
          </select>
        </div>

        <Field label="Crop" value={form.crop} onChange={(v) => update("crop", v)} required />
        <Field label="Variety" value={form.variety} onChange={(v) => update("variety", v)} />

        <div>
          <label className="text-xs text-ink-600">Current crop stage</label>
          <select
            value={form.crop_stage}
            onChange={(e) => update("crop_stage", e.target.value)}
            className="w-full mt-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900"
          >
            <option value="">Select stage</option>
            <option>Sowing</option>
            <option>Vegetative</option>
            <option>Flowering</option>
            <option>Fruiting</option>
            <option>Harvest</option>
          </select>
        </div>

        <Field label="Farm size (acres)" value={form.farm_size} onChange={(v) => update("farm_size", v)} />
        <Field
          label="Irrigation method"
          value={form.irrigation_method}
          onChange={(v) => update("irrigation_method", v)}
        />

        <div>
          <label className="text-xs text-ink-600">Organic vs conventional</label>
          <select
            value={form.organic_preference}
            onChange={(e) => update("organic_preference", e.target.value)}
            className="w-full mt-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900"
          >
            <option value="conventional">Conventional</option>
            <option value="organic">Organic</option>
            <option value="considering">Considering organic</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full mt-2 rounded-md bg-gold-500 text-paper py-3 font-medium disabled:opacity-60"
        >
          {saving ? "Setting up..." : "Get started"}
        </button>
        <p className="text-xs text-center text-ink-400">Your farm details stay tied to your profile only.</p>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, required }) {
  return (
    <div>
      <label className="text-xs text-ink-600">{label}</label>
      <input
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900"
      />
    </div>
  );
}
