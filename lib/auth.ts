import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { one, run } from "./db";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

const COOKIE = "trendo_session";
const SESSION_DAYS = 90;
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

export const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
export const PIN_RE = /^\d{4}$/;

export type User = { id: number; username: string };

async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${(await scrypt(pin, salt, 32)).toString("hex")}`;
}

async function checkPin(pin: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  const actual = await scrypt(pin, Buffer.from(salt, "hex"), 32);
  return timingSafeEqual(actual, Buffer.from(hash, "hex"));
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

async function startSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  await run("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)", [sha256(token), userId, expires]);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 86_400,
    path: "/",
  });
}

/** Returns an error message, or null on success. */
export async function signUp(username: string, pin: string): Promise<string | null> {
  if (!USERNAME_RE.test(username)) return "Use 3 to 20 letters, numbers or _.";
  if (!PIN_RE.test(pin)) return "PIN must be 4 digits.";
  const added = await run("INSERT OR IGNORE INTO users (username, pin_hash, created_at) VALUES (?, ?, ?)", [
    username,
    await hashPin(pin),
    Date.now(),
  ]);
  if (!added) return "This name is taken. Try another.";
  const user = await one<{ id: number }>("SELECT id FROM users WHERE username = ?", [username]);
  await startSession(user!.id);
  return null;
}

export async function logIn(username: string, pin: string): Promise<string | null> {
  const wrong = "Name or PIN is wrong.";
  const user = await one<{ id: number; pin_hash: string; failed_pins: number; locked_until: number }>(
    "SELECT id, pin_hash, failed_pins, locked_until FROM users WHERE username = ?",
    [username],
  );
  if (!user || !PIN_RE.test(pin)) return wrong;
  const now = Date.now();
  if (user.locked_until > now) {
    return `Too many tries. Try again in ${Math.ceil((user.locked_until - now) / 60_000)} min.`;
  }
  if (!(await checkPin(pin, user.pin_hash))) {
    const fails = user.failed_pins + 1;
    await run("UPDATE users SET failed_pins = ?, locked_until = ? WHERE id = ?", [
      fails >= MAX_FAILS ? 0 : fails,
      fails >= MAX_FAILS ? now + LOCK_MS : 0,
      user.id,
    ]);
    return fails >= MAX_FAILS ? "Too many tries. Try again in 15 min." : wrong;
  }
  await run("UPDATE users SET failed_pins = 0, locked_until = 0 WHERE id = ?", [user.id]);
  await startSession(user.id);
  return null;
}

export async function logOut() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await run("DELETE FROM sessions WHERE token_hash = ?", [sha256(token)]);
  jar.delete(COOKIE);
}

/** Current user or null. Cached per request. */
export const getUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = await one<User>(
    "SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?",
    [sha256(token), Date.now()],
  );
  return row ? { id: Number(row.id), username: String(row.username) } : null;
});

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
