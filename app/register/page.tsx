"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PrimaryButton } from "@/components/ui";

type Member = { name: string; bitsId: string };

export default function RegisterPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([
    { name: "", bitsId: "" },
    { name: "", bitsId: "" },
    { name: "", bitsId: "" }
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateMember(index: number, key: keyof Member, value: string) {
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, [key]: value } : m)));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const body = {
      teamName: String(form.get("teamName") ?? ""),
      leaderName: String(form.get("leaderName") ?? ""),
      leaderBITSID: String(form.get("leaderBITSID") ?? ""),
      contactNumber: String(form.get("contactNumber") ?? ""),
      members: members.filter((m) => m.name.trim() || m.bitsId.trim())
    };

    const res = await fetch("/api/teams/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.message ?? "Registration failed.");
      setLoading(false);
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <>
      <PublicHeader />
      <main className="min-h-screen">
        <div className="grid min-h-[calc(100vh-72px)] lg:grid-cols-2">
          <section className="hero-bg game-grid hidden min-h-full items-end p-12 lg:flex">
            <div>
              <p className="text-sm font-black uppercase tracking-[.22em] text-gold">BITS • 2026</p>
              <h1 className="mt-3 text-5xl font-black">ASSEMBLE<br />YOUR CREW.</h1>
              <p className="mt-4 max-w-md text-muted">
                Replace this panel later with a dark BITS campus photo, abstract map lines and a subtle glowing route.
              </p>
            </div>
          </section>

          <section className="flex items-center px-5 py-12 sm:px-10">
            <div className="mx-auto w-full max-w-xl">
              <p className="text-sm font-black uppercase tracking-[.22em] text-gold">Registration</p>
              <h2 className="mt-3 text-4xl font-black">ASSEMBLE YOUR CREW</h2>
              <p className="mt-3 text-muted">Register once before entering the hunt.</p>

              <form className="mt-8 space-y-4" onSubmit={submit}>
                {[
                  ["teamName", "Team Name"],
                  ["leaderName", "Leader Name"],
                  ["leaderBITSID", "Leader BITS ID"],
                  ["contactNumber", "Contact Number"]
                ].map(([name, label]) => (
                  <label key={name} className="block">
                    <span className="mb-2 block text-sm font-bold text-muted">{label}</span>
                    <input
                      name={name}
                      required
                      className="min-h-14 w-full rounded-2xl border border-white/10 bg-panel px-4 outline-none focus:border-gold/60"
                    />
                  </label>
                ))}

                <div className="pt-2">
                  <div className="mb-3 text-sm font-black uppercase tracking-[.16em] text-gold">Additional Members</div>
                  <div className="space-y-4">
                    {members.map((member, index) => (
                      <div key={index} className="grid gap-3 sm:grid-cols-2">
                        <input
                          value={member.name}
                          onChange={(e) => updateMember(index, "name", e.target.value)}
                          placeholder={`Member ${index + 2} name`}
                          className="min-h-14 rounded-2xl border border-white/10 bg-panel px-4 outline-none focus:border-gold/60"
                        />
                        <input
                          value={member.bitsId}
                          onChange={(e) => updateMember(index, "bitsId", e.target.value)}
                          placeholder={`Member ${index + 2} BITS ID`}
                          className="min-h-14 rounded-2xl border border-white/10 bg-panel px-4 outline-none focus:border-gold/60"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {error && <p className="text-sm font-bold text-red-300">{error}</p>}

                <PrimaryButton type="submit" disabled={loading}>
                  {loading ? "Registering…" : "Register Team"}
                </PrimaryButton>
              </form>

              <p className="mt-6 text-sm text-muted">
                Already registered? <Link href="/login" className="font-bold text-gold">Resume Hunt →</Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
