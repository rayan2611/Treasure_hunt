"use client";

import { useCallback, useState } from "react";
import type { PublicLeaderboardEntry } from "@/lib/types";
import { SectionTitle, SecondaryButton } from "@/components/ui";
import { usePolling } from "@/lib/use-polling";

export function LeaderboardPreview() {
  const [rows, setRows] = useState<PublicLeaderboardEntry[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/leaderboard", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setRows(data.entries ?? []);
  }, []);

  // Leaderboard polling: every 5-8s while visible, paused when backgrounded (spec 20A).
  usePolling(load, 6000);

  const top = rows.slice(0, 3);

  return (
    <section className="px-5 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionTitle eyebrow="● Live" title="LIVE LEADERBOARD" description="Every clue counts. Every second matters." />

        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((slot) => {
            const item = top[slot];
            return (
              <article
                key={slot}
                className={`rounded-3xl border p-7 text-center ${
                  slot === 0 ? "border-gold/60 bg-gold/5 shadow-glow" : "border-white/10 bg-panel"
                }`}
              >
                <div className="text-sm font-black text-gold">#{slot + 1}</div>
                <div className="mt-4 text-xl font-black">{item?.teamName ?? "—"}</div>
                <div className="mt-2 text-muted">
                  {item ? `${item.questionsCompleted}/${item.totalQuestions}` : "Awaiting teams"}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <SecondaryButton href="/leaderboard">View Full Leaderboard</SecondaryButton>
        </div>
      </div>
    </section>
  );
}
