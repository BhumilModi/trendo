# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router) + Tailwind 4, SQLite via libSQL (local file in dev, Turso in production), hosted on Vercel. Chosen with the user during planning.

## Users

Tech-curious people who want to keep up with what is happening in tech without reading a dozen sites. They open the app once a day, often on a phone, in a spare couple of minutes. Reviewers from Kenpath Labs will open it on a phone first; Kenpath's own users are on modest Android phones and mobile data, and many read English as a second language.

## Product Purpose

Trendo gives you the 4–5 tech stories that matter today, each as one short card in plain English. You read them, and the app rewards the daily habit. Success is a user who comes back every day and feels caught up.

## Positioning

Not a quiz and not a feed. A finite, daily catch-up: five cards, then you are done. Reading is the task; the bonus puzzle and the rewards exist to make the habit stick.

## Operating Context

- One shared set of 5 story cards per day (IST), generated each night from Hacker News and tech RSS feeds by Gemini, with hand-written fallback days.
- Card = headline, "what happened" (≤3 short sentences), "why it matters" (1 sentence), category, source link.
- A card counts as read after 15 seconds on the server clock; cards are read in order.
- After all 5, a 60-second bonus puzzle: match each headline to its company/product.
- The last 7 days can be read late for half points. A missed day can be repaired by a 2-question quiz on that day's stories, or by spending 100 points.

## Capabilities and Constraints

- Rewards: points (10 per card × streak multiplier up to ×2), streak, levels (Newbie, Reader, Insider, Analyst, Oracle), 6 badges, weekly + all-time leaderboard, reading stats by category (AI, Devices, Dev & Open Source, Security, Business & Startups).
- Accounts: username + 4-digit PIN.
- The server decides every score; the client never sends points or times.
- Must feel fast on a cheap Android phone over mobile data: system fonts only, no required images, minimal client JavaScript, large tap targets.

## Brand Commitments

Name: **Trendo** (chosen by the user; Duolingo-style coined name: trend + o). Voice: plain, calm, friendly; short sentences; no hype words.

## Evidence on Hand

Real daily story content from the generator / fallback file (`content/fallback.json`). No users, testimonials, or metrics exist; never fabricate them.

## Product Principles

1. Finite beats infinite: the day ends at five cards.
2. Plain English first: every sentence readable by a second-language reader.
3. Fair rewards: the server is the referee, and the rules are visible to the user.
4. Light by default: every byte costs a user on mobile data.

## Accessibility & Inclusion

ESL readers (simple words, no idioms), low-end devices, touch-only input (no drag), reduced-motion support, WCAG AA contrast.
