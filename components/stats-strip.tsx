"use client";

import { useCallback, useState } from "react";
import type { EventStatusPayload } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";

export function StatsStrip() {
  const [event, setEvent] = useState<EventStatusPayload | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/event/status", { cache: "no-store" });
    if (!res.ok) return;
    setEvent(await res.json());
  }, []);

  usePolling(load, 12000);

  const stats: [string, string][] = [
    [String(event?.total_questions ?? 8).padStart(2, "0"), "CLUES"],
    [event ? String(event.team_count) : "—", "TEAMS"],
    ["● LIVE", "LEADERBOARD"],
    ["01", "TREASURE"]
  ];

  return (
    <section className="border-y border-white/5 bg-black px-5 py-12">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 text-center md:grid-cols-4">
        {stats.map(([value, label]) => (
          <div key={label}>
            <div className="text-3xl font-black text-gold">{value}</div>
            <div className="mt-2 text-xs font-bold tracking-[.18em] text-muted">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
