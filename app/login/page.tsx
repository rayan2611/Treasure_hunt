"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PrimaryButton } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"success" | "warn" | "error">("error");
  const [loading, setLoading] = useState(false);

  // Already logged in? Skip straight to the hunt — only /logout should ever
  // send someone back to this screen.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/team", { cache: "no-store" });
        if (!cancelled && res?.ok) {
          const next = new URLSearchParams(window.location.search).get("next");
          router.replace(next && next.startsWith("/") ? next : "/hunt");
          return;
        }
      } catch {
        // fall through to showing the form
      }
      if (!cancelled) setCheckingSession(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered")) {
      setMessage("Registration complete. Enter your details to resume.");
      setTone("success");
    }
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/auth/team-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier, pin })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (data.code === "LOGIN_COLLISION") {
        setTone("warn");
        setMessage("That matched more than one team — enter your full BITS ID instead.");
      } else {
        setTone("error");
        setMessage(data.message ?? "Could not log in.");
      }
      setLoading(false);
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(next && next.startsWith("/") ? next : "/hunt");
    router.refresh();
  }

  if (checkingSession) {
    return (
      <>
        <PublicHeader />
        <main className="flex min-h-[calc(100vh-72px)] items-center justify-center text-muted">
          Loading…
        </main>
      </>
    );
  }

  return (
    <>
      <PublicHeader />
      <main className="hero-bg game-grid flex min-h-[calc(100vh-72px)] items-center justify-center px-5 py-12">
        <form onSubmit={submit} className="glass w-full max-w-md rounded-3xl p-7 sm:p-9">
          <p className="text-sm font-black uppercase tracking-[.22em] text-gold">Resume</p>
          <h1 className="mt-3 text-4xl font-black">WELCOME BACK, HUNTER.</h1>
          <p className="mt-3 text-muted">
            Enter your team name, mobile number or BITS ID, plus your 4-digit PIN.
          </p>

          <label className="mt-7 block">
            <span className="mb-2 block text-sm font-bold text-muted">Team name / mobile / BITS ID</span>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="min-h-14 w-full rounded-2xl border border-white/10 bg-ink px-4 outline-none focus:border-gold/70"
              placeholder="e.g. Nighthawks"
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-bold text-muted">4-digit PIN</span>
            <input
              inputMode="numeric"
              maxLength={4}
              pattern="\d{4}"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="min-h-16 w-full rounded-2xl border border-white/10 bg-ink px-4 text-center text-3xl font-black tracking-[.35em] outline-none focus:border-gold/70"
              placeholder="0000"
            />
          </label>

          {message && (
            <p
              role="alert"
              className={`mt-4 rounded-xl border px-4 py-3 text-sm font-bold ${
                tone === "success"
                  ? "border-teal/30 bg-teal/5 text-teal"
                  : tone === "warn"
                  ? "border-gold/30 bg-gold/5 text-gold"
                  : "border-red-400/30 bg-red-400/5 text-red-300"
              }`}
            >
              {message}
            </p>
          )}

          <div className="mt-6">
            <PrimaryButton type="submit" disabled={loading || !identifier.trim() || pin.length !== 4}>
              {loading ? "Entering…" : "Resume Hunt"}
            </PrimaryButton>
          </div>

          <p className="mt-6 text-sm text-muted">
            Haven't registered? <Link href="/register" className="font-bold text-gold">Register your team</Link>
          </p>
        </form>
      </main>
    </>
  );
}
