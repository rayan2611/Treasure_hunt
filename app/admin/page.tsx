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
  finished_at?: string | null;
  registered_at?: string | null;
};

type AdminQuestion = {
  id: string;
  question_number: number;
  title: string | null;
  question_text: string;
  media_url: string | null;
  accepted_answers: string[];
  validation_mode: string;
  is_active: boolean;
};

const EVENT_STATUSES = ["DRAFT", "REGISTRATION", "LIVE", "PAUSED", "ENDED"] as const;

export default function AdminPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<"teams" | "questions" | "event">("teams");
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
  }, [supabase]);

  function authHeaders(): HeadersInit {
    return { authorization: `Bearer ${token}` };
  }

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
    const res = await fetch("/api/admin/teams", { headers: authHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message ?? "Admin access denied.");
      return;
    }
    setTeams(data.teams ?? []);
  }

  async function loadQuestions() {
    if (!token) return;
    const res = await fetch("/api/admin/questions", { headers: authHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message ?? "Could not load questions.");
      return;
    }
    setQuestions(data.questions ?? []);
  }

  useEffect(() => {
    loadTeams();
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function teamAction(teamId: string, action: string, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setError("");
    const res = await fetch(`/api/admin/teams/${teamId}/action`, {
      method: "POST",
      headers: { ...authHeaders(), "content-type": "application/json" },
      body: JSON.stringify({ action })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message ?? "Action failed.");
      return;
    }
    setNotice("Team updated.");
    loadTeams();
  }

  async function setEventStatus(status: string) {
    if (!window.confirm(`Change event status to ${status}?`)) return;
    setError("");
    const res = await fetch("/api/admin/event-status", {
      method: "POST",
      headers: { ...authHeaders(), "content-type": "application/json" },
      body: JSON.stringify({ status, registrationOpen: status !== "DRAFT" })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message ?? "Could not change event status.");
      return;
    }
    setNotice(`Event status set to ${status}.`);
  }

  async function saveQuestion(q: AdminQuestion) {
    setError("");
    const res = await fetch("/api/admin/questions", {
      method: "PATCH",
      headers: { ...authHeaders(), "content-type": "application/json" },
      body: JSON.stringify({
        questionNumber: q.question_number,
        title: q.title,
        questionText: q.question_text,
        mediaUrl: q.media_url ?? "",
        acceptedAnswers: q.accepted_answers,
        validationMode: q.validation_mode,
        isActive: q.is_active
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message ?? "Could not save question.");
      return;
    }
    setNotice(`Clue ${q.question_number} saved.`);
    loadQuestions();
  }

  async function exportCsv() {
    if (!token) return;
    const res = await fetch("/api/admin/export", { headers: authHeaders() });
    if (!res.ok) {
      setError("Export failed.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `treasure-hunt-results-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <form onSubmit={login} className="w-full max-w-md rounded-3xl border border-white/10 bg-panel p-8">
          <h1 className="text-3xl font-black">ADMIN</h1>
          <p className="mt-2 text-sm text-muted">Sign in with your organizer account.</p>
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
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[.18em] text-gold">Organizer</p>
          <h1 className="text-4xl font-black">ADMIN DASHBOARD</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="min-h-12 rounded-full border border-gold/50 px-4 text-sm font-bold text-gold">
            Export CSV
          </button>
          <button
            onClick={() => {
              loadTeams();
              loadQuestions();
            }}
            className="min-h-12 rounded-full border border-white/10 px-4 text-sm font-bold"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-2 border-b border-white/8">
        {(["teams", "questions", "event"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`min-h-12 border-b-2 px-4 text-sm font-bold uppercase tracking-wide ${
              tab === t ? "border-gold text-gold" : "border-transparent text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-red-300">{error}</p>}
      {notice && <p className="mb-4 text-gold">{notice}</p>}

      {tab === "teams" && (
        <div className="overflow-x-auto rounded-2xl border border-white/8">
          <table className="w-full min-w-[1000px] bg-panel text-left text-sm">
            <thead className="border-b border-white/8 text-muted">
              <tr>
                <th className="p-4">Team</th>
                <th className="p-4">Leader</th>
                <th className="p-4">BITS ID</th>
                <th className="p-4">Current</th>
                <th className="p-4">Completed</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id} className="border-b border-white/5 align-top">
                  <td className="p-4 font-bold">{t.team_name}</td>
                  <td className="p-4">{t.leader_name}</td>
                  <td className="p-4">{t.leader_bits_id}</td>
                  <td className="p-4">{t.current_question}</td>
                  <td className="p-4">{t.questions_completed}</td>
                  <td className="p-4">{t.status}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => teamAction(t.id, "UNLOCK_NEXT")} className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold">
                        Advance
                      </button>
                      <button onClick={() => teamAction(t.id, "MOVE_BACK")} className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold">
                        Back
                      </button>
                      <button onClick={() => teamAction(t.id, "RESET", "Reset this team's progress to clue 1?")} className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold">
                        Reset
                      </button>
                      {t.status === "DISQUALIFIED" ? (
                        <button onClick={() => teamAction(t.id, "RESTORE")} className="rounded-full border border-teal/50 px-3 py-1 text-xs font-bold text-teal">
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => teamAction(t.id, "DISQUALIFY", `Disqualify ${t.team_name}? This invalidates their session immediately.`)}
                          className="rounded-full border border-red-400/50 px-3 py-1 text-xs font-bold text-red-300"
                        >
                          Disqualify
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted">No teams registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "questions" && (
        <div className="space-y-4">
          {questions.map((q) => (
            <QuestionEditor key={q.question_number} question={q} onSave={saveQuestion} onChange={(next) =>
              setQuestions((prev) => prev.map((p) => (p.question_number === q.question_number ? next : p)))
            } />
          ))}
          {questions.length === 0 && (
            <p className="text-muted">No questions found. Run the seed script or add one via the API.</p>
          )}
        </div>
      )}

      {tab === "event" && (
        <div className="max-w-xl rounded-3xl border border-white/10 bg-panel p-7">
          <h2 className="text-2xl font-black">Event Status</h2>
          <p className="mt-2 text-sm text-muted">
            Transition the event. LIVE unlocks Clue 1 for all teams; PAUSED blocks submissions while preserving
            progress; ENDED blocks all further submissions.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {EVENT_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setEventStatus(s)}
                className="min-h-12 rounded-full border border-gold/50 px-4 text-sm font-bold text-gold"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function QuestionEditor({
  question,
  onChange,
  onSave
}: {
  question: AdminQuestion;
  onChange: (q: AdminQuestion) => void;
  onSave: (q: AdminQuestion) => void;
}) {
  const [answersText, setAnswersText] = useState(question.accepted_answers.join(", "));

  return (
    <div className="rounded-3xl border border-white/10 bg-panel p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black uppercase tracking-[.2em] text-gold">Clue {question.question_number}</p>
        <label className="flex items-center gap-2 text-xs font-bold text-muted">
          <input
            type="checkbox"
            checked={question.is_active}
            onChange={(e) => onChange({ ...question, is_active: e.target.checked })}
          />
          Active
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-xs font-bold text-muted">Title</span>
        <input
          value={question.title ?? ""}
          onChange={(e) => onChange({ ...question, title: e.target.value })}
          className="min-h-12 w-full rounded-xl border border-white/10 bg-ink px-4"
        />
      </label>

      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-bold text-muted">Clue text</span>
        <textarea
          value={question.question_text}
          onChange={(e) => onChange({ ...question, question_text: e.target.value })}
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3"
        />
      </label>

      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-bold text-muted">Media URL (optional)</span>
        <input
          value={question.media_url ?? ""}
          onChange={(e) => onChange({ ...question, media_url: e.target.value })}
          className="min-h-12 w-full rounded-xl border border-white/10 bg-ink px-4"
        />
      </label>

      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-bold text-muted">Accepted answers (comma-separated)</span>
        <input
          value={answersText}
          onChange={(e) => {
            setAnswersText(e.target.value);
            onChange({
              ...question,
              accepted_answers: e.target.value.split(",").map((a) => a.trim()).filter(Boolean)
            });
          }}
          className="min-h-12 w-full rounded-xl border border-white/10 bg-ink px-4"
        />
      </label>

      <button
        onClick={() => onSave(question)}
        className="mt-4 min-h-12 rounded-full bg-gold px-6 text-sm font-black text-ink"
      >
        Save Clue {question.question_number}
      </button>
    </div>
  );
}
