import { PrimaryButton, SecondaryButton } from "@/components/ui";

export function Hero() {
  return (
    <section className="hero-bg game-grid relative min-h-[88vh] overflow-hidden">
      <div className="mx-auto flex min-h-[88vh] max-w-7xl items-center px-5 py-20">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-black uppercase tracking-[.28em] text-gold">
            Janmashtami 2026 • BITS
          </p>

          <h1 className="text-6xl font-black leading-[.88] tracking-tight sm:text-7xl lg:text-8xl">
            THE HUNT
            <br />
            <span className="text-gold">BEGINS.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-muted">
            Decode the clues. Race across campus. Find the treasure before everyone else.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryButton href="/register">Register Team</PrimaryButton>
            <SecondaryButton href="/login">Resume Hunt</SecondaryButton>
          </div>

          <a href="/leaderboard" className="mt-6 inline-block text-sm font-bold text-warm/80 hover:text-gold">
            View Live Leaderboard →
          </a>

          <div className="mt-16 grid max-w-2xl grid-cols-3 gap-5 border-t border-white/10 pt-6">
            {[
              ["08", "Clues"],
              ["01", "Treasure"],
              ["ONE", "Winner"]
            ].map(([value, label]) => (
              <div key={label}>
                <div className="text-2xl font-black text-gold">{value}</div>
                <div className="mt-1 text-xs uppercase tracking-[.16em] text-muted">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
