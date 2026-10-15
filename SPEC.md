# Trendo — spec

Kenpath Labs take-home (Full Stack Engineer). Due 2026-10-19. Budget 4–6 h.

**Trendo**: catch up on the 4–5 tech stories that matter, every day. Read them, then an
optional bonus puzzle. Rewards make the habit stick.

## Constraints from the brief
- Opened on a phone first. Modest Android + mobile data → ≤ ~100 KB JS first load, system fonts, no required images, big tap targets.
- Many readers have English as a second language → short sentences, jargon explained inline.
- Rewards are worth real money → the server is the only authority on points, streaks, attempts.

## Core loop
1. **Today's catch-up**: 5 story cards, same set for everyone. Card = headline, "what happened" (≤3 lines), "why it matters" (1 line), category, source link.
2. A card counts as **read after 15 s**, timed by the server (`opened_at` → `completed_at` ≥ 15 s). The "Next" button fills over 15 s. No per-card question.
3. Finish all 5 → **caught up** for the day.
4. **Bonus puzzle** unlocks: tap-match 5 headlines ↔ 5 companies/products. 60 s, server-checked, up to 50 pts (correct matches + speed).

## Rewards
| Mechanic | Rule |
|---|---|
| Card points | 10 per card read × streak multiplier |
| Streak | consecutive IST days caught up on time (or repaired) |
| Multiplier | 1 + 0.1 × streak, capped at ×2 |
| Puzzle | 6 per correct match + up to 20 speed bonus (max 50) |
| Late reads | past 7 days readable, half points, do **not** count for streak |
| Streak repair | for a missed day within 7 days: read it, then a 2-question quiz (20 s each, both right, one attempt) → day counts. Or spend 100 pts. No streak freezes. |
| Levels | by total points: Newbie → Reader → Insider → Analyst → Oracle |
| Badges | first catch-up, 7-day streak, 30-day streak, perfect puzzle, puzzle < 20 s, category reader (read 10 in one category) |
| Leaderboard | weekly (resets Monday 00:00 IST, sum of points ledger) + all-time |
| Categories | AI · Devices · Dev & Open Source · Security · Business & Startups. Profile shows reading by category. |

## Integrity
- All scoring computed server-side from DB timestamps; the client never sends a score or a time.
- One row per (user, story) read, (user, day) puzzle, (user, day) repair — enforced by composite primary keys.
- Quiz/puzzle answers never sent to the client; only shuffled options.
- Day boundaries in `Asia/Kolkata`.
- Every point change goes through an append-only `points_ledger`; totals are derived from it.
- Auth: username + 4-digit PIN, `crypto.scrypt` hash, random session token in an httpOnly cookie, lock for 15 min after 5 failed PINs.
- Known limits (go in the explainer): 15 s time-on-card can't prove reading; a PIN is weak; production needs phone OTP + one account per device/number.

## Content pipeline
- Vercel cron, daily 00:30 UTC (06:00 IST) → `GET /api/cron/generate` (checks `CRON_SECRET`).
- Pulls Hacker News top stories (Firebase API) + RSS (TechCrunch, The Verge, Ars Technica), parsed with a small regex, no dependency.
- Gemini Flash (plain `fetch`, JSON `responseSchema`) picks 5, writes each card in plain English, plus a puzzle answer (company/product) and a repair question (3 options + answer) per card.
- **Fallback**: ~7 days of hand-written cards in `content/fallback.json`. A day with no generated set gets a fallback day by rotation, so local dev works with no API key and no day is ever empty.

## Stack
- Next.js (App Router, server components + server actions; client components only for the card timer and the puzzle).
- SQLite through `@libsql/client` with plain SQL (no ORM): a local file in dev (`npm i && npm run dev`, zero setup), Turso in prod.
- Tailwind (comes with create-next-app, no runtime cost).
- No other dependencies.
- Tests: `node --test` on the pure rules module (streak, multiplier, points, puzzle scoring, repair window). Node 24 strips types natively, so no test framework.

## Data model
- `users` (id, username unique, pin_hash, failed_pins, locked_until, created_at)
- `sessions` (token, user_id, expires_at)
- `days` (day PK `YYYY-MM-DD`, source `gemini|fallback`)
- `stories` (id, day, position, headline, what, why, category, source_url, company, question, options json, answer_index)
- `reads` (user_id, story_id, opened_at, completed_at) PK(user, story)
- `day_progress` (user_id, day, kind `on_time|late|repaired_quiz|repaired_points`, at) PK(user, day)
- `puzzle_attempts` (user_id, day, started_at, submitted_at, correct) PK(user, day)
- `repair_attempts` (user_id, day, started_at, answers, passed) PK(user, day)
- `points_ledger` (id, user_id, day, reason, points, at)
- `user_badges` (user_id, badge, at) PK(user, badge)

## Screens
`/` today (streak, level, progress through 5 cards) · `/read/[day]` card reader · `/puzzle` ·
`/archive` last 7 days + repair · `/leaderboard` weekly/all-time · `/me` level, badges, categories · `/login`

## Tickets (build order)
1. Scaffold: Next.js, Drizzle schema + migrations, fallback content, DB seeding.
2. Auth: username + PIN, sessions, lockout.
3. Rules module + tests (pure functions for points, streak, multiplier, puzzle, repair window).
4. Daily read loop: today page, card reader with server-timed 15 s gate, caught-up state, ledger.
5. Bonus puzzle.
6. Archive, late reads, streak repair (quiz + points).
7. Levels, badges, leaderboard, profile.
8. Content pipeline: HN/RSS fetch, Gemini call, cron route. (Independent of 2–7 → can run in parallel.)
9. UI pass with the design skills; check the JS budget on a mobile profile.
10. README (clone → run → deploy to Vercel + Turso), EXPLAINER.md (incl. "Where I used AI").

## Out of scope
Phone OTP, social/friends, push notifications, spending points (except repair), human review of generated cards, multiple languages.

## Deliverables
Live link on Vercel · public repo `BhumilModi/trendo` · README · EXPLAINER.md. The user pushes and deploys.
