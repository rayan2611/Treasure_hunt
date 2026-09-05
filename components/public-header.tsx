"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { GatedEntryButton } from "@/components/gated-entry-button";

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-black tracking-tight">
          <span className="text-gold">JANMASHTAMI</span> HUNT
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold md:flex">
          <Link href="/#how">How to Play</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/rules">Rules</Link>
          <GatedEntryButton href="/register">Enter the Hunt</GatedEntryButton>
        </nav>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/5 bg-ink px-5 py-5 md:hidden">
          <div className="flex flex-col gap-4">
            <Link href="/#how" onClick={() => setOpen(false)}>How to Play</Link>
            <Link href="/leaderboard" onClick={() => setOpen(false)}>Leaderboard</Link>
            <Link href="/rules" onClick={() => setOpen(false)}>Rules</Link>
            <GatedEntryButton href="/register">Enter the Hunt</GatedEntryButton>
          </div>
        </nav>
      )}
    </header>
  );
}
