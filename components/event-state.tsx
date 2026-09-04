import Link from "next/link";

export function EventState({ status }: { status: string }) {
  const copy: Record<string, { title: string; body: string }> = {
    DRAFT: { title: "THE HUNT IS BEING PREPARED.", body: "Check back when registration opens." },
    REGISTRATION: { title: "THE HUNT HASN'T STARTED YET.", body: "Your team is registered. Stay ready." },
    PAUSED: { title: "THE HUNT IS TEMPORARILY PAUSED.", body: "Your progress is safe. Wait for the organizers." },
    ENDED: { title: "THE HUNT HAS ENDED.", body: "See the final leaderboard." }
  };

  const item = copy[status] ?? copy.DRAFT;

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-panel p-8 text-center">
      <h1 className="text-3xl font-black">{item.title}</h1>
      <p className="mt-3 text-muted">{item.body}</p>
      {status === "ENDED" && (
        <Link href="/leaderboard" className="mt-6 inline-block font-bold text-gold">
          View Leaderboard →
        </Link>
      )}
    </div>
  );
}
