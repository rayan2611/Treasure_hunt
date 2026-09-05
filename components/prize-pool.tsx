"use client";

import { SectionTitle } from "@/components/ui";

const prizes = [
  { place: "1ST", amount: "₹2,100", accent: true },
  { place: "2ND", amount: "₹1,100", accent: false },
  { place: "3RD", amount: "₹500", accent: false }
];

export function PrizePool() {
  return (
    <section className="game-grid border-t border-white/5 px-5 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionTitle eyebrow="Winner takes gold" title="PRIZE POOL" description="Three teams walk away with cash prizes." />

        <div className="grid gap-6 sm:grid-cols-3">
          {prizes.map(({ place, amount, accent }) => (
            <article
              key={place}
              className={`group relative overflow-hidden rounded-3xl border p-8 text-center transition-transform duration-300 hover:-translate-y-2 ${
                accent
                  ? "border-gold/60 bg-gold/5 shadow-glow sm:scale-105"
                  : "border-white/10 bg-panel hover:border-peacock/40"
              }`}
            >
              <div
                className={`text-xs font-black uppercase tracking-[.3em] ${
                  accent ? "text-gold" : "text-peacock"
                }`}
              >
                {place} Place
              </div>
              <div
                className={`mt-4 font-black tabular-nums transition-transform duration-300 group-hover:scale-110 ${
                  accent ? "text-6xl text-gold sm:text-7xl" : "text-5xl text-warm"
                }`}
              >
                {amount}
              </div>
              {accent && (
                <div className="mt-4 inline-block rounded-full border border-gold/40 px-4 py-1 text-[11px] font-black uppercase tracking-[.2em] text-gold">
                  Grand Prize
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
