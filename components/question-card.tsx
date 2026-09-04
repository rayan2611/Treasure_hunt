"use client";

import { FormEvent, useState } from "react";
import { PrimaryButton } from "@/components/ui";
import type { CurrentQuestion } from "@/lib/types";

export function QuestionCard({
  question,
  onSolved
}: {
  question: CurrentQuestion;
  onSolved: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "wrong" | "correct">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!answer.trim() || state === "loading") return;

    setState("loading");
    setMessage("");

    const response = await fetch("/api/answer/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        questionId: question.questionId,
        answer
      })
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && data.correct) {
      setState("correct");
      setMessage("CLUE SOLVED — the path opens.");
      setTimeout(onSolved, 1200);
      return;
    }

    setState("wrong");
    setMessage(
      data.code === "EVENT_PAUSED"
        ? "The hunt is temporarily paused."
        : data.code === "RATE_LIMITED"
        ? "Too many attempts. Wait a moment and try again."
        : "That isn't the answer. Try again."
    );
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-panel">
      <div className="grid md:grid-cols-2">
        <div className="p-7 sm:p-9">
          <p className="text-xs font-black uppercase tracking-[.22em] text-gold">
            Clue {String(question.questionNumber).padStart(2, "0")}
          </p>
          <h1 className="mt-4 text-3xl font-black">{question.title ?? "The trail continues"}</h1>
          <p className="mt-6 whitespace-pre-wrap text-lg leading-8 text-warm/90">{question.questionText}</p>

          <form onSubmit={submit} className="mt-8">
            <label htmlFor="answer" className="mb-2 block text-sm font-bold text-muted">
              Your answer
            </label>
            <input
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className={`min-h-14 w-full rounded-2xl border bg-ink px-4 outline-none transition ${
                state === "wrong" ? "border-red-400/60" : "border-white/10 focus:border-gold/70"
              }`}
              placeholder="Enter your answer"
              autoComplete="off"
            />

            {message && (
              <p
                className={`mt-3 text-sm font-bold ${
                  state === "correct" ? "text-gold" : "text-red-300"
                }`}
              >
                {message}
              </p>
            )}

            <div className="mt-5">
              <PrimaryButton type="submit" disabled={!answer.trim() || state === "loading" || state === "correct"}>
                {state === "loading" ? "Checking…" : state === "correct" ? "Unlocked" : "Submit Answer"}
              </PrimaryButton>
            </div>
          </form>
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
