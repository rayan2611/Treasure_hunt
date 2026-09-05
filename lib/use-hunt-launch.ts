"use client";

import { useEffect, useState } from "react";

/**
 * Gates entry (register/login/enter-the-hunt) behind the event's
 * hunt_start_time. Locked until that moment, then unlocks itself
 * automatically — no page reload, no admin action needed at the exact
 * instant. Ticks every second against a target fetched once from the
 * server so the countdown is accurate but doesn't require re-polling.
 */
export function useHuntLaunch() {
  const [huntStartTime, setHuntStartTime] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/event/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        setHuntStartTime(data?.hunt_start_time ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const targetMs = huntStartTime ? new Date(huntStartTime).getTime() : null;
  const remainingMs = targetMs !== null ? Math.max(0, targetMs - now) : 0;
  const locked = loaded && targetMs !== null && !Number.isNaN(targetMs) && now < targetMs;

  return { loaded, locked, huntStartTime, remainingMs };
}

export function formatCompactCountdown(ms: number) {
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return `${days}d ${hours}h ${minutes}m`;
}
