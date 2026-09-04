"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CurrentQuestion, EventStatusPayload, TeamSafeState } from "@/lib/types";
import { HuntHeader } from "@/components/hunt-header";
import { ProgressTracker } from "@/components/progress-tracker";
import { QuestionCard } from "@/components/question-card";
import { EventState } from "@/components/event-state";
import { usePolling } from "@/lib/use-polling";

export default function HuntPage() {
  const router = useRouter();
  const [team, setTeam] = useState<TeamSafeState | null>(null);
  const [question, setQuestion] = useState<CurrentQuestion | null>(null);
  const [eventStatus, setEventStatus] = useState<EventStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const wasLive = useRef(false);

  const loadTeamAndQuestion = useCallback(async () => {
    try {
      const teamRes = await fetch("/api/team", { cache: "no-store" });
      if (teamRes.status === 401) {
        router.replace("/login");
        return;
      }
      if (!teamRes.ok) {
        setConnectionError(true);
        return;
      }
      setConnectionError(false);

      const teamData: TeamSafeState = await teamRes.json();
      setTeam(teamData);

      if (teamData.status === "DISQUALIFIED") {
        setLoading(false);
        return;
      }

      if (teamData.status === "FINISHED") {
        router.replace("/finish");
        return;
      }

      if (teamData.eventStatus === "LIVE") {
        const qRes = await fetch("/api/question/current", { cache: "no-store" });
        if (qRes.ok) setQuestion(await qRes.json());
      } else {
        setQuestion(null);
      }
    } catch {
      setConnectionError(true);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const pollEventStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/event/status", { cache: "no-store" });
      if (!res.ok) return;
      const data: EventStatusPayload = await res.json();
      setEventStatus(data);

      const isLiveNow = data.status === "LIVE";
      // Per backend spec section 13: when the event transitions to LIVE while
      // a team is waiting, the next poll should unlock Clue 1 without a manual refresh.
      if (isLiveNow && !wasLive.current) {
        loadTeamAndQuestion();
      }
      wasLive.current = isLiveNow;
    } catch {
      setConnectionError(true);
    }
  }, [loadTeamAndQuestion]);

  useEffect(() => {
    loadTeamAndQuestion();
  }, [loadTeamAndQuestion]);

  // Event status: poll every 12s (within the 10-15s band from spec section 20A).
  usePolling(pollEventStatus, 12000);

  if (loading || !team) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted">
        {connectionError ? "Connection lost. Retrying…" : "Loading hunt…"}
      </main>
    );
  }

  if (team.status === "DISQUALIFIED") {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 text-center">
        <div className="max-w-md rounded-3xl border border-red-400/30 bg-panel p-8">
          <h1 className="text-2xl font-black text-red-300">TEAM DISQUALIFIED</h1>
          <p className="mt-3 text-muted">Your team has been disqualified by the organizers. Contact them if you believe this is a mistake.</p>
        </div>
      </main>
    );
  }

  const effectiveStatus = eventStatus?.status ?? team.eventStatus;

  return (
    <>
      <HuntHeader
        teamName={team.teamName}
        currentQuestion={team.currentQuestion}
        totalQuestions={team.totalQuestions}
      />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <ProgressTracker completed={team.questionsCompleted} total={team.totalQuestions} current={team.currentQuestion} />

        {connectionError && (
          <p className="mb-4 rounded-xl border border-white/10 bg-panel px-4 py-2 text-center text-sm text-muted">
            Connection unstable — retrying in the background.
          </p>
        )}

        {effectiveStatus !== "LIVE" ? (
          <EventState status={effectiveStatus} huntStartTime={eventStatus?.hunt_start_time} />
        ) : question ? (
          <QuestionCard question={question} onSolved={loadTeamAndQuestion} />
        ) : (
          <div className="rounded-3xl border border-white/10 bg-panel p-8 text-center text-muted">
            Current question unavailable. Please contact an organizer.
          </div>
        )}
      </main>
    </>
  );
}
