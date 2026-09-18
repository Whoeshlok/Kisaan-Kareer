# Kisaan-Kareer

> **Better decisions. Healthier crops. Prosperous farmers.**

Kisaan-Kareer is an AI-powered, location-aware farmer decision-support platform built for Indian farmers. It helps farmers manage farms and crops, monitor weather and mandi prices, record agricultural activities, detect crop diseases, and receive personalized farming guidance.

## Project URL

[Open Kisaan-Kareer](https://3000-iszwj2i420wz990jlqbpw-677b543a.sg2.manus.computer)

> This is the current development preview URL and may not be a permanent production URL.

## Features

- Email/password authentication.
- Device-based and manual location setup.
- Multiple farms per farmer.
- Multiple crops per farm.
- Crop variety, stage, sowing date, harvest date, and chemical tracking.
- Treatment and irrigation history.
- Location-aware weather updates.
- District-based mandi prices.
- AI crop disease detection from uploaded images.
- Farm-profile-aware AI farming assistant.
- Text and voice-based questions.
- Multilingual interface and assistant responses.
- Whisper-based voice transcription.
- Alerts and farming recommendations.
- Go Organic section with organic farming guidance and mentor-mentee concepts.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express
- **API:** tRPC and Zod
- **Database:** MySQL-compatible database
- **ORM:** Drizzle ORM
- **Database driver:** mysql2
- **Data fetching:** TanStack React Query
- **Styling:** Tailwind CSS and custom CSS
- **AI:** Built-in LLM and vision services
- **Speech-to-text:** Whisper-compatible `whisper-1`
- **Testing:** Vitest
- **Package manager:** pnpm

## Architecture

```text
React Frontend
      ↓
tRPC API
      ↓
Node.js + Express Backend
      ↓
Drizzle ORM
      ↓
MySQL-Compatible Database
```

The backend also integrates with:

- Open-Meteo for weather.
- data.gov.in / Agmarknet for mandi prices.
- Nominatim / OpenStreetMap for geocoding.
- ISRIC SoilGrids for soil information.
- Built-in LLM and vision services.
- Whisper-compatible speech-to-text.
- Managed object storage for crop images.

## Database

The application currently uses a MySQL-compatible database through:

```text
Drizzle ORM → mysql2 → MySQL-compatible database
```

> Supabase is not currently connected.

Main tables include:

- `users`
- `farms`
- `crops`
- `treatmentHistory`
- `irrigationHistory`
- `soilTests`
- `marketPrices`
- `alerts`
- `chatMessages`
- `recommendations`
- `weatherSnapshots`
- `diseaseScans`

The AI assistant uses the selected farm’s saved crop, soil, irrigation, treatment, and location data to provide personalized answers.

## Voice Assistant

The voice flow is:

```text
Farmer speaks
   ↓
Browser records audio
   ↓
Whisper converts speech to text
   ↓
Farm context is added
   ↓
AI assistant generates a response
```

Supported languages include English, Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam, Punjabi, and Urdu.

## Authentication

Passwords are hashed using Node.js `scrypt`. Raw passwords are never stored. After registration, the user receives a secure session cookie and a default farm profile is created.

## Development

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Run type checks:

```bash
pnpm check
```

Run tests:

```bash
pnpm test
```

Build the application:

```bash
pnpm build
```

Start the production build:

```bash
pnpm start
```

Apply database migrations:

```bash
pnpm db:push
```

Seed demo data:

```bash
pnpm db:seed:demo
```

## Environment Variables

```text
DATABASE_URL
JWT_SECRET
BUILT_IN_FORGE_API_URL
BUILT_IN_FORGE_API_KEY
VITE_APP_ID
OAUTH_SERVER_URL
VITE_OAUTH_PORTAL_URL
```

Never commit database credentials, API keys, or `.env` files to the repository.

## Project Structure

```text
client/
  src/
    pages/
    components/
    lib/
    App.tsx

server/
  _core/
  db.ts
  routers.ts
  password.ts
  storage.ts
  seed-demo.ts

drizzle/
  schema.ts
  migrations/

shared/
  const.ts
```


