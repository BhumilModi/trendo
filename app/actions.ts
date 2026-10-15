"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { logIn, logOut, renewSession, requireUser, signUp } from "@/lib/auth";
import * as game from "@/lib/game";

type AuthState = { error: string; username: string; mode: string } | null;

export async function authAction(_: AuthState, form: FormData): Promise<AuthState> {
  const username = String(form.get("username") ?? "").trim();
  const pin = String(form.get("pin") ?? "");
  const mode = form.get("mode") === "signup" ? "signup" : "login";
  const error = mode === "signup" ? await signUp(username, pin) : await logIn(username, pin);
  // Returned so the form can refill the name after React resets it.
  if (error) return { error, username, mode };
  redirect("/");
}

export async function logOutAction() {
  await logOut();
  redirect("/login");
}

export async function openCardAction(storyId: number) {
  const user = await requireUser();
  return game.openCard(user.id, storyId);
}

export async function completeCardAction(storyId: number) {
  const user = await requireUser();
  await renewSession();
  const result = await game.completeCard(user.id, storyId);
  refresh();
  return result;
}

export async function startPuzzleAction() {
  const user = await requireUser();
  return game.startPuzzle(user.id);
}

export async function submitPuzzleAction(answers: Record<string, string>) {
  const user = await requireUser();
  return game.submitPuzzle(user.id, answers);
}

export async function startRepairAction(day: string) {
  const user = await requireUser();
  return game.startRepair(user.id, day);
}

export async function submitRepairAction(day: string, answers: Record<string, number>) {
  const user = await requireUser();
  return game.submitRepair(user.id, day, answers);
}

export async function setTitleAction(title: string | null) {
  const user = await requireUser();
  const result = await game.setTitle(user.id, title);
  refresh();
  return result;
}

export async function buyRepairAction(day: string) {
  const user = await requireUser();
  const result = await game.repairWithPoints(user.id, day);
  refresh();
  return result;
}
