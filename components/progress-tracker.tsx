export function ProgressTracker({
  completed,
  total
}: {
  completed: number;
  total: number;
}) {
  const percent = Math.min(100, Math.max(0, (completed / total) * 100));

  return (
    <div className="mb-7">
      <div className="mb-2 flex justify-between text-xs font-bold tracking-[.12em] text-muted">
        <span>PROGRESS</span>
        <span>{completed}/{total}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
