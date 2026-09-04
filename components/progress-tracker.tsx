import { Check, Lock } from "lucide-react";

export function ProgressTracker({
  completed,
  total,
  current
}: {
  completed: number;
  total: number;
  current?: number;
}) {
  const percent = Math.min(100, Math.max(0, (completed / total) * 100));
  const currentIndex = current ?? Math.min(total, completed + 1);

  return (
    <div className="mb-7">
      {/* Desktop: dot/line sequence — completed (gold check), current (glowing), locked (grey lock). */}
      <div className="mb-2 hidden items-center sm:flex" aria-hidden={false} aria-label={`Clue ${currentIndex} of ${total}`}>
        {Array.from({ length: total }, (_, i) => i + 1).map((n, i) => {
          const state = n <= completed ? "done" : n === currentIndex ? "current" : "locked";
          return (
            <div key={n} className="flex flex-1 items-center last:flex-initial">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black transition ${
                  state === "done"
                    ? "border-gold bg-gold text-ink"
                    : state === "current"
                    ? "border-gold text-gold shadow-glow"
                    : "border-white/15 text-muted"
                }`}
                title={`Clue ${n}`}
              >
                {state === "done" ? <Check size={16} /> : state === "locked" ? <Lock size={13} /> : n}
              </div>
              {i < total - 1 && (
                <div className={`h-[2px] flex-1 ${n <= completed ? "bg-gold" : "bg-white/10"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="mb-2 flex justify-between text-xs font-bold tracking-[.12em] text-muted">
        <span className="sm:hidden">CLUE {currentIndex} OF {total}</span>
        <span className="hidden sm:inline">PROGRESS</span>
        <span>{completed}/{total}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <div
          data-testid="progress-fill"
          className="h-full rounded-full bg-gold transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
