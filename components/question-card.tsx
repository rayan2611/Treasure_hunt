"use client";

import { FormEvent, useEffect, useState } from "react";
import { PrimaryButton } from "@/components/ui";
import type { CurrentQuestion } from "@/lib/types";

type SubmitState = "idle" | "loading" | "wrong" | "correct" | "rate_limited";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function QuestionCard({
  question,
  onSolved
}: {
  question: CurrentQuestion;
  onSolved: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const [autoContinueArmed, setAutoContinueArmed] = useState(false);

  // Reset local UI state whenever a new question is unlocked.
  useEffect(() => {
    setAnswer("");
    setState("idle");
    setMessage("");
    setAutoContinueArmed(false);
  }, [question.questionId]);

  useEffect(() => {
    if (state !== "correct" || autoContinueArmed) return;
    setAutoContinueArmed(true);
    const reduceMotion = prefersReducedMotion();
    const timer = setTimeout(onSolved, reduceMotion ? 900 : 1800);
    return () => clearTimeout(timer);
  }, [state, autoContinueArmed, onSolved]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!answer.trim() || state === "loading" || state === "correct") return;

    setState("loading");
    setMessage("");

    let response: Response;
    try {
      response = await fetch("/api/answer/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          questionId: question.questionId,
          answer
        })
      });
    } catch {
      setState("wrong");
      setMessage("Connection lost. Check your network and try again.");
      return;
    }

    const data = await response.json().catch(() => ({}));

    if (response.ok && data.correct) {
      setState("correct");
      setMessage("CLUE SOLVED — the path opens.");
      return;
    }

    if (response.status === 429 || data.code === "RATE_LIMITED") {
      setState("rate_limited");
      setMessage("Slow down — try again in a moment.");
      return;
    }

    setState("wrong");
    setMessage(
      data.code === "EVENT_PAUSED"
        ? "The hunt is temporarily paused."
        : data.code === "EVENT_ENDED"
        ? "The hunt has ended."
        : data.code === "QUESTION_LOCKED"
        ? "This clue is no longer current. Reloading…"
        : "That isn't the answer. Try again."
    );

    if (data.code === "QUESTION_LOCKED") {
      setTimeout(onSolved, 600);
    }
  }

  const isCorrect = state === "correct";
  const isWrong = state === "wrong";
  const isRateLimited = state === "rate_limited";

  return (
    <article
      className={`overflow-hidden rounded-3xl border bg-panel transition ${
        isCorrect ? "border-gold/70 animate-gold-glow" : "border-white/10"
      }`}
    >
      <div className="grid md:grid-cols-2">
        <div className="p-7 sm:p-9">
          <p className="text-xs font-black uppercase tracking-[.22em] text-gold">
            Clue {String(question.questionNumber).padStart(2, "0")}
          </p>
          <h1 className="mt-4 text-3xl font-black">{question.title ?? "The trail continues"}</h1>
          <p className="mt-6 whitespace-pre-wrap text-lg leading-8 text-warm/90">{question.questionText}</p>

          {isCorrect ? (
            <div className="mt-8" role="status" aria-live="polite">
              <p className="text-xl font-black text-gold">CLUE SOLVED</p>
              <p className="mt-2 text-muted">The path opens…</p>
              <div className="mt-5">
                <PrimaryButton type="button" onClick={onSolved}>
                  CONTINUE TO NEXT CLUE
                </PrimaryButton>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8">
              <label htmlFor="answer" className="mb-2 block text-sm font-bold text-muted">
                Your answer
              </label>
              <input
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={state === "loading"}
                aria-invalid={isWrong}
                className={`min-h-14 w-full rounded-2xl border bg-ink px-4 outline-none transition disabled:opacity-60 ${
                  isWrong ? "border-red-400/60 animate-shake" : isRateLimited ? "border-gold/40" : "border-white/10 focus:border-gold/70"
                }`}
                placeholder="Enter your answer"
                autoComplete="off"
              />

              {message && (
                <p
                  role="alert"
                  className={`mt-3 text-sm font-bold ${
                    isRateLimited ? "text-gold" : "text-red-300"
                  }`}
                >
                  {message}
                </p>
              )}

              <div className="mt-5">
                <PrimaryButton type="submit" disabled={!answer.trim() || state === "loading"}>
                  {state === "loading" ? "Checking…" : "Submit Answer"}
                </PrimaryButton>
              </div>
            </form>
          )}
        </div>

        <div className="game-grid flex min-h-64 items-center justify-center border-t border-white/8 bg-black/35 p-8 md:border-l md:border-t-0">
          {question.mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={question.mediaUrl} alt="" className="max-h-[440px] w-full rounded-2xl object-cover" />
          ) : (
            <div className="text-center">
              <div className="text-6xl">🪶</div>
              <p className="mt-4 text-sm text-muted">Clue visual / media placeholder</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
