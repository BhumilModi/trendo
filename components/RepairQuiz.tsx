"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type CSSProperties } from "react";
import { startRepairAction, submitRepairAction } from "@/app/actions";
import { Cross, Next, Tick } from "./ui";

type Q = { id: number; question: string; options: string[] };
type Result = { passed: boolean; inTime: boolean; answers: Record<string, number> };

const PER_QUESTION_MS = 20_000;

export default function RepairQuiz({ day }: { day: string }) {
  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [left, setLeft] = useState(20);
  const [deadline, setDeadline] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const sent = useRef(false);

  function start() {
    startTransition(async () => {
      const r = await startRepairAction(day);
      if ("error" in r && r.error) return setError(r.error);
      if (!("questions" in r) || !r.questions) return;
      setQuestions(r.questions);
      setDeadline(Date.now() + PER_QUESTION_MS);
    });
  }

  function submit(final: Record<number, number>) {
    if (sent.current) return;
    sent.current = true;
    startTransition(async () => {
      const r = await submitRepairAction(day, final);
      if ("error" in r && r.error) return setError(r.error);
      setResult(r as Result);
    });
  }

  function advance(final: Record<number, number>) {
    if (!questions) return;
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setDeadline(Date.now() + PER_QUESTION_MS);
    } else submit(final);
  }

  useEffect(() => {
    if (!questions || result || sent.current) return;
    const id = setInterval(() => {
      const s = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) advance(answers);
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, deadline, result, answers, index]);

  function pick(i: number) {
    if (!questions || result || sent.current) return;
    const next = { ...answers, [questions[index].id]: i };
    setAnswers(next);
    advance(next);
  }

  if (!questions) {
    return (
      <>
        <section className="block print">
          <h1 className="h1">Patch this day with a quiz.</h1>
          <p className="lede">
            Two questions about that day&apos;s stories, 20 seconds each. Get both right and the day counts for your streak. You get one try.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </section>
        <div className="dock no-nav">
          <div className="dock-inner" style={{ display: "grid", gap: 8 }}>
            <button className="btn" onClick={start} disabled={pending || Boolean(error)}>
              <span>{pending ? "Starting…" : "Start the quiz"}</span>
              <span className="meta">2 questions</span>
            </button>
            <Link href="/archive" className="btn btn-quiet btn-small" style={{ width: "100%" }}>
              Back to back issues
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (result) {
    return (
      <>
        <section className="end">
          <h1 className="h1">
            {result.passed ? "Day patched. Your streak counts it." : result.inTime ? "Not this time." : "Time ran out."}
          </h1>
          {!result.passed && <p className="lede">You can still patch this day with points in Back issues.</p>}
          {questions.map((q) => (
            <div key={q.id} className="block">
              <p className="item-head">{q.question}</p>
              {q.options.map((o, i) => {
                const right = result.answers[q.id] === i;
                const mine = answers[q.id] === i;
                return (
                  <div key={i} className="choice" data-result={right ? "right" : mine ? "wrong" : undefined}>
                    <span style={{ flex: 1 }}>{o}</span>
                    {right ? (
                      <Tick />
                    ) : mine ? (
                      <span className="mark-wrong">
                        <Cross />
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </section>
        <div className="dock no-nav">
          <div className="dock-inner">
            <Link href="/archive" className="btn">
              <span>Back issues</span>
              <Next />
            </Link>
          </div>
        </div>
      </>
    );
  }

  const q = questions[index];
  return (
    <>
      <div className="dateline slug">
        <span>
          Question <b>{index + 1}</b> of {questions.length}
        </span>
        <span>
          Time <b style={{ color: left <= 5 ? "var(--red)" : undefined }}>{left}s</b>
        </span>
      </div>
      <div className="btn feed feed-drain" key={`${q.id}-${deadline}`} aria-hidden style={{ "--feed": `${PER_QUESTION_MS}ms`, minHeight: 8, padding: 0, marginTop: 12 } as CSSProperties}>
        <span className="feed-ink" />
      </div>
      <section className="block print" key={q.id}>
        <h1 className="h2">{q.question}</h1>
        {q.options.map((o, i) => (
          <button key={i} className="choice" onClick={() => pick(i)} disabled={pending}>
            {o}
          </button>
        ))}
      </section>
    </>
  );
}
