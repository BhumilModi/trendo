"use client";

import { useEffect, useState, useTransition, type CSSProperties } from "react";
import { completeCardAction, openCardAction } from "@/app/actions";
import { Next } from "./ui";

/**
 * The feed bar. The server starts the 15 s clock when the card opens and
 * refuses "next" until it has run out; this only shows that clock.
 */
export default function CardReader({ storyId, last }: { storyId: number; last: boolean }) {
  // Clock is tagged with its story, so a stale clock never unlocks the next card.
  const [clock, setClock] = useState<{ id: number; deadline: number; duration: number } | null>(null);
  const deadline = clock?.id === storyId ? clock.deadline : null;
  const duration = clock?.duration ?? 15000;
  const [left, setLeft] = useState(15);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    openCardAction(storyId).then((r) => {
      if (cancelled) return;
      if ("error" in r && r.error) return setError(r.error);
      const ms = r.remainingMs ?? 0;
      setError(null);
      setClock({ id: storyId, deadline: Date.now() + ms, duration: ms });
    });
    return () => {
      cancelled = true;
    };
  }, [storyId]);

  useEffect(() => {
    if (deadline === null) return;
    const tick = () => setLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadline]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const ready = deadline !== null && left === 0;
  const label = ready ? (last ? "Finish the day" : "Next story") : deadline === null ? "Opening…" : "Keep reading";

  function next() {
    if (!ready || pending) return;
    startTransition(async () => {
      const r = await completeCardAction(storyId);
      if ("error" in r && r.error) return setError(r.error);
      if ("points" in r) {
        const badge = r.badges?.length ? ` · Badge: ${r.badges[0]}` : "";
        setToast(`+${r.points} pts${badge}`);
      }
    });
  }

  return (
    <>
      {toast && (
        <div className="toast" role="status" style={{ bottom: 92 }}>
          {toast}
        </div>
      )}
      <div className="dock no-nav">
        <div className="dock-inner">
          {error && (
            <p className="error" role="alert" style={{ margin: "0 0 10px" }}>
              {error}
            </p>
          )}
          <button
            key={`${storyId}-${deadline}`}
            className="btn feed"
            data-ready={ready || undefined}
            onClick={next}
            aria-disabled={!ready}
            style={{ "--feed": `${duration}ms` } as CSSProperties}
          >
            <span>{label}</span>
            <span className="meta">{ready ? "" : `${left}s`}</span>
            {deadline !== null && (
              <span className="feed-ink" aria-hidden>
                <span>{label}</span>
                {ready ? <Next /> : <span className="meta">{left}s</span>}
              </span>
            )}
            {deadline !== null && <span className="feed-caret" aria-hidden />}
          </button>
          <span className="sr-only" aria-live="polite">
            {ready ? (last ? "You can finish the day now." : "Next story ready.") : ""}
          </span>
        </div>
      </div>
    </>
  );
}
