# Trendo: explainer

## What I built

**Trendo** is a daily catch-up on tech news. Every day there are five stories, each one short card in plain English: what happened, why it matters, and a link to the source. You read the five cards and you're done for the day. A 60-second bonus puzzle and a set of rewards make it a habit.

I wanted something people would open every day because it's useful, not only because a streak says so. The task (catching up on tech) is worth doing on its own, and the rewards push the habit along.

**The daily loop**

1. Open the app and see today's five headlines, your streak, and your points.
2. Read each card. It counts after **15 seconds**, shown by a bar that fills along the button.
3. After all five you're "caught up". The streak goes up and a **bonus puzzle** opens: match each story to its company before 60 seconds run out (the company is blanked out of the headline).
4. Missed a day? **Back issues** has the last 7 days to read for half points. To make a missed day count for your streak, pass a **2-question quiz** on that day's stories, or spend **100 points**.

**Rewards:** points (10 per card, times a streak bonus up to ×2), a streak, five levels (Newbie → Oracle), six badges, a weekly leaderboard that resets every Monday (so new users can win a week), an all-time board, and reading stats by topic.

**Titles and profiles:** 14 titles unlock from lifetime milestones: points (Insider, Oracle), best streak (Week Streak, Iron Reader at 100 days), the puzzle (Sharp Eye), and 10 stories in one topic (AI Watcher, Security Watch). You wear one beside your name. Tap any name on the board to see that reader's profile: title, level, active and best streak, days caught up, 14-day streak strip, badges, unlocked titles, and reading by topic. Titles are worked out from your record, not stored, so they can't drift from it. The server only lets you wear one you've unlocked.

## Choices I made, and why

**For people on modest phones and mobile data**
- Every page is rendered on the server and usable before the JavaScript arrives. Interactive code exists only where it has to: the reading timer, the puzzle, the quiz, and the login form.
- System fonts only and about 6 KB of CSS. Story photos are resized to AVIF/WebP by Next.js: about 0.7 KB per list thumbnail and 5 KB per reader photo, around 30 KB a day. Illustrations are inline SVG drawn in code, so they cost no extra requests.
- Big tap targets, and tap only (no dragging, which is unreliable on cheap touchscreens).
- Lighthouse on the live site, mobile mode (a mid-range phone on slow 4G): performance **100** on the sign-up page and **96** on the daily page, with the main content painted in about 1 second. Accessibility, best practices and SEO score **100** on both.
- Honest number: first load is about **145 KB of gzipped JavaScript**, and roughly 115 KB of that is React + Next.js itself. That's over my ~100 KB goal. Getting below it means leaving Next.js (for example Preact or plain HTML forms). I chose the framework's speed of building and kept our own code small (~20 KB).

**For readers with English as a second language**
- Cards are written in short sentences with simple words, and technical terms explained. The generator's prompt asks for this, and the fallback cards follow the same rules.
- Button and error text is plain: "Keep reading", "Name or PIN is wrong."

**Because the rewards are worth real money**
- **The server decides everything.** The browser never sends a score or a time. The 15-second rule is checked on the server's clock: "next" is refused unless 15 seconds have passed since that card was opened.
- Cards must be read **in order**, so you can't open all five at once and wait out one timer.
- One claim per thing, enforced by the database: each card, puzzle, and repair can earn points once (unique keys on the points ledger). Two fast taps can't pay twice.
- Puzzle answers and quiz answers never reach the browser before you submit.
- Points live in an append-only ledger, and every total is computed from it. Spending points doesn't lower your level or leaderboard place.
- Streak repair only works for days after you joined. Otherwise a new account could patch the 7 back issues and get a 7-day streak on day one. (I found this hole while testing.)
- Days follow India time (`Asia/Kolkata`).
- Login: username + 4-digit PIN, hashed with scrypt, and locked for 15 minutes after 5 wrong tries. You sign up once per phone: the session lasts 90 days and renews every time you read, so regular readers never see the login screen again.

**Content**
- A nightly job (Vercel Cron, 23:00 IST) pulls headlines from Hacker News, TechCrunch, The Verge and Ars Technica. Gemini picks the five that matter and writes the cards in a fixed JSON shape. The server then **validates** the result: 5 stories, known topics, different companies, source links that really came from the feeds. If validation fails, nothing is saved.
- If generation fails or there is no key, the day uses one of 7 pre-written fallback days. The app never shows an empty day, and it runs locally with zero setup.

**Look and feel: "The Wire Desk"**
News agencies used to send stories over a teleprinter wire on yellow paper. Trendo borrows that: canary paper, small typewriter-style labels for dates and item numbers, a red caret that prints across the button while you read, and a perforated line under each story. Your streak shows as a strip of 14 "leaves": filled for days read, crossed red for patched days, empty for missed ones.

## What I left out (and what I'd add next)

- **Phone-number login (OTP).** With money involved, production needs one account per verified phone number and device. A PIN is weak, and anyone can make many accounts to farm the leaderboard. I skipped it because it needs an SMS provider and costs money, and it would block reviewers from testing.
- **Proof of reading.** 15 seconds on a card doesn't prove anyone read it; you could look away. The quiz on missed days and the puzzle do test memory. Next I'd add an optional one-question check on some cards, with points weighted toward it.
- **Human review of generated cards.** An editor approving the next day's set before midnight would catch AI mistakes. Today the guard is validation plus a source link on every card.
- **Notifications** ("your streak ends in 2 hours"), **friends and leagues**, **other languages** (Hindi first), **offline reading** with a service worker.
- **Rate limits on sign-up and per IP**, and an admin view for spotting abuse.

## Where I used AI

- **Claude Code** (Anthropic) was my pair programmer for the whole build. It helped me plan by questioning my idea until the scope was clear, scaffolded the app, wrote most of the code and tests, ran the visual-direction step, and tested every screen in a headless browser. I made the product decisions (the idea, the catch-up format instead of a quiz, the 15-second rule, streak repair by quiz or points, the name and the visual direction), reviewed the code, and fixed what testing turned up.
- **Gemini** writes the daily story cards in the live app. The prompt and validation are in `lib/generate.ts`.
- The fallback stories in `content/fallback.json` were drafted with AI from real articles of the past few weeks. Every card links to its source.
- The illustrations (teleprinter, spike, desk pieces, topic icons) were drawn as SVG code with Claude Code. No image generator was used.
