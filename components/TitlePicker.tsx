"use client";

import { useState, useTransition } from "react";
import { setTitleAction } from "@/app/actions";
import { TITLES, type TitleId } from "@/lib/rules";

export default function TitlePicker({ unlocked, current }: { unlocked: TitleId[]; current: TitleId | null }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const locked = (Object.keys(TITLES) as TitleId[]).filter((t) => !unlocked.includes(t));

  function wear(title: TitleId | null) {
    if (pending || title === current) return;
    startTransition(async () => {
      const r = await setTitleAction(title);
      setError("error" in r && r.error ? r.error : null);
    });
  }

  return (
    <section className="block" id="title" style={{ scrollMarginTop: 16 }}>
      <div className="block-head">
        <span className="slug slug-ink">Your title</span>
        <span className="slug">
          {unlocked.length} of {Object.keys(TITLES).length} unlocked
        </span>
      </div>
      <p className="hint" style={{ marginTop: 10 }}>
        Your title shows next to your name on the board and on your profile.
      </p>
      <div className="chips" role="radiogroup" aria-label="Title">
        <button className="chip" role="radio" aria-checked={current === null} onClick={() => wear(null)} disabled={pending}>
          No title
        </button>
        {unlocked.map((t) => (
          <button key={t} className="chip" role="radio" aria-checked={current === t} onClick={() => wear(t)} disabled={pending}>
            {TITLES[t].name}
          </button>
        ))}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {locked.length > 0 && (
        <>
          <p className="slug" style={{ marginTop: 18 }}>
            Still locked
          </p>
          {locked.map((t) => (
            <div key={t} className="row">
              <span style={{ fontWeight: 600, color: "var(--ink-2)" }}>{TITLES[t].name}</span>
              <span className="hint" style={{ textAlign: "right" }}>
                {TITLES[t].hint}
              </span>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
