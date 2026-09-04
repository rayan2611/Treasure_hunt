export function StatsStrip() {
  const stats = [
    ["08", "CLUES"],
    ["XX", "TEAMS"],
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
