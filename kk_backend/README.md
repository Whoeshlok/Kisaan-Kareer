# Kisaan Kareer — Backend

Backend-only scaffold: Next.js API routes + Supabase + Gemini.
This folder is meant to be merged into your Next.js app root (it uses the
`app/` router, so drop it straight into a fresh `create-next-app` project).

## Setup

1. `npm install @supabase/supabase-js @supabase/ssr @google/generative-ai`
2. Copy `.env.example` to `.env.local` and fill in real keys.
3. Run `lib/supabase/schema.sql` in the Supabase SQL editor to create tables + RLS.
4. Deploy `supabase/functions/proactive-alerts` separately via:
   `supabase functions deploy proactive-alerts`
   then schedule it with `pg_cron` (e.g. every 3 hours).

## What's in here

- `app/api/*` — decision engine, disease detection, chat routing, weather, mandi prices, alerts
- `lib/supabase/` — client/server Supabase instances + DB schema
- `lib/gemini/` — Gemini client + prompt builders
- `lib/external/` — weather + mandi price fetchers
- `types/index.ts` — shared TypeScript types
- `middleware.ts` — auth guard for protected routes
- `supabase/functions/proactive-alerts/` — scheduled Edge Function for proactive alerts

No frontend/UI files included — this is API + data layer only.
