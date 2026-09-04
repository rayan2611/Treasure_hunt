import Link from "next/link";
import { CountdownTimer } from "@/components/countdown-timer";

export function EventState({ status, huntStartTime }: { status: string; huntStartTime?: string | null }) {
  const copy: Record<string, { title: string; body: string }> = {
    DRAFT: { title: "THE HUNT HASN'T STARTED YET.", body: "Check back soon — organizers are finalizing the trail." },
    REGISTRATION: { title: "THE HUNT HASN'T STARTED YET.", body: "Your team is registered. Stay ready." },
    PAUSED: { title: "THE HUNT IS TEMPORARILY PAUSED.", body: "Your progress is safe. Wait for the organizers." },
    ENDED: { title: "THE HUNT HAS ENDED.", body: "See the final leaderboard." }
  };

  const item = copy[status] ?? copy.DRAFT;
  const showCountdown = (status === "DRAFT" || status === "REGISTRATION") && huntStartTime;

  return (
    <div
      data-testid="event-state-banner"
      data-status={status}
      className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-panel p-8 text-center"
    >
      {status === "PAUSED" && (
        <div className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-gold/60" aria-hidden />
      )}
      <h1 className="text-3xl font-black">{item.title}</h1>
      <p className="mt-3 text-muted">{item.body}</p>

      {showCountdown && (
        <div className="mt-6">
          <CountdownTimer target={huntStartTime as string} />
        </div>
      )}

      {status === "ENDED" && (
        <Link href="/leaderboard" className="mt-6 inline-block font-bold text-gold">
          View Leaderboard →
        </Link>
      )}
    </div>
  );
}
