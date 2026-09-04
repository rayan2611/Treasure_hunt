"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CurrentQuestion, TeamSafeState } from "@/lib/types";
import { HuntHeader } from "@/components/hunt-header";
import { ProgressTracker } from "@/components/progress-tracker";
import { QuestionCard } from "@/components/question-card";
import { EventState } from "@/components/event-state";

export default function HuntPage() {
  const router = useRouter();
  const [team, setTeam] = useState<TeamSafeState | null>(null);
  const [question, setQuestion] = useState<CurrentQuestion | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const teamRes = await fetch("/api/team", { cache: "no-store" });
    if (teamRes.status === 401) {
      router.replace("/login");
      return;
    }

    const teamData = await teamRes.json();
    setTeam(teamData);

    if (teamData.status === "FINISHED") {
      router.replace("/finish");
      return;
    }

    if (teamData.eventStatus === "LIVE") {
      const qRes = await fetch("/api/question/current", { cache: "no-store" });
      if (qRes.ok) setQuestion(await qRes.json());
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 7000);
    return () => clearInterval(timer);
  }, [load]);

  if (loading || !team) {
    return <main className="flex min-h-screen items-center justify-center text-muted">Loading hunt…</main>;
  }

  return (
    <>
      <HuntHeader
        teamName={team.teamName}
        currentQuestion={team.currentQuestion}
        totalQuestions={team.totalQuestions}
      />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <ProgressTracker completed={team.questionsCompleted} total={team.totalQuestions} />

        {team.eventStatus !== "LIVE" ? (
          <EventState status={team.eventStatus} />
        ) : question ? (
          <QuestionCard question={question} onSolved={load} />
        ) : (
          <div className="rounded-3xl border border-white/10 bg-panel p-8 text-center text-muted">
            Current question unavailable. Please contact an organizer.
          </div>
        )}
      </main>
    </>
  );
}
