import { PublicHeader } from "@/components/public-header";
import { SectionTitle } from "@/components/ui";

const rules = [
  ["01", "ONE TEAM, ONE REGISTRATION"],
  ["02", "NO SKIPPING CLUES"],
  ["03", "DO NOT SHARE ANSWERS"],
  ["04", "RESPECT CAMPUS AREAS"],
  ["05", "PLAY SAFE"],
  ["06", "ORGANIZERS' DECISION IS FINAL"]
];

export default function RulesPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto min-h-screen max-w-6xl px-5 py-20">
        <SectionTitle title="RULES" description="Keep the hunt fair, safe and fun." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rules.map(([n, label]) => (
            <article key={n} className="rounded-3xl border border-white/8 bg-panel p-6">
              <div className="text-sm font-black text-gold">{n}</div>
              <div className="mt-3 text-lg font-black">{label}</div>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
