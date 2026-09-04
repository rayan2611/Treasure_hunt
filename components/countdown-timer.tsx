"use client";

import { useEffect, useState } from "react";

function splitRemaining(ms: number) {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.floor(clamped / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60
  };
}

/** Counts down to `target`. Ticks every second; renders a static "hunt is live" note once it hits zero. */
export function CountdownTimer({ target }: { target: string | Date }) {
  const targetMs = new Date(target).getTime();
  const [remaining, setRemaining] = useState(() => targetMs - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(targetMs - Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (Number.isNaN(targetMs)) return null;

  const { days, hours, minutes, seconds } = splitRemaining(remaining);
  const units = [
    { label: "Days", value: days },
    { label: "Hrs", value: hours },
    { label: "Min", value: minutes },
    { label: "Sec", value: seconds }
  ];

  return (
    <div className="flex justify-center gap-3 sm:gap-5" role="timer" aria-live="polite">
      {units.map((u) => (
        <div key={u.label} className="min-w-16 rounded-2xl border border-white/10 bg-ink/60 px-3 py-3 text-center">
          <div className="text-3xl font-black tabular-nums text-gold sm:text-4xl">
            {String(u.value).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[11px] font-bold uppercase tracking-[.16em] text-muted">{u.label}</div>
        </div>
      ))}
    </div>
  );
}
