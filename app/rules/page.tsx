import { PublicHeader } from "@/components/public-header";
import { SectionTitle } from "@/components/ui";

const howToPlay = [
  "Register on the treasure hunt website with your team.",
  "Fill in the required details, and remember your PIN — you may need it later to resume the hunt if you lose connection.",
  "Each checkpoint has a unique QR code placed at a physical location. Scanning it lets the server verify the checkpoint.",
  "After a valid scan, the server generates a random, team-specific, one-time verification code. Enter it on the website to unlock the next clue.",
  "The team that solves the maximum number of clues wins."
];

const rules = [
  ["01", "ONE TEAM, ONE REGISTRATION"],
  ["02", "NO SKIPPING CLUES"],
  ["03", "DO NOT SHARE ANSWERS"],
  ["04", "RESPECT CAMPUS AREAS"],
  ["05", "PLAY SAFE"],
  ["06", "ORGANISER'S DECISION IS FINAL"]
];

const prizes = [
  ["1ST", "₹2,100"],
  ["2ND", "₹1,100"],
  ["3RD", "₹500"]
];

export default function RulesPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto min-h-screen max-w-6xl px-5 py-20">
        <SectionTitle title="RULES" description="Keep the hunt fair, safe and fun." />
        <p className="mx-auto -mt-6 mb-10 max-w-2xl text-center font-bold text-gold">
          Teams must have 2-5 members.
        </p>

        <div className="mb-16">
          <p className="mb-5 text-center text-xs font-black uppercase tracking-[.22em] text-peacock">
            Prize Pool
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {prizes.map(([place, amount]) => (
              <article
                key={place}
                className={`rounded-3xl border p-6 text-center ${
                  place === "1ST" ? "border-gold/60 bg-gold/5 shadow-glow" : "border-white/8 bg-panel"
                }`}
              >
                <div className="text-xs font-black tracking-[.2em] text-muted">{place} PLACE</div>
                <div className="mt-2 text-3xl font-black text-gold">{amount}</div>
              </article>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <p className="mb-5 text-center text-xs font-black uppercase tracking-[.22em] text-peacock">
            How to Play
          </p>
          <ol className="mx-auto max-w-3xl space-y-3">
            {howToPlay.map((step, i) => (
              <li key={i} className="flex gap-4 rounded-2xl border border-white/8 bg-panel p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 text-sm font-black text-gold">
                  {i + 1}
                </span>
                <span className="leading-7 text-warm/90">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rules.map(([n, label]) => (
            <article key={n} className="rounded-3xl border border-white/8 bg-panel p-6">
              <div className="text-sm font-black text-gold">{n}</div>
              <div className="mt-3 text-lg font-black">{label}</div>
            </article>
          ))}
        </div>

        <div className="mx-auto max-w-3xl rounded-3xl border border-peacock/30 bg-peacock/5 p-7">
          <p className="mb-3 text-xs font-black uppercase tracking-[.22em] text-peacock">Remember</p>
          <ul className="space-y-3 text-sm leading-7 text-warm/90">
            <li>
              Each code is tied to the team, checkpoint, and scan session, with a short expiry. Once used, it
              becomes permanently invalid — a shared or reused code will be rejected.
            </li>
            <li>
              Teams starting late get less time overall. The hunt ends at the time specified on the website,
              regardless of when a team began.
            </li>
          </ul>
        </div>

        <p className="mt-16 text-center text-sm text-muted">
          Organized by SANGAM — Uttar Pradesh Community, BITS Pilani
        </p>
      </main>
    </>
  );
}
