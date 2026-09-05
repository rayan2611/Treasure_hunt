import { Flag, KeyRound, LockOpen } from "lucide-react";
import { SectionTitle } from "@/components/ui";

const steps = [
  {
    icon: Flag,
    title: "FORM YOUR TEAM",
    body: "Register a team of 2-5 once, using your team leader's BITS ID."
  },
  {
    icon: KeyRound,
    title: "FIND & SCAN",
    body: "Each riddle points you to a physical checkpoint — scan the QR code you find there."
  },
  {
    icon: LockOpen,
    title: "UNLOCK THE NEXT",
    body: "Enter the one-time code the scan gives you to open the next stage automatically."
  }
];

export function HowToPlay() {
  return (
    <section id="how" className="px-5 py-24">
      <div className="mx-auto max-w-7xl">
        <SectionTitle
          eyebrow="The rules are simple"
          title="HOW TO PLAY"
          description="Register → Scan → Unlock → Race → Treasure"
        />
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }, index) => (
            <article key={title} className="rounded-3xl border border-white/8 bg-panel p-7">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 text-gold">
                <Icon />
              </div>
              <p className="text-xs font-black tracking-[.18em] text-peacock">0{index + 1}</p>
              <h3 className="mt-2 text-xl font-black">{title}</h3>
              <p className="mt-3 leading-7 text-muted">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
