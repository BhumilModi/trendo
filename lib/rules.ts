// Pure game rules. No I/O, so they run under `node --test` without Next.
import type { Category } from "./types.ts";

export const READ_SECONDS = 15;
export const CARD_POINTS = 10;
export const LATE_CARD_POINTS = 5;
export const PUZZLE_SECONDS = 60;
export const PUZZLE_POINTS_PER_MATCH = 6;
export const PUZZLE_SPEED_BONUS = 20;
export const REPAIR_WINDOW_DAYS = 7;
export const REPAIR_QUESTION_SECONDS = 20;
export const REPAIR_COST = 100;
export const GRACE_MS = 3000; // network slack on timed submits

const DAY_FMT = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });

/** Calendar day in India (YYYY-MM-DD). All day boundaries use this. */
export function istDay(at: Date = new Date()): string {
  return DAY_FMT.format(at);
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing `day`. */
export function weekStart(day: string): string {
  const dow = new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(day, -((dow + 6) % 7));
}

/** Longest run of consecutive counted days, ever. */
export function bestStreak(counted: Set<string>): number {
  let best = 0;
  for (const day of counted) {
    if (counted.has(addDays(day, -1))) continue; // not the start of a run
    let n = 1;
    while (counted.has(addDays(day, n))) n++;
    best = Math.max(best, n);
  }
  return best;
}

/**
 * Consecutive counted days ending today, or ending yesterday if today
 * isn't done yet (the streak is still alive until midnight).
 */
export function streakFrom(counted: Set<string>, today: string): number {
  let day = counted.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (counted.has(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

export function multiplier(streak: number): number {
  return Math.min(2, 1 + 0.1 * streak);
}

export function cardPoints(onTime: boolean, streakBefore: number): number {
  return onTime ? Math.round(CARD_POINTS * multiplier(streakBefore)) : LATE_CARD_POINTS;
}

export function readLongEnough(openedAt: number, now: number): boolean {
  return now - openedAt >= READ_SECONDS * 1000;
}

/** 6 per correct match plus a speed bonus scaled by accuracy. Late = 0. */
export function puzzlePoints(correct: number, elapsedMs: number): number {
  if (elapsedMs > PUZZLE_SECONDS * 1000 + GRACE_MS) return 0;
  const left = Math.max(0, PUZZLE_SECONDS * 1000 - elapsedMs) / (PUZZLE_SECONDS * 1000);
  return correct * PUZZLE_POINTS_PER_MATCH + Math.round(PUZZLE_SPEED_BONUS * left * (correct / 5));
}

/** A missed day can be repaired if it is 1..7 days back. */
export function canRepair(day: string, today: string): boolean {
  return day < today && day >= addDays(today, -REPAIR_WINDOW_DAYS);
}

export const LEVELS = [
  { name: "Newbie", min: 0 },
  { name: "Reader", min: 100 },
  { name: "Insider", min: 300 },
  { name: "Analyst", min: 700 },
  { name: "Oracle", min: 1500 },
] as const;

export function levelFor(earned: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && earned >= LEVELS[i + 1].min) i++;
  const next = LEVELS[i + 1];
  const progress = next ? (earned - LEVELS[i].min) / (next.min - LEVELS[i].min) : 1;
  return { name: LEVELS[i].name, index: i, next: next ?? null, progress };
}

export const BADGES = {
  first: { name: "First catch-up", hint: "Finish your first day" },
  streak7: { name: "One week", hint: "7-day streak" },
  streak30: { name: "One month", hint: "30-day streak" },
  perfect: { name: "Perfect match", hint: "Match all 5 in the puzzle" },
  fast: { name: "Quick mind", hint: "Match all 5 in under 20 seconds" },
  specialist: { name: "Specialist", hint: "Read 10 stories in one topic" },
} as const;

export type BadgeId = keyof typeof BADGES;

export type BadgeStats = {
  daysCaughtUp: number;
  streak: number;
  perfectPuzzle: boolean;
  fastPuzzle: boolean;
  maxCategoryReads: number;
};

export function earnedBadges(s: BadgeStats): BadgeId[] {
  const out: BadgeId[] = [];
  if (s.daysCaughtUp >= 1) out.push("first");
  if (s.streak >= 7) out.push("streak7");
  if (s.streak >= 30) out.push("streak30");
  if (s.perfectPuzzle) out.push("perfect");
  if (s.fastPuzzle) out.push("fast");
  if (s.maxCategoryReads >= 10) out.push("specialist");
  return out;
}

// Titles are worn beside your name. They unlock from lifetime milestones, so once
// unlocked they stay unlocked, and can be derived from stats instead of stored.
export const TITLES = {
  reader: { name: "Reader", hint: "Earn 100 points" },
  insider: { name: "Insider", hint: "Earn 300 points" },
  analyst: { name: "Analyst", hint: "Earn 700 points" },
  oracle: { name: "Oracle", hint: "Earn 1500 points" },
  week: { name: "Week Streak", hint: "Keep a 7-day streak" },
  month: { name: "Month Streak", hint: "Keep a 30-day streak" },
  iron: { name: "Iron Reader", hint: "Keep a 100-day streak" },
  sharp: { name: "Sharp Eye", hint: "Match all 5 in the puzzle" },
  fast: { name: "Fast Matcher", hint: "Match all 5 in under 20 seconds" },
  ai: { name: "AI Watcher", hint: "Read 10 AI stories" },
  devices: { name: "Device Watcher", hint: "Read 10 Devices stories" },
  dev: { name: "Open Source Fan", hint: "Read 10 Dev & Open Source stories" },
  security: { name: "Security Watch", hint: "Read 10 Security stories" },
  business: { name: "Startup Scout", hint: "Read 10 Business & Startups stories" },
} as const;

export type TitleId = keyof typeof TITLES;

const TOPIC_TITLES: Record<Category, TitleId> = {
  AI: "ai",
  Devices: "devices",
  "Dev & Open Source": "dev",
  Security: "security",
  "Business & Startups": "business",
};

export type TitleStats = {
  earned: number;
  bestStreak: number;
  perfectPuzzle: boolean;
  fastPuzzle: boolean;
  categoryReads: Partial<Record<string, number>>;
};

export function unlockedTitles(s: TitleStats): TitleId[] {
  const out: TitleId[] = [];
  for (const [id, min] of [["reader", 100], ["insider", 300], ["analyst", 700], ["oracle", 1500]] as const) {
    if (s.earned >= min) out.push(id);
  }
  for (const [id, min] of [["week", 7], ["month", 30], ["iron", 100]] as const) {
    if (s.bestStreak >= min) out.push(id);
  }
  if (s.perfectPuzzle) out.push("sharp");
  if (s.fastPuzzle) out.push("fast");
  for (const [cat, id] of Object.entries(TOPIC_TITLES)) {
    if ((s.categoryReads[cat] ?? 0) >= 10) out.push(id);
  }
  return out;
}

export function isTitleId(x: unknown): x is TitleId {
  return typeof x === "string" && Object.hasOwn(TITLES, x);
}
