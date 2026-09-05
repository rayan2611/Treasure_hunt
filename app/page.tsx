import { PublicHeader } from "@/components/public-header";
import { Hero } from "@/components/hero";
import { PrizePool } from "@/components/prize-pool";
import { HowToPlay } from "@/components/how-to-play";
import { StatsStrip } from "@/components/stats-strip";
import { LeaderboardPreview } from "@/components/leaderboard-preview";
import { PrimaryButton } from "@/components/ui";

export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <main>
        <Hero />
        <PrizePool />
        <HowToPlay />
        <StatsStrip />
        <LeaderboardPreview />

        <section className="game-grid border-t border-white/5 px-5 py-24 text-center">
          <h2 className="text-4xl font-black sm:text-5xl">THINK YOU CAN FIND IT?</h2>
          <p className="mx-auto mt-4 max-w-lg text-muted">The trail is waiting.</p>
          <div className="mt-7">
            <PrimaryButton href="/register">Enter the Hunt</PrimaryButton>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 px-5 py-8 text-center text-sm text-muted">
        Janmashtami Treasure Hunt • BITS • 2026
      </footer>
    </>
  );
}
