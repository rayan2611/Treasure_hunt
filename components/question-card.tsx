"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { PrimaryButton } from "@/components/ui";
import { CheckpointCodeForm } from "@/components/checkpoint-code-form";
import { extractCheckpointSecret } from "@/lib/checkpoint-secret";
import type { CurrentQuestion } from "@/lib/types";

// Card-level phase: what the whole card is currently showing.
type Phase =
  | "idle" // riddle + "Scan QR Code" button
  | "scanning" // camera modal open, looking for a QR code
  | "checking_scan" // camera closed, POST /api/checkpoint/scan in flight
  | "wrong_checkpoint" // scanned QR is a real checkpoint, just not this team's next one
  | "camera_denied" // getUserMedia was refused
  | "scan_rate_limited" // scanned again too soon
  | "scan_error" // any other scan-side failure (event paused/ended/etc)
  | "code" // 6-digit code is shown, waiting for entry
  | "correct" // code verified, checkpoint solved
  | "expired"; // the issued code's 4-minute window ran out

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
  const [phase, setPhase] = useState<Phase>("idle");
  const [scanMessage, setScanMessage] = useState("");

  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [autoContinueArmed, setAutoContinueArmed] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  // Reset local UI state whenever a new checkpoint is unlocked.
  useEffect(() => {
    setPhase("idle");
    setScanMessage("");
    setIssuedCode(null);
    setExpiresAt(null);
    setAutoContinueArmed(false);
  }, [question.questionId]);

  useEffect(() => {
    if (phase !== "correct" || autoContinueArmed) return;
    setAutoContinueArmed(true);
    const reduceMotion = prefersReducedMotion();
    const timer = setTimeout(onSolved, reduceMotion ? 900 : 1800);
    return () => clearTimeout(timer);
  }, [phase, autoContinueArmed, onSolved]);

  function stopScanner() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  useEffect(() => stopScanner, []);

  function tickScanner() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tickScanner);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      rafRef.current = requestAnimationFrame(tickScanner);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const decoded = jsQR(imageData.data, imageData.width, imageData.height);

    if (decoded?.data) {
      stopScanner();
      void handleDecoded(decoded.data);
      return;
    }

    rafRef.current = requestAnimationFrame(tickScanner);
  }

  async function openScanner() {
    setScanMessage("");
    setPhase("scanning");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      rafRef.current = requestAnimationFrame(tickScanner);
    } catch {
      setPhase("camera_denied");
    }
  }

  function closeScanner() {
    stopScanner();
    setPhase("idle");
  }

  async function handleDecoded(raw: string) {
    setPhase("checking_scan");
    const checkpointSecret = extractCheckpointSecret(raw);

    let response: Response;
    try {
      response = await fetch("/api/checkpoint/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ checkpointSecret })
      });
    } catch {
      setScanMessage("Connection lost. Check your network and try again.");
      setPhase("scan_error");
      return;
    }

    const data = await response.json().catch(() => ({}));

    if (response.ok && data.code && data.expiresAt) {
      setIssuedCode(data.code);
      setExpiresAt(data.expiresAt);
      setPhase("code");
      return;
    }

    if (data.code === "WRONG_CHECKPOINT" || data.code === "INVALID_CHECKPOINT") {
      setPhase("wrong_checkpoint");
      return;
    }

    if (response.status === 429 || data.code === "RATE_LIMITED") {
      setPhase("scan_rate_limited");
      return;
    }

    setScanMessage(
      data.code === "EVENT_PAUSED"
        ? "The hunt is temporarily paused."
        : data.code === "EVENT_ENDED"
        ? "The hunt has ended."
        : data.code === "ALREADY_COMPLETED"
        ? "You've already finished the hunt."
        : "Something went wrong reading that code. Try again."
    );
    setPhase("scan_error");
  }

  const isCorrect = phase === "correct";

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

          {isCorrect && (
            <div className="mt-8" role="status" aria-live="polite">
              <p className="text-xl font-black text-gold">CLUE SOLVED</p>
              <p className="mt-2 text-muted">The path opens…</p>
              <div className="mt-5">
                <PrimaryButton type="button" onClick={onSolved}>
                  CONTINUE TO NEXT CLUE
                </PrimaryButton>
              </div>
            </div>
          )}

          {phase === "idle" && (
            <div className="mt-8">
              <p className="mb-4 text-sm text-muted">
                Find this location, then scan the QR code posted there to reveal your checkpoint code.
              </p>
              <PrimaryButton type="button" onClick={openScanner}>
                SCAN QR CODE
              </PrimaryButton>
            </div>
          )}

          {phase === "checking_scan" && (
            <div className="mt-8" role="status" aria-live="polite">
              <p className="font-bold text-muted">Checking checkpoint…</p>
            </div>
          )}

          {phase === "wrong_checkpoint" && (
            <div className="mt-8">
              <p role="alert" className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm font-bold text-gold">
                That&apos;s not your next checkpoint — check the riddle again.
              </p>
              <div className="mt-5">
                <PrimaryButton type="button" onClick={openScanner}>
                  SCAN AGAIN
                </PrimaryButton>
              </div>
            </div>
          )}

          {phase === "scan_rate_limited" && (
            <div className="mt-8">
              <p role="alert" className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm font-bold text-gold">
                Slow down — try again in a moment.
              </p>
              <div className="mt-5">
                <PrimaryButton type="button" onClick={openScanner}>
                  SCAN AGAIN
                </PrimaryButton>
              </div>
            </div>
          )}

          {phase === "scan_error" && (
            <div className="mt-8">
              {scanMessage && (
                <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm font-bold text-red-300">
                  {scanMessage}
                </p>
              )}
              <div className="mt-5">
                <PrimaryButton type="button" onClick={openScanner}>
                  SCAN AGAIN
                </PrimaryButton>
              </div>
            </div>
          )}

          {phase === "camera_denied" && (
            <div className="mt-8">
              <p role="alert" className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm font-bold text-gold">
                Camera access was blocked. Enable camera permission for this site in your browser settings,
                then try scanning again.
              </p>
              <div className="mt-5">
                <PrimaryButton type="button" onClick={openScanner}>
                  TRY AGAIN
                </PrimaryButton>
              </div>
            </div>
          )}

          {phase === "expired" && (
            <div className="mt-8">
              <p role="alert" className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm font-bold text-gold">
                This code expired — scan the QR again.
              </p>
              <div className="mt-5">
                <PrimaryButton type="button" onClick={openScanner}>
                  SCAN QR CODE
                </PrimaryButton>
              </div>
            </div>
          )}

          {phase === "code" && issuedCode && expiresAt && (
            <CheckpointCodeForm
              issuedCode={issuedCode}
              expiresAt={expiresAt}
              onCorrect={() => setPhase("correct")}
              onExpired={() => setPhase("expired")}
              onQuestionLocked={onSolved}
            />
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

      {phase === "scanning" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-5">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-panel">
            <div className="relative aspect-square w-full bg-black">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-gold/70" />
            </div>
            <div className="p-5 text-center">
              <p className="text-sm font-bold text-muted">Point your camera at the checkpoint QR code</p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={closeScanner}
                  className="min-h-12 rounded-full border border-white/10 px-6 text-sm font-bold text-warm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
