"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type AdminTeam = {
  id: string;
  team_name: string;
  leader_name: string;
  leader_bits_id: string;
  current_question: number;
  questions_completed: number;
  status: string;
  last_completed_at: string | null;
};

export default function AdminPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [token, setToken] = useState<string | null>(null);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
  }, [supabase]);

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      return;
    }
    setToken(data.session.access_token);
  }

  async function loadTeams() {
    if (!token) return;
    const res = await fetch("/api/admin/teams", {
      headers: { authorization: `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message ?? "Admin access denied.");
      return;
    }
    setTeams(data.teams ?? []);
  }

  useEffect(() => {
    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <form onSubmit={login} className="w-full max-w-md rounded-3xl border border-white/10 bg-panel p-8">
          <h1 className="text-3xl font-black">ADMIN</h1>
          <p className="mt-2 text-sm text-muted">Supabase Auth email/password starter.</p>
          <input name="email" type="email" required placeholder="Email" className="mt-6 min-h-12 w-full rounded-xl bg-ink px-4" />
          <input name="password" type="password" required placeholder="Password" className="mt-3 min-h-12 w-full rounded-xl bg-ink px-4" />
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          <button className="mt-5 min-h-12 rounded-full bg-gold px-6 font-black text-ink">Sign in</button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-10">
      <div className="mb-7 flex items-center justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[.18em] text-gold">Organizer</p>
          <h1 className="text-4xl font-black">ADMIN DASHBOARD</h1>
        </div>
        <button onClick={loadTeams} className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold">Refresh</button>
      </div>

      {error && <p className="mb-4 text-red-300">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-white/8">
        <table className="w-full min-w-[900px] bg-panel text-left text-sm">
          <thead className="border-b border-white/8 text-muted">
            <tr>
              <th className="p-4">Team</th>
              <th className="p-4">Leader</th>
              <th className="p-4">BITS ID</th>
              <th className="p-4">Current</th>
              <th className="p-4">Completed</th>
              <th className="p-4">Status</th>
              <th className="p-4">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id} className="border-b border-white/5">
                <td className="p-4 font-bold">{t.team_name}</td>
                <td className="p-4">{t.leader_name}</td>
                <td className="p-4">{t.leader_bits_id}</td>
                <td className="p-4">{t.current_question}</td>
                <td className="p-4">{t.questions_completed}</td>
                <td className="p-4">{t.status}</td>
                <td className="p-4 text-muted">{t.last_completed_at ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-sm text-muted">
        Boilerplate note: add UI controls for pause/resume, unlock/reset, disqualify, question editing and CSV export against the included admin APIs.
      </p>
    </main>
  );
}
