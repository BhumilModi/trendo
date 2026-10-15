// Server-side game logic. Every score, streak and attempt is decided here from
// DB timestamps; the client only ever sends ids and choices.
import fallback from "@/content/fallback.json";
import { batch, one, query, run } from "./db";
import { allowedImage } from "./images";
import type { StoryInput } from "./types";
import {
  BADGES,
  type BadgeId,
  type TitleId,
  bestStreak,
  isTitleId,
  unlockedTitles,
  GRACE_MS,
  REPAIR_COST,
  REPAIR_QUESTION_SECONDS,
  canRepair,
  cardPoints,
  earnedBadges,
  istDay,
  levelFor,
  puzzlePoints,
  streakFrom,
  weekStart,
  addDays,
  READ_SECONDS,
} from "./rules";

export type Story = {
  id: number;
  day: string;
  position: number;
  headline: string;
  what: string;
  why: string;
  category: string;
  source_url: string;
  source_name: string;
  company: string;
  image_url: string | null;
};

const STORY_COLS = "id, day, position, headline, what, why, category, source_url, source_name, company, image_url";
const READ_WINDOW_DAYS = 7;
const FALLBACK = fallback as StoryInput[][];

export function readableDay(day: string, today = istDay()): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && day <= today && day >= addDays(today, -READ_WINDOW_DAYS);
}

