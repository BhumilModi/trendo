"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type CSSProperties } from "react";
import { startPuzzleAction, submitPuzzleAction } from "@/app/actions";
import { Cross, Flag, Next, Tick } from "./ui";
import { MatchArt } from "./art";

type Game = { headlines: { id: number; headline: string }[]; companies: string[]; deadline: number; total: number };
type Result = { correct: number; points: number; answers: Record<string, string>; badges: string[] };

const LIMIT_MS = 60_000;

export default function Puzzle({ resume }: { resume: boolean }) {
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [pairs, setPairs] = useState<Record<number, string>>({});
  const [left, setLeft] = useState(60);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, startTransition] = useTransition();
  const submitted = useRef(false);

  function start() {
    startTransition(async () => {
      const r = await startPuzzleAction();
      if ("error" in r && r.error) return setError(r.error);
      if (!("headlines" in r) || !r.headlines) return;
      // Server clock decides; shift it into the local clock once.
      const remaining = Math.max(0, r.startedAt! + LIMIT_MS - r.serverNow!);
      setGame({ headlines: r.headlines, companies: r.companies!, deadline: Date.now() + remaining, total: remaining });
      setPicked(r.headlines[0]?.id ?? null);
    });
  }

  function submit(final: Record<number, string>) {
    if (submitted.current) return;
    submitted.current = true;
    startTransition(async () => {
      const r = await submitPuzzleAction(final);
      if ("error" in r && r.error) return setError(r.error);
      setResult(r as Result);
    });
  }

  useEffect(() => {
    if (resume) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!game || result) return;
    const id = setInterval(() => {
      const s = Math.max(0, Math.ceil((game.deadline - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) submit(pairs);
    }, 250);
    return () => clearInterval(id);
  }, [game, result, pairs]);

  function choose(company: string) {
    if (picked === null || result) return;
    const next = { ...pairs };
    for (const [id, c] of Object.entries(next)) if (c === company) delete next[Number(id)];
    next[picked] = company;
    setPairs(next);
    const open = game!.headlines.find((h) => !next[h.id]);
    setPicked(open ? open.id : null);
  }

  if (!game) {
    return (
      <>
        <section className="block print">
          <div style={{ marginBottom: 18 }}>
            <MatchArt />
          </div>
          <h1 className="h1">Match each story to its company.</h1>
          <p className="lede">
            Tap a story, then tap the company it is about. You have 60 seconds. 6 points for each right match, plus up to 20 for speed.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </section>
        <div className="dock no-nav">
          <div className="dock-inner">
            <button className="btn" onClick={start} disabled={pending}>
              <span>{pending ? "Starting…" : "Start the clock"}</span>
              <span className="meta">60 sec</span>
            </button>
          </div>
        </div>
      </>
    );
  }

  const done = Object.keys(pairs).length === game.headlines.length;
  const used = new Set(Object.values(pairs));

  return (
    <>
      <div className="dateline slug">
        <span>
          Matched <b>{Object.keys(pairs).length}</b> of {game.headlines.length}
        </span>
        <span>
          Time <b style={{ color: left <= 10 && !result ? "var(--red)" : undefined }}>{result ? "stopped" : `${left}s`}</b>
        </span>
      </div>

      <ol className="items" aria-label="Stories">
        {game.headlines.map((h, i) => {
          const verdict = result ? (result.answers[h.id] === pairs[h.id] ? "right" : "wrong") : undefined;
          return (
            <li key={h.id}>
              <button className="pick" aria-pressed={!result && picked === h.id} onClick={() => !result && setPicked(h.id)}>
                <span className="item-no">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span className="item-head" style={{ display: "block" }}>
                    {h.headline}
                  </span>
                  {pairs[h.id] && (
                    <span
                      className={`tag ${verdict === "wrong" ? "tag-struck" : ""}`}
                      aria-label={verdict === "wrong" ? `Your pick: ${pairs[h.id]}` : undefined}
                    >
                      {pairs[h.id]}
                    </span>
                  )}
                  {verdict === "wrong" && (
                    <span className="tag" style={{ marginLeft: 6 }}>
                      Answer: {result!.answers[h.id]}
                    </span>
                  )}
                </span>
                {verdict === "right" ? (
                  <Tick />
                ) : verdict === "wrong" ? (
                  <span className="mark-wrong">
                    <Cross />
                  </span>
                ) : picked === h.id ? (
                  <Flag />
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>

      {!result && (
        <section className="block">
          <p className="slug">
            {picked === null ? "Tap a story above" : `Story ${game.headlines.findIndex((h) => h.id === picked) + 1} is about…`}
          </p>
          <div className="chips">
            {game.companies.map((c) => (
              <button key={c} className="chip" data-used={used.has(c) || undefined} onClick={() => choose(c)} disabled={picked === null}>
                {c}
              </button>
            ))}
          </div>
        </section>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="dock no-nav">
        <div className="dock-inner">
          {result ? (
            <>
              <p className="h2" style={{ marginBottom: 10 }}>
                {result.correct} of 5 right · +{result.points} pts
                {result.badges.length ? ` · Badge: ${result.badges.join(", ")}` : ""}
              </p>
              <Link href="/" className="btn">
                <span>Back to today</span>
                <Next />
              </Link>
            </>
          ) : (
            <button
              className="btn feed feed-drain"
              onClick={() => submit(pairs)}
              disabled={!done || pending}
              style={{ "--feed": `${game.total}ms` } as CSSProperties}
            >
              <span>{done ? "Check my answers" : "Match all 5 to check"}</span>
              <span className="meta">{left}s</span>
              <span className="feed-ink" aria-hidden>
                <span>{done ? "Check my answers" : "Match all 5 to check"}</span>
                <span className="meta">{left}s</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
