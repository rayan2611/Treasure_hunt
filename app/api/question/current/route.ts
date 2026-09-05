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
    .select("id, event_id, current_question, status, session_version, test_access")
    .eq("id", session.teamId)
    .maybeSingle();

  if (!team || team.session_version !== session.sessionVersion) {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }

  if (team.status === "DISQUALIFIED") {
    return NextResponse.json({ code: "TEAM_DISQUALIFIED" }, { status: 403 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("status, hunt_start_time")
    .eq("id", team.event_id)
    .maybeSingle();

  // A test_access team bypasses the hunt_start_time gate entirely (organizer
  // dry-run) — every other team is still gated by the normal auto-live clock.
  const effectiveStatus = team.test_access
    ? "LIVE"
    : event
    ? effectiveEventStatus(event.status, event.hunt_start_time)
    : null;

  if (effectiveStatus !== "LIVE") {
    const code =
      effectiveStatus === "PAUSED" ? "EVENT_PAUSED" :
      effectiveStatus === "ENDED" ? "EVENT_ENDED" :
      "EVENT_NOT_STARTED";
    return NextResponse.json({ code }, { status: 403 });
  }

  const { data: question } = await supabase
    .from("questions")
    .select("id, question_number, title, question_text, media_url")
    .eq("event_id", team.event_id)
    .eq("question_number", team.current_question)
    .eq("is_active", true)
    .maybeSingle();

  if (!question) return NextResponse.json({ code: "QUESTION_UNAVAILABLE" }, { status: 404 });

  return NextResponse.json({
    questionId: question.id,
    questionNumber: question.question_number,
    title: question.title,
    questionText: question.question_text,
    mediaUrl: question.media_url
  });
}
