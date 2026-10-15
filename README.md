# Trendo

Five tech stories a day, in plain English. Read each one, keep your streak, climb the weekly board.

- **Live:** _add your Vercel URL here_
- **What I built and why:** [EXPLAINER.md](EXPLAINER.md)

## Run it locally

You need Node.js 20 or newer (built and tested on Node 24).

```bash
git clone https://github.com/BhumilModi/trendo.git
cd trendo
npm install
npm run dev
```

Open http://localhost:3000, pick a name and a 4-digit PIN, and start reading.

That's it: no database to install, no keys needed. On first request the app creates a SQLite file (`local.db`) and builds its tables. Any day without generated stories gets a pre-written set from `content/fallback.json`, so every day has something to read.

On a phone on the same Wi-Fi: `npm run dev -- -H 0.0.0.0`, then open `http://<your-computer's-ip>:3000`.

## Checks

```bash
npm test        # game rules + content validator (node --test, no framework)
npm run lint
npm run build
```

## Live daily stories (optional)

Stories are written by Gemini from the day's Hacker News, TechCrunch, The Verge and Ars Technica headlines.

1. `cp .env.example .env.local`
2. Set `GEMINI_API_KEY` (free at https://aistudio.google.com) and any `CRON_SECRET`.
3. Restart `npm run dev`, then generate tomorrow's set:

   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/generate
   ```

   Add `?day=YYYY-MM-DD` for a specific day. Days that already have stories are skipped, so it's safe to run twice.

## Deploy (free tiers: Vercel + Turso)

Vercel's filesystem doesn't persist, so production uses [Turso](https://turso.tech) (hosted SQLite, same driver as local).

1. **Turso:** create a database, then copy its URL (`libsql://…`) and an auth token. You can do this in the Turso dashboard, or add Turso from the Vercel Marketplace and Vercel fills in the variables for you.
2. **Vercel:** import the GitHub repo (framework: Next.js, default settings).
3. Add environment variables: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `GEMINI_API_KEY`, `CRON_SECRET`.
4. Deploy. Tables are created on the first request.

`vercel.json` schedules `/api/cron/generate` daily at 17:30 UTC (23:00 IST), so tomorrow's stories exist before midnight in India. Vercel sends the `CRON_SECRET` header itself.

## Project layout

```
app/
  page.tsx              Today: streak strip, today's 5 stories, next action
  read/[day]/           Story reader with the 15-second read timer
  puzzle/               Bonus match-up (60 s)
  archive/              Last 7 days: late reads and streak repair
  repair/[day]/         2-question quiz to save a missed day
  u/[username]/         Public profile: title, streaks, badges, titles, topics
  leaderboard/, me/, login/
  actions.ts            Server actions: every one checks the session
  api/cron/generate/    Daily story generation (Vercel Cron)
lib/
  rules.ts              Pure game rules: points, streaks, levels, badges, titles (tested)
  game.ts               Server-side game logic on top of the database
  auth.ts               Username + PIN, scrypt hashes, sessions, lockout
  db.ts                 libSQL client + schema (auto-applied)
  generate.ts           HN/RSS fetch + Gemini call + output validation (tested)
content/fallback.json   7 days of pre-written stories
```

## Stack

Next.js 16 (App Router, server components, server actions) · Tailwind 4 (plus plain CSS) · SQLite via `@libsql/client` · Gemini via plain `fetch`. The only runtime dependency beyond Next/React is the libSQL client.
