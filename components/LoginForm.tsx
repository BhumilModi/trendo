"use client";

import { useActionState, useState } from "react";
import { authAction } from "@/app/actions";
import { Alert, Next } from "./ui";

export default function LoginForm() {
  const [state, action, pending] = useActionState(authAction, null);
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const error = state?.error;

  return (
    <form action={action} className="block">
      <div className="tabs" role="radiogroup" aria-label="Account">
        <label>
          <input type="radio" name="mode" value="signup" checked={mode === "signup"} onChange={() => setMode("signup")} />
          <span>New here</span>
        </label>
        <label>
          <input type="radio" name="mode" value="login" checked={mode === "login"} onChange={() => setMode("login")} />
          <span>I have an account</span>
        </label>
      </div>

      <label className="field">
        <span className="slug slug-ink">Your name</span>
        <input
          name="username"
          key={state?.username}
          defaultValue={state?.username}
          required
          minLength={3}
          maxLength={20}
          pattern="[A-Za-z0-9_]{3,20}"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="e.g. priya_k"
        />
        <span className="hint">{mode === "signup" ? "3 to 20 letters, numbers or _. Others see it on the board." : " "}</span>
      </label>

      <label className="field">
        <span className="slug slug-ink">4-digit PIN</span>
        <input
          name="pin"
          type="password"
          inputMode="numeric"
          required
          pattern="\d{4}"
          maxLength={4}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder="••••"
        />
        <span className="hint">{mode === "signup" ? "Remember it. There is no email reset yet." : " "}</span>
      </label>

      {error && (
        <p className="error" role="alert">
          <Alert /> {error}
        </p>
      )}

      <div className="block">
        <button className="btn" disabled={pending}>
          <span>{pending ? "One moment…" : mode === "signup" ? "Start reading" : "Log in"}</span>
          <Next />
        </button>
      </div>
    </form>
  );
}
