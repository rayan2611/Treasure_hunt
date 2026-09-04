"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PrimaryButton } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [fullBitsId, setFullBitsId] = useState("");
  const [collision, setCollision] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered")) setMessage("Registration complete. Enter your login code.");
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/auth/team-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code,
        fullBitsId: collision ? fullBitsId : undefined
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (data.code === "LOGIN_COLLISION") {
        setCollision(true);
        setMessage("That 4-digit code belongs to more than one team. Enter the full leader BITS ID.");
      } else {
        setMessage(data.message ?? "Could not log in.");
      }
      setLoading(false);
      return;
    }

    router.replace("/hunt");
    router.refresh();
  }

  return (
    <>
      <PublicHeader />
      <main className="hero-bg game-grid flex min-h-[calc(100vh-72px)] items-center justify-center px-5 py-12">
        <form onSubmit={submit} className="glass w-full max-w-md rounded-3xl p-7 sm:p-9">
          <p className="text-sm font-black uppercase tracking-[.22em] text-gold">Resume</p>
          <h1 className="mt-3 text-4xl font-black">WELCOME BACK, HUNTER.</h1>
          <p className="mt-3 text-muted">
            Enter the last 4 digits associated with the team leader's BITS ID.
          </p>

          <label className="mt-7 block">
            <span className="mb-2 block text-sm font-bold text-muted">4-digit login code</span>
            <input
              inputMode="numeric"
              maxLength={4}
              pattern="\d{4}"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="min-h-16 w-full rounded-2xl border border-white/10 bg-ink px-4 text-center text-3xl font-black tracking-[.35em] outline-none focus:border-gold/70"
              placeholder="0000"
            />
          </label>

          {collision && (
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-bold text-muted">Full leader BITS ID</span>
              <input
                value={fullBitsId}
                onChange={(e) => setFullBitsId(e.target.value)}
                required
                className="min-h-14 w-full rounded-2xl border border-white/10 bg-ink px-4 outline-none focus:border-gold/70"
              />
            </label>
          )}

          {message && <p className="mt-4 text-sm font-bold text-warm/80">{message}</p>}

          <div className="mt-6">
            <PrimaryButton type="submit" disabled={loading || code.length !== 4}>
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
