"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PrimaryButton } from "@/components/ui";
import { isValidBitsId, isValidTeamSize, isValidPin } from "@/lib/validation";

type Member = { name: string; bitsId: string };

export default function RegisterPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [leaderBitsId, setLeaderBitsId] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  // Leader + 1 required member to start; up to 3 more optional (team size 2-5 total).
  const [members, setMembers] = useState<Member[]>([{ name: "", bitsId: "" }]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already resumed the hunt? Don't make them register again — only /logout
  // should ever land someone back on register/login.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/team", { cache: "no-store" });
        if (!cancelled && res?.ok) {
          router.replace("/hunt");
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

  function updateMember(index: number, key: keyof Member, value: string) {
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, [key]: value } : m)));
  }

  function addMember() {
    setMembers((prev) => (prev.length < 4 ? [...prev, { name: "", bitsId: "" }] : prev));
  }

  function removeMember(index: number) {
    setMembers((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (teamName.trim().length < 2) errs.teamName = "Enter a team name.";
    if (leaderName.trim().length < 2) errs.leaderName = "Enter the leader's name.";
    if (!isValidBitsId(leaderBitsId)) {
      errs.leaderBITSID = "Enter the leader's BITS ID.";
    }
    if (contactNumber.trim().length < 6) errs.contactNumber = "Enter a valid contact number.";
    if (!isValidPin(pin)) errs.pin = "PIN must be exactly 4 digits.";
    else if (pin !== confirmPin) errs.confirmPin = "PINs don't match.";

    const filledMembers = members.filter((m) => m.name.trim() || m.bitsId.trim());
    if (!isValidTeamSize(filledMembers.length)) {
      errs.members = "Teams need 2-5 members total (leader + 1-4 more).";
    }
    members.forEach((m, i) => {
      if (m.name.trim() && !m.bitsId.trim()) errs[`member-${i}`] = "Add this member's BITS ID.";
    });

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    setLoading(true);

    const body = {
      teamName,
      leaderName,
      leaderBITSID: leaderBitsId,
      contactNumber,
      pin,
      members: members
        .filter((m) => m.name.trim() && m.bitsId.trim())
        .map((m) => ({ name: m.name.trim(), bitsId: m.bitsId.trim() }))
    };

    const res = await fetch("/api/teams/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (data.code === "DUPLICATE_REGISTRATION") {
        setError("This leader's BITS ID is already registered. Resume with your existing team instead.");
      } else if (data.code === "INVALID_BITS_ID") {
        setError(data.message ?? "Enter the leader's BITS ID.");
      } else if (data.code === "INVALID_PIN") {
        setError("PIN must be exactly 4 digits.");
      } else if (data.code === "REGISTRATION_CLOSED") {
        setError("Registration is currently closed.");
      } else {
        setError(data.message ?? "Registration failed. Please try again.");
      }
      setLoading(false);
      return;
    }

    // Registration already creates the session server-side — go straight
    // into the hunt instead of asking them to log in a second time.
    router.push("/hunt");
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
              <p className="mt-3 text-muted">Register your team of 2-5 before entering the hunt.</p>

              <form className="mt-8 space-y-4" onSubmit={submit} noValidate>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-muted">Team Name</span>
                  <input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    aria-invalid={!!fieldErrors.teamName}
                    className="min-h-14 w-full rounded-2xl border border-white/10 bg-panel px-4 outline-none focus:border-gold/60"
                  />
                  {fieldErrors.teamName && <p className="mt-1 text-xs font-bold text-red-300">{fieldErrors.teamName}</p>}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-muted">Leader Name</span>
                  <input
                    value={leaderName}
                    onChange={(e) => setLeaderName(e.target.value)}
                    required
                    aria-invalid={!!fieldErrors.leaderName}
                    className="min-h-14 w-full rounded-2xl border border-white/10 bg-panel px-4 outline-none focus:border-gold/60"
                  />
                  {fieldErrors.leaderName && <p className="mt-1 text-xs font-bold text-red-300">{fieldErrors.leaderName}</p>}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-muted">Leader BITS ID</span>
                  <input
                    value={leaderBitsId}
                    onChange={(e) => setLeaderBitsId(e.target.value)}
                    required
                    aria-invalid={!!fieldErrors.leaderBITSID}
                    placeholder="Enter it however you like"
                    className="min-h-14 w-full rounded-2xl border border-white/10 bg-panel px-4 outline-none focus:border-gold/60"
                  />
                  {fieldErrors.leaderBITSID && <p className="mt-1 text-xs font-bold text-red-300">{fieldErrors.leaderBITSID}</p>}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-muted">Contact Number</span>
                  <input
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    required
                    type="tel"
                    inputMode="tel"
                    aria-invalid={!!fieldErrors.contactNumber}
                    className="min-h-14 w-full rounded-2xl border border-white/10 bg-panel px-4 outline-none focus:border-gold/60"
                  />
                  {fieldErrors.contactNumber && <p className="mt-1 text-xs font-bold text-red-300">{fieldErrors.contactNumber}</p>}
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-muted">Create a 4-digit PIN</span>
                    <input
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      required
                      inputMode="numeric"
                      maxLength={4}
                      aria-invalid={!!fieldErrors.pin}
                      className="min-h-14 w-full rounded-2xl border border-white/10 bg-panel px-4 text-center text-2xl font-black tracking-[.3em] outline-none focus:border-gold/60"
                      placeholder="0000"
                    />
                    {fieldErrors.pin && <p className="mt-1 text-xs font-bold text-red-300">{fieldErrors.pin}</p>}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-muted">Confirm PIN</span>
                    <input
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      required
                      inputMode="numeric"
                      maxLength={4}
                      aria-invalid={!!fieldErrors.confirmPin}
                      className="min-h-14 w-full rounded-2xl border border-white/10 bg-panel px-4 text-center text-2xl font-black tracking-[.3em] outline-none focus:border-gold/60"
                      placeholder="0000"
                    />
                    {fieldErrors.confirmPin && <p className="mt-1 text-xs font-bold text-red-300">{fieldErrors.confirmPin}</p>}
                  </label>
                </div>
                <p className="-mt-2 text-xs text-muted">
                  You'll use this PIN with your team name, mobile number, or BITS ID to resume the hunt later.
                </p>

                <div className="pt-2">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-black uppercase tracking-[.16em] text-gold">Additional Members</span>
                    {members.length < 4 && (
                      <button type="button" onClick={addMember} className="min-h-10 rounded-full border border-white/10 px-3 text-xs font-bold text-warm">
                        + Add member
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {members.map((member, index) => (
                      <div key={index} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
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
                        {members.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMember(index)}
                            aria-label={`Remove member ${index + 2}`}
                            className="min-h-12 rounded-full border border-white/10 px-3 text-xs font-bold text-muted sm:min-h-14"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {fieldErrors.members && <p className="mt-2 text-xs font-bold text-red-300">{fieldErrors.members}</p>}
                </div>

                {error && (
                  <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm font-bold text-red-300">
                    {error}
                  </p>
                )}

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
