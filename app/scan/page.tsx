"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PrimaryButton } from "@/components/ui";
import { CheckpointCodeForm } from "@/components/checkpoint-code-form";

// Phone-camera fallback: a visitor who scans the physical QR sticker with
// their native camera app (instead of the in-app scanner) lands here via the
// URL encoded in the QR. If they have a valid team session, this calls the
// same scan endpoint the in-app scanner uses and drops them straight into
// code entry; otherwise it sends them to log in first and back here after.
export default function ScanPage() {
  const router = useRouter();

  const [phase, setPhase] = useState<"loading" | "code" | "wrong_checkpoint" | "error">("loading");
  const [message, setMessage] = useState("");
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const secret = new URLSearchParams(window.location.search).get("c");

    if (!secret) {
      setPhase("error");
      setMessage("This link is missing a checkpoint code.");
      return;
    }

    (async () => {
      let response: Response;
      try {
        response = await fetch("/api/checkpoint/scan", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ checkpointSecret: secret })
        });
      } catch {
        setPhase("error");
        setMessage("Connection lost. Check your network and try again.");
        return;
      }

      if (response.status === 401) {
        const next = `/scan?c=${encodeURIComponent(secret)}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
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

      setPhase("error");
      setMessage(
        data.code === "EVENT_PAUSED"
          ? "The hunt is temporarily paused."
          : data.code === "EVENT_ENDED"
          ? "The hunt has ended."
          : data.code === "RATE_LIMITED"
          ? "Slow down — try again in a moment."
          : data.code === "ALREADY_COMPLETED"
          ? "You've already finished the hunt."
          : "Something went wrong reading that code. Try scanning again."
      );
    })();
  }, [router]);

  return (
    <>
      <PublicHeader />
      <main className="hero-bg game-grid flex min-h-[calc(100vh-72px)] items-center justify-center px-5 py-12">
        <div className="glass w-full max-w-md rounded-3xl p-7 sm:p-9">
          <p className="text-sm font-black uppercase tracking-[.22em] text-gold">Checkpoint</p>

          {phase === "loading" && <p className="mt-4 text-muted">Checking checkpoint…</p>}

          {phase === "wrong_checkpoint" && (
            <>
              <p role="alert" className="mt-4 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm font-bold text-gold">
                That&apos;s not your next checkpoint — check the riddle again.
              </p>
              <div className="mt-6">
                <PrimaryButton href="/hunt">BACK TO HUNT</PrimaryButton>
              </div>
            </>
          )}

          {phase === "error" && (
            <>
              <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm font-bold text-red-300">
                {message}
              </p>
              <div className="mt-6">
                <PrimaryButton href="/hunt">BACK TO HUNT</PrimaryButton>
              </div>
            </>
          )}

          {phase === "code" && issuedCode && expiresAt && (
            <CheckpointCodeForm
              issuedCode={issuedCode}
              expiresAt={expiresAt}
              onCorrect={() => router.replace("/hunt")}
              onExpired={() => {
                setPhase("error");
                setMessage("This code expired — scan the QR again.");
              }}
            />
          )}

          <p className="mt-6 text-sm text-muted">
            <Link href="/hunt" className="font-bold text-gold">Back to the hunt</Link>
          </p>
        </div>
      </main>
    </>
  );
}
