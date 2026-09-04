"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function HuntHeader({
  teamName,
  currentQuestion,
  totalQuestions
}: {
  teamName: string;
  currentQuestion: number;
  totalQuestions: number;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-white/8 bg-ink/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/hunt" className="font-black">
          <span className="text-gold">HUNT</span>
        </Link>

        <div className="min-w-0 text-right">
          <div className="truncate text-sm font-bold">{teamName}</div>
          <div className="text-xs text-muted">CLUE {currentQuestion} / {totalQuestions}</div>
        </div>

        <nav className="flex items-center gap-4 text-xs font-bold text-muted">
          <Link href="/leaderboard" className="hover:text-warm">
            Leaderboard
          </Link>
          <Link href="/rules" className="hover:text-warm">
            Rules
          </Link>
          <button onClick={logout} className="hover:text-warm">
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
