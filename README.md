# Kisaan Kareer

Farmer field companion — Next.js (App Router) + Tailwind CSS + Supabase + Gemini + OpenWeather.

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill in your real keys
npm run dev
```

## Environment variables (`.env.local`)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase project
- `GEMINI_API_KEY` — Google AI Studio key, used by `lib/geminiEngine.js`
- `OPENWEATHER_API_KEY` — used by `app/api/weather/route.js`
- `NEXT_PUBLIC_DEMO_PROFILE_ID` (optional) — until real auth exists, every page reads/writes
  this one profile id. Defaults to `demo-farmer`.

## Supabase schema this code expects

If your existing tables use different names/columns, the only files that need updating are
`lib/supabaseClient.js` (queries) — everything else calls those helper functions.

```sql
create table profiles (
  id text primary key,
  name text,
  location text,
  lat float8,
  lon float8,
  language text,
  crop text,
  variety text,
  crop_stage text,
  farm_size text,
  irrigation_method text,
  organic_preference text
);

create table mandi_prices (
  id uuid primary key default gen_random_uuid(),
  crop text,
  market text,
  price numeric,
  unit text,
  change_pct numeric,
  updated_at timestamptz default now()
);

create table alerts (
  id uuid primary key default gen_random_uuid(),
  profile_id text references profiles(id),
  title text,
  detail text,
  read boolean default false,
  created_at timestamptz default now()
);
```

## How the one shared AI function works

`lib/geminiEngine.js` exports `getRecommendation(farmerProfile, context, task)`, called from the
server-side `/api/recommend` route. `task` is one of `"roadmap"`, `"organic"`, `"ask"`, `"alert"` —
each builds a different prompt but shares the same Gemini call. The client never calls Gemini
directly; it calls `requestRecommendation()` from `lib/getRecommendationClient.js`, which hits
`/api/recommend`.

## What's implemented

- **Home** — hero greeting + live weather, quick access (Ask, Mandi, Organic Advisor, Alerts)
  with live Mandi/Alerts subtitles, AI roadmap card
- **Organic Advisor** — "Should I switch to organic?" → 3 tailored cards (fear / counter-fact / phased step)
- **Ask** — typed question, Web Speech API voice input, photo entry point (UI only)
- **Mandi** — live prices from Supabase, filtered by the farmer's crop or all crops
- **Alerts** — runs the proactive Gemini alert check on page load (also triggered from Home),
  writes a new alert into Supabase if one is warranted, lists all alerts
- **Profile** — view/edit the farmer field profile that every other feature reads from
- **Onboarding** — the single form that creates the profile

## Known gaps / next steps

- No real auth — everything is scoped to `NEXT_PUBLIC_DEMO_PROFILE_ID`
- Photo upload on the Ask page is UI-only (no image model wired up)
- Voice output (text-to-speech for the answer) isn't wired — only speech-to-text input is
- Bottom nav intentionally left untouched (Home, Ask, Mandi, Alerts, Profile)
