import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  bestStreak,
  isTitleId,
  unlockedTitles,
  canRepair,
  cardPoints,
  earnedBadges,
  istDay,
  levelFor,
  puzzlePoints,
  readLongEnough,
  streakFrom,
  weekStart,
} from "./rules.ts";

test("IST day boundary", () => {
  // 18:29 UTC = 23:59 IST, 18:30 UTC = 00:00 IST next day
  assert.equal(istDay(new Date("2026-10-15T18:29:00Z")), "2026-10-15");
  assert.equal(istDay(new Date("2026-10-15T18:30:00Z")), "2026-10-16");
});

test("date helpers", () => {
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(weekStart("2026-10-15"), "2026-10-12"); // Thursday -> Monday
  assert.equal(weekStart("2026-10-18"), "2026-10-12"); // Sunday -> Monday
  assert.equal(weekStart("2026-10-12"), "2026-10-12");
});

test("streak survives until today ends, breaks on a gap", () => {
  const days = new Set(["2026-10-12", "2026-10-13", "2026-10-14"]);
  assert.equal(streakFrom(days, "2026-10-15"), 3); // today not done yet
  days.add("2026-10-15");
  assert.equal(streakFrom(days, "2026-10-15"), 4);
  assert.equal(streakFrom(days, "2026-10-17"), 0); // missed the 16th
});

test("card points: multiplier capped at x2, late reads are flat half", () => {
  assert.equal(cardPoints(true, 0), 10);
  assert.equal(cardPoints(true, 5), 15);
  assert.equal(cardPoints(true, 40), 20);
  assert.equal(cardPoints(false, 40), 5);
});

test("15 second read gate", () => {
  assert.equal(readLongEnough(0, 14_999), false);
  assert.equal(readLongEnough(0, 15_000), true);
});

test("puzzle scoring", () => {
  assert.equal(puzzlePoints(5, 0), 50);
  assert.equal(puzzlePoints(5, 60_000), 30);
  assert.equal(puzzlePoints(0, 1_000), 0);
  assert.equal(puzzlePoints(5, 70_000), 0); // past time + grace
});

test("repair window is 1..7 days back", () => {
  assert.equal(canRepair("2026-10-14", "2026-10-15"), true);
  assert.equal(canRepair("2026-10-08", "2026-10-15"), true);
  assert.equal(canRepair("2026-10-07", "2026-10-15"), false);
  assert.equal(canRepair("2026-10-15", "2026-10-15"), false);
});

test("levels and badges", () => {
  assert.equal(levelFor(0).name, "Newbie");
  assert.equal(levelFor(299).name, "Reader");
  assert.equal(levelFor(5000).name, "Oracle");
  assert.equal(levelFor(5000).next, null);
  assert.deepEqual(
    earnedBadges({ daysCaughtUp: 8, streak: 7, perfectPuzzle: false, fastPuzzle: true, maxCategoryReads: 3 }),
    ["first", "streak7", "fast"],
  );
});

test("best streak finds the longest run, not the latest", () => {
  const days = new Set(["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-05", "2026-10-06"]);
  assert.equal(bestStreak(days), 3);
  assert.equal(bestStreak(new Set()), 0);
});

test("titles unlock from lifetime milestones", () => {
  const none = { earned: 0, bestStreak: 0, perfectPuzzle: false, fastPuzzle: false, categoryReads: {} };
  assert.deepEqual(unlockedTitles(none), []);
  assert.deepEqual(
    unlockedTitles({ earned: 320, bestStreak: 7, perfectPuzzle: true, fastPuzzle: false, categoryReads: { Security: 10, AI: 9 } }),
    ["reader", "insider", "week", "sharp", "security"],
  );
  assert.equal(isTitleId("oracle"), true);
  assert.equal(isTitleId("toString"), false);
});