/** Store a day's stories. INSERT OR IGNORE makes it safe to call twice. */
export async function saveDay(day: string, stories: StoryInput[], source: "gemini" | "fallback") {
  await batch([
    { sql: "INSERT OR IGNORE INTO days (day, source, created_at) VALUES (?, ?, ?)", args: [day, source, Date.now()] },
    ...stories.map((s, i) => ({
      sql: `INSERT OR IGNORE INTO stories (day, position, headline, what, why, category, source_url, source_name, company, question, options, answer_index, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        day,
        i + 1,
        s.headline,
        s.what,
        s.why,
        s.category,
        s.sourceUrl,
        s.sourceName,
        s.company,
        s.question,
        JSON.stringify(s.options),
        s.answerIndex,
        allowedImage(s.imageUrl),
      ],
    })),
  ]);
}

/** Today's (or a past day's) stories. A day nobody generated gets a fallback set, so no day is empty. */
export async function getStories(day: string): Promise<Story[]> {
  let rows = await query<Story>(`SELECT ${STORY_COLS} FROM stories WHERE day = ? ORDER BY position`, [day]);
  if (rows.length === 0) {
    const i = Math.floor(Date.parse(day) / 86_400_000) % FALLBACK.length;
    await saveDay(day, FALLBACK[i], "fallback");
    rows = await query<Story>(`SELECT ${STORY_COLS} FROM stories WHERE day = ? ORDER BY position`, [day]);
  }
  return rows;
}

export async function dayState(userId: number, day: string) {
  const stories = await getStories(day);
  const reads = await query<{ story_id: number; completed_at: number | null }>(
    `SELECT story_id, completed_at FROM reads WHERE user_id = ? AND story_id IN (SELECT id FROM stories WHERE day = ?)`,
    [userId, day],
  );
  const done = new Set(reads.filter((r) => r.completed_at).map((r) => r.story_id));
  return {
    stories,
    done,
    next: stories.find((s) => !done.has(s.id)) ?? null,
  };
}

async function countedDays(userId: number): Promise<Set<string>> {
  const rows = await query<{ day: string }>("SELECT day FROM day_progress WHERE user_id = ? AND kind != 'late'", [userId]);
  return new Set(rows.map((r) => r.day));
}

export async function stats(userId: number) {
  const today = istDay();
  const [sums, counted] = await Promise.all([
    one<{ balance: number; earned: number }>(
      "SELECT COALESCE(SUM(points), 0) AS balance, COALESCE(SUM(MAX(points, 0)), 0) AS earned FROM points_ledger WHERE user_id = ?",
      [userId],
    ),
    countedDays(userId),
  ]);
  const earned = Number(sums?.earned ?? 0);
  return {
    balance: Number(sums?.balance ?? 0),
    earned,
    streak: streakFrom(counted, today),
    todayDone: counted.has(today),
    level: levelFor(earned),
    counted,
  };
}

/** Oldest-first list of the last `n` days with how each one went, for the streak strip. */
export async function recentDays(userId: number, n = 14) {
  const today = istDay();
  const from = addDays(today, -(n - 1));
  const rows = await query<{ day: string; kind: string }>("SELECT day, kind FROM day_progress WHERE user_id = ? AND day >= ?", [userId, from]);
  const kindOf = new Map(rows.map((r) => [r.day, r.kind]));
  return Array.from({ length: n }, (_, i) => {
    const day = addDays(from, i);
    return { day, kind: kindOf.get(day) ?? null };
  });
}

// ---------- reading ----------

/** Starts the 15 s clock on a card. Cards must be read in order, so cards can't be timed in parallel. */
export async function openCard(userId: number, storyId: number) {
  const story = await one<Story>(`SELECT ${STORY_COLS} FROM stories WHERE id = ?`, [storyId]);
  if (!story || !readableDay(story.day)) return { error: "This story is not available." };
  const { next } = await dayState(userId, story.day);
  if (!next || next.id !== storyId) return { error: "Read the cards in order." };
  const now = Date.now();
  await run("INSERT OR IGNORE INTO reads (user_id, story_id, opened_at) VALUES (?, ?, ?)", [userId, storyId, now]);
  const row = await one<{ opened_at: number }>("SELECT opened_at FROM reads WHERE user_id = ? AND story_id = ?", [userId, storyId]);
  return { remainingMs: Math.max(0, Number(row!.opened_at) + READ_SECONDS * 1000 - now) };
}

export async function completeCard(userId: number, storyId: number) {
  const story = await one<Story>(`SELECT ${STORY_COLS} FROM stories WHERE id = ?`, [storyId]);
  if (!story || !readableDay(story.day)) return { error: "This story is not available." };
  const now = Date.now();
  // The WHERE clause is the whole anti-cheat check: only once, and only after 15 s on the server clock.
  const claimed = await run(
    "UPDATE reads SET completed_at = ? WHERE user_id = ? AND story_id = ? AND completed_at IS NULL AND opened_at <= ?",
    [now, userId, storyId, now - READ_SECONDS * 1000],
  );
  if (!claimed) return { error: "Keep reading a little longer." };

  const today = istDay();
  const onTime = story.day === today;
  const streak = streakFrom(await countedDays(userId), today);
  const points = cardPoints(onTime, streak);
  await run("INSERT OR IGNORE INTO points_ledger (user_id, reason, points, at) VALUES (?, ?, ?, ?)", [userId, `read:${storyId}`, points, now]);

  const { next } = await dayState(userId, story.day);
  if (!next) {
    await run("INSERT OR IGNORE INTO day_progress (user_id, day, kind, at) VALUES (?, ?, ?, ?)", [
      userId,
      story.day,
      onTime ? "on_time" : "late",
      now,
    ]);
  }
  return { points, finished: !next, badges: await awardBadges(userId) };
}

// ---------- bonus puzzle ----------

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function maskCompany(headline: string, company: string): string {
  const escaped = company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return headline.replace(new RegExp(`${escaped}('s)?`, "gi"), (_, s) => (s ? "_____'s" : "_____"));
}

export async function puzzleState(userId: number) {
  const day = istDay();
  const attempt = await one<{ started_at: number; submitted_at: number | null; correct: number | null }>(
    "SELECT started_at, submitted_at, correct FROM puzzle_attempts WHERE user_id = ? AND day = ?",
    [userId, day],
  );
  return { day, attempt };
}

export async function startPuzzle(userId: number) {
  const day = istDay();
  const caughtUp = await one("SELECT 1 FROM day_progress WHERE user_id = ? AND day = ? AND kind = 'on_time'", [userId, day]);
  if (!caughtUp) return { error: "Finish today's stories first." };
  await run("INSERT OR IGNORE INTO puzzle_attempts (user_id, day, started_at) VALUES (?, ?, ?)", [userId, day, Date.now()]);
  const attempt = await one<{ started_at: number; submitted_at: number | null }>(
    "SELECT started_at, submitted_at FROM puzzle_attempts WHERE user_id = ? AND day = ?",
    [userId, day],
  );
  if (attempt!.submitted_at) return { error: "You already played today's puzzle." };
  const stories = await getStories(day);
  return {
    startedAt: Number(attempt!.started_at),
    serverNow: Date.now(),
    // Headlines usually name their company, which would give the answer away.
    headlines: stories.map((s) => ({ id: s.id, headline: maskCompany(s.headline, s.company) })),
    companies: shuffle(stories.map((s) => s.company)),
  };
}

export async function submitPuzzle(userId: number, answers: Record<string, string>) {
  const day = istDay();
  const attempt = await one<{ started_at: number }>(
    "SELECT started_at FROM puzzle_attempts WHERE user_id = ? AND day = ? AND submitted_at IS NULL",
    [userId, day],
  );
  if (!attempt) return { error: "No puzzle in progress." };
  const stories = await getStories(day);
  const correct = stories.filter((s) => answers[s.id] === s.company).length;
  const now = Date.now();
  const claimed = await run(
    "UPDATE puzzle_attempts SET submitted_at = ?, correct = ? WHERE user_id = ? AND day = ? AND submitted_at IS NULL",
    [now, correct, userId, day],
  );
  if (!claimed) return { error: "Already submitted." };
  const points = puzzlePoints(correct, now - Number(attempt.started_at));
  if (points > 0) {
    await run("INSERT OR IGNORE INTO points_ledger (user_id, reason, points, at) VALUES (?, ?, ?, ?)", [userId, `puzzle:${day}`, points, now]);
  }
  return {
    correct,
    points,
    answers: Object.fromEntries(stories.map((s) => [s.id, s.company])),
    badges: await awardBadges(userId),
  };
}

// ---------- archive + streak repair ----------

/** Day the account was created. Days before it can be read, but never patched into a streak. */
async function joinedDay(userId: number): Promise<string> {
  const row = await one<{ created_at: number }>("SELECT created_at FROM users WHERE id = ?", [userId]);
  return istDay(new Date(Number(row?.created_at ?? Date.now())));
}

export async function archive(userId: number) {
  const today = istDay();
  const days = Array.from({ length: READ_WINDOW_DAYS + 1 }, (_, i) => addDays(today, -i));
  const [joined, progress, repairs, reads] = await Promise.all([
    joinedDay(userId),
    query<{ day: string; kind: string }>("SELECT day, kind FROM day_progress WHERE user_id = ? AND day >= ?", [userId, days.at(-1)!]),
    query<{ day: string; passed: number | null }>("SELECT day, passed FROM repair_attempts WHERE user_id = ? AND day >= ?", [userId, days.at(-1)!]),
    query<{ day: string; n: number }>(
      `SELECT s.day, COUNT(*) AS n FROM reads r JOIN stories s ON s.id = r.story_id
       WHERE r.user_id = ? AND r.completed_at IS NOT NULL AND s.day >= ? GROUP BY s.day`,
      [userId, days.at(-1)!],
    ),
  ]);
  const kindOf = new Map(progress.map((p) => [p.day, p.kind]));
  const repairOf = new Map(repairs.map((r) => [r.day, r.passed]));
  const readOf = new Map(reads.map((r) => [r.day, Number(r.n)]));
  return days.map((day) => {
    const kind = kindOf.get(day) ?? null;
    const counted = kind !== null && kind !== "late";
    const repairable = !counted && canRepair(day, today) && day >= joined;
    return {
      day,
      kind,
      beforeJoin: day < joined,
      read: readOf.get(day) ?? 0,
      quizAvailable: repairable && kind === "late" && !repairOf.has(day),
      quizFailed: repairOf.get(day) === 0,
      canBuy: repairable,
    };
  });
}

const REPAIR_LIMIT_MS = 2 * REPAIR_QUESTION_SECONDS * 1000 + GRACE_MS;

export async function startRepair(userId: number, day: string) {
  const today = istDay();
  if (!canRepair(day, today) || day < (await joinedDay(userId))) return { error: "This day can't be repaired." };
  const progress = await one<{ kind: string }>("SELECT kind FROM day_progress WHERE user_id = ? AND day = ?", [userId, day]);
  if (progress?.kind !== "late") return { error: "Read that day's stories first." };
  const stories = await getStories(day);
  const picked = shuffle(stories).slice(0, 2).map((s) => s.id);
  await run("INSERT OR IGNORE INTO repair_attempts (user_id, day, started_at, story_ids) VALUES (?, ?, ?, ?)", [
    userId,
    day,
    Date.now(),
    JSON.stringify(picked),
  ]);
  const attempt = await one<{ started_at: number; story_ids: string; passed: number | null }>(
    "SELECT started_at, story_ids, passed FROM repair_attempts WHERE user_id = ? AND day = ?",
    [userId, day],
  );
  if (attempt!.passed !== null) return { error: "You already used your quiz for this day." };
  if (Date.now() - Number(attempt!.started_at) > REPAIR_LIMIT_MS) {
    await run("UPDATE repair_attempts SET passed = 0 WHERE user_id = ? AND day = ? AND passed IS NULL", [userId, day]);
    return { error: "Time ran out for this quiz." };
  }
  const ids: number[] = JSON.parse(attempt!.story_ids);
  const rows = await query<{ id: number; question: string; options: string }>(
    `SELECT id, question, options FROM stories WHERE id IN (${ids.map(() => "?").join(",")})`,
    ids,
  );
  return {
    startedAt: Number(attempt!.started_at),
    serverNow: Date.now(),
    questions: ids.map((id) => {
      const r = rows.find((x) => Number(x.id) === id)!;
      return { id, question: r.question, options: JSON.parse(r.options) as string[] };
    }),
  };
}

// ponytail: one 45 s budget for both questions, not a server clock per question; per-question if it gets gamed.
export async function submitRepair(userId: number, day: string, answers: Record<string, number>) {
  const attempt = await one<{ started_at: number; story_ids: string }>(
    "SELECT started_at, story_ids FROM repair_attempts WHERE user_id = ? AND day = ? AND passed IS NULL",
    [userId, day],
  );
  if (!attempt) return { error: "No quiz in progress." };
  const ids: number[] = JSON.parse(attempt.story_ids);
  const rows = await query<{ id: number; answer_index: number }>(
    `SELECT id, answer_index FROM stories WHERE id IN (${ids.map(() => "?").join(",")})`,
    ids,
  );
  const inTime = Date.now() - Number(attempt.started_at) <= REPAIR_LIMIT_MS;
  const passed = inTime && rows.every((r) => answers[r.id] === Number(r.answer_index));
  const claimed = await run("UPDATE repair_attempts SET passed = ? WHERE user_id = ? AND day = ? AND passed IS NULL", [
    passed ? 1 : 0,
    userId,
    day,
  ]);
  if (!claimed) return { error: "Already submitted." };
  if (passed) {
    await run("UPDATE day_progress SET kind = 'repaired_quiz', at = ? WHERE user_id = ? AND day = ? AND kind = 'late'", [Date.now(), userId, day]);
  }
  return {
    passed,
    inTime,
    answers: Object.fromEntries(rows.map((r) => [r.id, Number(r.answer_index)])),
    badges: await awardBadges(userId),
  };
}

export async function repairWithPoints(userId: number, day: string) {
  const today = istDay();
  if (!canRepair(day, today) || day < (await joinedDay(userId))) return { error: "This day can't be repaired." };
  const counted = await one("SELECT 1 FROM day_progress WHERE user_id = ? AND day = ? AND kind != 'late'", [userId, day]);
  if (counted) return { error: "This day already counts." };
  // Balance check and charge in one statement, so two taps can't overspend.
  const charged = await run(
    `INSERT OR IGNORE INTO points_ledger (user_id, reason, points, at)
     SELECT ?, ?, ?, ? WHERE (SELECT COALESCE(SUM(points), 0) FROM points_ledger WHERE user_id = ?) >= ?`,
    [userId, `repair:${day}`, -REPAIR_COST, Date.now(), userId, REPAIR_COST],
  );
  if (!charged) return { error: `You need ${REPAIR_COST} points.` };
  await run(
    `INSERT INTO day_progress (user_id, day, kind, at) VALUES (?, ?, 'repaired_points', ?)
     ON CONFLICT (user_id, day) DO UPDATE SET kind = 'repaired_points', at = excluded.at`,
    [userId, day, Date.now()],
  );
  return { ok: true, badges: await awardBadges(userId) };
}

// ---------- badges, leaderboard, profile ----------

async function awardBadges(userId: number): Promise<string[]> {
  const today = istDay();
  const [days, counted, puzzle, topCat] = await Promise.all([
    one<{ n: number }>("SELECT COUNT(*) AS n FROM day_progress WHERE user_id = ?", [userId]),
    countedDays(userId),
    one<{ perfect: number; fast: number }>(
      `SELECT MAX(correct = 5) AS perfect, MAX(correct = 5 AND submitted_at - started_at < 20000) AS fast
       FROM puzzle_attempts WHERE user_id = ? AND submitted_at IS NOT NULL`,
      [userId],
    ),
    one<{ n: number }>(
      `SELECT COUNT(*) AS n FROM reads r JOIN stories s ON s.id = r.story_id
       WHERE r.user_id = ? AND r.completed_at IS NOT NULL GROUP BY s.category ORDER BY n DESC LIMIT 1`,
      [userId],
    ),
  ]);
  const earned = earnedBadges({
    daysCaughtUp: Number(days?.n ?? 0),
    streak: streakFrom(counted, today),
    perfectPuzzle: Number(puzzle?.perfect ?? 0) === 1,
    fastPuzzle: Number(puzzle?.fast ?? 0) === 1,
    maxCategoryReads: Number(topCat?.n ?? 0),
  });
  const fresh: string[] = [];
  for (const id of earned) {
    const added = await run("INSERT OR IGNORE INTO user_badges (user_id, badge, at) VALUES (?, ?, ?)", [userId, id, Date.now()]);
    if (added) fresh.push(BADGES[id].name);
  }
  return fresh;
}

export async function leaderboard(scope: "week" | "all") {
  const since = scope === "week" ? Date.parse(`${weekStart(istDay())}T00:00:00+05:30`) : 0;
  // ponytail: the equipped title isn't re-checked against unlocks here; titles never re-lock, so it can't go stale.
  return query<{ id: number; username: string; points: number; title: string | null }>(
    `SELECT u.id, u.username, SUM(l.points) AS points, t.title FROM points_ledger l
     JOIN users u ON u.id = l.user_id LEFT JOIN user_titles t ON t.user_id = u.id
     WHERE l.points > 0 AND l.at >= ? GROUP BY u.id ORDER BY points DESC, MIN(l.at) ASC LIMIT 50`,
    [since],
  );
}

export type Achievements = Awaited<ReturnType<typeof achievements>>;

/** Everything a profile shows. Same data for your own page and for anyone else's. */
export async function achievements(userId: number) {
  const [s, user, badges, categories, puzzle, days, titleRow, leaves] = await Promise.all([
    stats(userId),
    one<{ username: string; created_at: number }>("SELECT username, created_at FROM users WHERE id = ?", [userId]),
    query<{ badge: BadgeId }>("SELECT badge FROM user_badges WHERE user_id = ? ORDER BY at", [userId]),
    query<{ category: string; n: number }>(
      `SELECT s.category, COUNT(*) AS n FROM reads r JOIN stories s ON s.id = r.story_id
       WHERE r.user_id = ? AND r.completed_at IS NOT NULL GROUP BY s.category`,
      [userId],
    ),
    one<{ perfect: number; fast: number }>(
      `SELECT MAX(correct = 5) AS perfect, MAX(correct = 5 AND submitted_at - started_at < 20000) AS fast
       FROM puzzle_attempts WHERE user_id = ? AND submitted_at IS NOT NULL`,
      [userId],
    ),
    one<{ n: number }>("SELECT COUNT(*) AS n FROM day_progress WHERE user_id = ? AND kind != 'late'", [userId]),
    one<{ title: string }>("SELECT title FROM user_titles WHERE user_id = ?", [userId]),
    recentDays(userId),
  ]);
  const categoryReads = Object.fromEntries(categories.map((c) => [c.category, Number(c.n)]));
  const best = bestStreak(s.counted);
  const titles = unlockedTitles({
    earned: s.earned,
    bestStreak: best,
    perfectPuzzle: Number(puzzle?.perfect ?? 0) === 1,
    fastPuzzle: Number(puzzle?.fast ?? 0) === 1,
    categoryReads,
  });
  const equipped = titleRow && isTitleId(titleRow.title) && titles.includes(titleRow.title) ? titleRow.title : null;
  return {
    userId,
    username: String(user?.username ?? ""),
    joined: istDay(new Date(Number(user?.created_at ?? Date.now()))),
    ...s,
    bestStreak: best,
    daysCounted: Number(days?.n ?? 0),
    badges: badges.map((b) => b.badge),
    categoryReads,
    titles,
    title: equipped as TitleId | null,
    leaves,
  };
}

export async function userIdByName(username: string): Promise<number | null> {
  const row = await one<{ id: number }>("SELECT id FROM users WHERE username = ?", [username]);
  return row ? Number(row.id) : null;
}

/** Wear a title. Only titles you have unlocked; null takes it off. */
export async function setTitle(userId: number, title: string | null) {
  if (title === null) {
    await run("DELETE FROM user_titles WHERE user_id = ?", [userId]);
    return { ok: true };
  }
  if (!isTitleId(title)) return { error: "Unknown title." };
  const { titles } = await achievements(userId);
  if (!titles.includes(title)) return { error: "You haven't unlocked that title yet." };
  await run("INSERT INTO user_titles (user_id, title) VALUES (?, ?) ON CONFLICT (user_id) DO UPDATE SET title = excluded.title", [userId, title]);
  return { ok: true };
}
