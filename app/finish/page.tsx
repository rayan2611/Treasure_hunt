"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TeamSafeState } from "@/lib/types";

export default function FinishPage() {
  const [team, setTeam] = useState<TeamSafeState | null>(null);

  useEffect(() => {
    fetch("/api/team", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setTeam);
  }, []);

  return (
    <main className="hero-bg game-grid flex min-h-screen items-center justify-center px-5 py-12 text-center">
      <div className="max-w-2xl">
        <p className="text-sm font-black uppercase tracking-[.24em] text-gold">Hunt complete</p>
        <h1 className="mt-4 text-6xl font-black leading-none">THE TREASURE<br /><span className="text-gold">IS YOURS.</span></h1>
        <p className="mx-auto mt-6 max-w-lg text-muted">
          {team ? `${team.teamName} solved ${team.questionsCompleted}/${team.totalQuestions} clues.` : "You followed every trail."}
        </p>
        <Link href="/leaderboard" className="mt-8 inline-block rounded-full bg-gold px-6 py-3 font-black text-ink shadow-glow">
          View Leaderboard
        </Link>
      </div>
    </main>
  );
}
