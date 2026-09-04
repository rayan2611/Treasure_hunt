"use client";

import { useCallback, useState } from "react";
import { PublicHeader } from "@/components/public-header";
import { SectionTitle } from "@/components/ui";
import type { PublicLeaderboardEntry } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<PublicLeaderboardEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/leaderboard", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setEntries(data.entries ?? []);
    setLoaded(true);
  }, []);

  // Full leaderboard polling: every 5-8s while visible, paused when backgrounded (spec 20A).
  usePolling(load, 6000);

  return (
    <>
      <PublicHeader />
      <main className="mx-auto min-h-screen max-w-5xl px-5 py-20">
        <SectionTitle eyebrow="● Live" title="LIVE LEADERBOARD" description="Every clue counts. Every second matters." />

        <div className="space-y-3">
          {loaded && entries.length === 0 && (
            <div className="rounded-3xl border border-white/8 bg-panel p-10 text-center">
              <p className="text-2xl font-black">THE TRAIL IS EMPTY.</p>
              <p className="mt-2 text-muted">No team has cracked a clue yet — check back once the hunt begins.</p>
            </div>
          )}

          {entries.map((entry) => (
            <div
              key={`${entry.rank}-${entry.teamName}`}
              className={`grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-2xl border p-4 ${
                entry.rank === 1 ? "border-gold/50 bg-gold/5" : "border-white/8 bg-panel"
              }`}
            >
              <div className="font-black text-gold">#{entry.rank}</div>
              <div className="truncate font-bold">{entry.teamName}</div>
              <div className="text-sm font-black text-muted">
                {entry.questionsCompleted}/{entry.totalQuestions}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
