import { NextResponse } from "next/server";
import { readTeamSession } from "@/lib/team-session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { effectiveEventStatus } from "@/lib/event-status";

export async function GET() {
  const session = await readTeamSession();
  if (!session) return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });

  const supabase = supabaseAdmin();

  const { data: team } = await supabase
    .from("teams")
    .select("id, event_id, team_name, current_question, questions_completed, status, session_version, test_access")
    .eq("id", session.teamId)
    .maybeSingle();

  if (!team || team.session_version !== session.sessionVersion) {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("status, total_questions, hunt_start_time")
    .eq("id", team.event_id)
    .maybeSingle();

  if (!event) return NextResponse.json({ code: "EVENT_NOT_FOUND" }, { status: 404 });

  return NextResponse.json({
    teamId: team.id,
    teamName: team.team_name,
    currentQuestion: team.current_question,
    questionsCompleted: team.questions_completed,
    totalQuestions: event.total_questions,
    status: team.status,
    // A test_access team (organizer dry-run) always sees LIVE, bypassing
    // hunt_start_time — every other team gets the normal auto-live clock.
    eventStatus: team.test_access ? "LIVE" : effectiveEventStatus(event.status, event.hunt_start_time)
  });
}
