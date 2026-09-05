"use client";

import { FormEvent, useEffect, useState } from "react";
import { PrimaryButton } from "@/components/ui";
import { CHECKPOINT_CODE_TTL_MS } from "@/lib/checkpoint-secret";

type VerifyState = "idle" | "loading" | "wrong" | "rate_limited";

function formatRemaining(ms: number) {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Shows the 6-digit code issued by /api/checkpoint/scan with a live countdown,
 * and the input for redeeming it via /api/checkpoint/verify-code. Split out
 * from QuestionCard so it (and its correct/wrong/expired/rate-limited states)
 * can be tested without mocking camera access.
 */
export function CheckpointCodeForm({
  issuedCode,
  expiresAt,
  onCorrect,
  onExpired,
  onQuestionLocked
}: {
  issuedCode: string;
  expiresAt: string;
  onCorrect: (result: { currentQuestion: number; questionsCompleted: number; finished: boolean }) => void;
  onExpired: () => void;
  onQuestionLocked?: () => void;
}) {
  const [codeInput, setCodeInput] = useState("");
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [remainingMs, setRemainingMs] = useState(() => new Date(expiresAt).getTime() - Date.now());

  useEffect(() => {
    const targetMs = new Date(expiresAt).getTime();
    const tick = () => {
      const remaining = targetMs - Date.now();
      setRemainingMs(remaining);
      if (remaining <= 0) onExpired();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  async function submitCode(e: FormEvent) {
    e.preventDefault();
    if (codeInput.length !== 6 || verifyState === "loading") return;

    setVerifyState("loading");
    setVerifyMessage("");

    let response: Response;
    try {
      response = await fetch("/api/checkpoint/verify-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: codeInput })
      });
    } catch {
      setVerifyState("wrong");
      setVerifyMessage("Connection lost. Check your network and try again.");
      return;
    }

    const data = await response.json().catch(() => ({}));

    if (response.ok && data.correct) {
      onCorrect({
        currentQuestion: data.currentQuestion,
        questionsCompleted: data.questionsCompleted,
        finished: data.finished
      });
      return;
    }

    if (response.status === 410 || data.code === "CODE_EXPIRED") {
      onExpired();
      return;
    }

    if (response.status === 429 || data.code === "RATE_LIMITED") {
      setVerifyState("rate_limited");
      setVerifyMessage("Slow down — try again in a moment.");
      return;
    }

    setVerifyState("wrong");
    setCodeInput("");
    setVerifyMessage(
      data.code === "EVENT_PAUSED"
        ? "The hunt is temporarily paused."
        : data.code === "EVENT_ENDED"
        ? "The hunt has ended."
        : data.code === "QUESTION_LOCKED"
        ? "This checkpoint is no longer current. Reloading…"
        : data.code === "WRONG_CODE"
        ? "That code isn't right. Try again."
        : "Something went wrong submitting that. Try again."
    );

    if (data.code === "QUESTION_LOCKED") {
      setTimeout(() => onQuestionLocked?.(), 600);
    }
  }

  return (
    <div className="mt-8">
      <p className="text-sm font-bold text-muted">Checkpoint code</p>
      <p className="mt-2 text-5xl font-black tracking-[.15em] text-gold" aria-live="polite">
        {issuedCode}
      </p>
      <p className="mt-2 text-sm text-muted" role="timer" aria-live="polite">
        Expires in {formatRemaining(remainingMs || CHECKPOINT_CODE_TTL_MS)}
      </p>

      <form onSubmit={submitCode} className="mt-6">
        <label htmlFor="checkpoint-code" className="mb-2 block text-sm font-bold text-muted">
          Enter the 6-digit code
        </label>
        <input
          id="checkpoint-code"
          inputMode="numeric"
          maxLength={6}
          pattern="\d{6}"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
          disabled={verifyState === "loading"}
          aria-invalid={verifyState === "wrong"}
          className={`min-h-16 w-full rounded-2xl border bg-ink px-4 text-center text-3xl font-black tracking-[.35em] outline-none transition disabled:opacity-60 ${
            verifyState === "wrong"
              ? "border-red-400/60 animate-shake"
              : verifyState === "rate_limited"
              ? "border-gold/40"
              : "border-white/10 focus:border-gold/70"
          }`}
          placeholder="000000"
          autoComplete="off"
        />

        {verifyMessage && (
          <p
            role="alert"
            className={`mt-3 text-sm font-bold ${verifyState === "rate_limited" ? "text-gold" : "text-red-300"}`}
          >
            {verifyMessage}
          </p>
        )}

        <div className="mt-5">
          <PrimaryButton type="submit" disabled={codeInput.length !== 6 || verifyState === "loading"}>
            {verifyState === "loading" ? "Checking…" : "Submit Code"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
