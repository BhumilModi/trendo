import { createClient, type InStatement } from "@libsql/client";

// Local file in dev (zero setup), Turso in production.
const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Idempotent, so it runs once per server start instead of a migration step.
// Composite primary keys and UNIQUE(user_id, reason) are the anti-double-claim guarantees.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  pin_hash TEXT NOT NULL,
  failed_pins INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS days (
  day TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS stories (
  id INTEGER PRIMARY KEY,
  day TEXT NOT NULL,
  position INTEGER NOT NULL,
  headline TEXT NOT NULL,
  what TEXT NOT NULL,
  why TEXT NOT NULL,
  category TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  company TEXT NOT NULL,
  question TEXT NOT NULL,
  options TEXT NOT NULL,
  answer_index INTEGER NOT NULL,
  image_url TEXT,
  UNIQUE (day, position)
);
CREATE TABLE IF NOT EXISTS reads (
  user_id INTEGER NOT NULL,
  story_id INTEGER NOT NULL,
  opened_at INTEGER NOT NULL,
  completed_at INTEGER,
  PRIMARY KEY (user_id, story_id)
);
CREATE TABLE IF NOT EXISTS day_progress (
  user_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  kind TEXT NOT NULL, -- on_time | late | repaired_quiz | repaired_points
  at INTEGER NOT NULL,
  PRIMARY KEY (user_id, day)
);
CREATE TABLE IF NOT EXISTS puzzle_attempts (
  user_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  submitted_at INTEGER,
  correct INTEGER,
  PRIMARY KEY (user_id, day)
);
CREATE TABLE IF NOT EXISTS repair_attempts (
  user_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  story_ids TEXT NOT NULL,
  passed INTEGER,
  PRIMARY KEY (user_id, day)
);
CREATE TABLE IF NOT EXISTS points_ledger (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  points INTEGER NOT NULL,
  at INTEGER NOT NULL,
  UNIQUE (user_id, reason)
);
CREATE INDEX IF NOT EXISTS ledger_at ON points_ledger (at);
CREATE TABLE IF NOT EXISTS user_titles (
  user_id INTEGER PRIMARY KEY,
  title TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS user_badges (
  user_id INTEGER NOT NULL,
  badge TEXT NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (user_id, badge)
);
`;

let ready: Promise<unknown> | undefined;

// Columns added after the first deploy. "duplicate column" means it's already there.
const MIGRATIONS = ["ALTER TABLE stories ADD COLUMN image_url TEXT"];

async function migrate() {
  await client.executeMultiple(SCHEMA);
  for (const sql of MIGRATIONS) {
    await client.execute(sql).catch((e) => {
      if (!String(e).includes("duplicate column")) throw e;
    });
  }
}

function init() {
  ready ??= migrate().catch((e) => {
    ready = undefined;
    throw e;
  });
  return ready;
}

type Args = (string | number | null)[];

export async function query<T = Record<string, unknown>>(sql: string, args: Args = []): Promise<T[]> {
  await init();
  const res = await client.execute({ sql, args });
  return res.rows as unknown as T[];
}

export async function one<T = Record<string, unknown>>(sql: string, args: Args = []): Promise<T | undefined> {
  return (await query<T>(sql, args))[0];
}

/** Returns rows affected — callers use it to make claims race-safe. */
export async function run(sql: string, args: Args = []): Promise<number> {
  await init();
  return (await client.execute({ sql, args })).rowsAffected;
}

export async function batch(stmts: InStatement[]) {
  await init();
  return client.batch(stmts, "write");
}
