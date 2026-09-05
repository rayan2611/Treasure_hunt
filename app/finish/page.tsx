"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { TeamSafeState } from "@/lib/types";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return reduced;
}

const GOLD_HEX = "#FFC43D";

export default function FinishPage() {
  const [team, setTeam] = useState<TeamSafeState | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    fetch("/api/team", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setTeam);
  }, []);

  const particles = useMemo(
    () =>
      Array.from({ length: reducedMotion ? 0 : 24 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2.5,
        duration: 3 + Math.random() * 2.5,
        size: 4 + Math.random() * 5
      })),
    [reducedMotion]
  );

  return (
    <main className="hero-bg game-grid relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 text-center">
      {!reducedMotion &&
        particles.map((p) => (
          <span
            key={p.id}
            aria-hidden
            className="animate-confetti absolute top-0 rounded-full"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              background: GOLD_HEX,
              opacity: 0.7,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`
            }}
          />
        ))}

      <div className="relative max-w-2xl">
        <p className="text-sm font-black uppercase tracking-[.24em] text-gold">Hunt complete</p>
        <h1 className="mt-4 text-6xl font-black leading-none">
          THE TREASURE<br /><span className="text-gold">IS YOURS.</span>
        </h1>

        {team && (
          <p className="mt-6 text-2xl font-black text-warm">{team.teamName}</p>
        )}

        <p className="mx-auto mt-3 max-w-lg text-muted">
          {team
            ? `${team.questionsCompleted} / ${team.totalQuestions} clues solved.`
            : "You followed every trail."}
        </p>

        <p className="mx-auto mt-6 max-w-lg text-warm/90">
          You followed every trail. Now report to the final location / organizers.
        </p>

        <p className="mt-6 inline-flex flex-wrap justify-center gap-x-3 gap-y-1 rounded-full border border-gold/40 px-5 py-2 text-sm font-black uppercase tracking-[.14em] text-gold">
          <span>1st ₹2,100</span>
          <span className="text-muted">·</span>
          <span>2nd ₹1,100</span>
          <span className="text-muted">·</span>
          <span>3rd ₹500</span>
        </p>

        <div>
          <Link href="/leaderboard" className="mt-8 inline-block rounded-full bg-gold px-6 py-3 font-black text-ink shadow-glow">
            View Leaderboard
          </Link>
        </div>
      </div>
    </main>
  );
}
