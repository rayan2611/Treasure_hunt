"use client";

import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { useHuntLaunch, formatCompactCountdown } from "@/lib/use-hunt-launch";

/**
 * Wraps an entry CTA (register / login / "enter the hunt") so it's disabled
 * and shows a live countdown until the event's hunt_start_time, then
 * unlocks itself automatically — no reload, no admin action needed.
 */
export function GatedEntryButton({
  href,
  children,
  variant = "primary"
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const { loaded, locked, remainingMs } = useHuntLaunch();

  if (loaded && locked) {
    return (
      <span
        aria-disabled="true"
        title="Opens at hunt launch"
        className={
          variant === "primary"
            ? "inline-flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-gold/30 px-6 py-3 font-bold text-ink/60"
            : "inline-flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-full border border-peacock/30 px-6 py-3 font-bold text-warm/40"
        }
      >
        {children}
        <span className="text-xs font-black tabular-nums opacity-80">
          · {formatCompactCountdown(remainingMs)}
        </span>
      </span>
    );
  }

  return variant === "primary" ? (
    <PrimaryButton href={href}>{children}</PrimaryButton>
  ) : (
    <SecondaryButton href={href}>{children}</SecondaryButton>
  );
}
