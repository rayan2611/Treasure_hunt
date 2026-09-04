import { NextResponse } from "next/server";
import { readTeamSession } from "@/lib/team-session";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const session = await readTeamSession();
  if (!session) return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });

  const supabase = supabaseAdmin();

  const { data: team } = await supabase
    .from("teams")
    .select("id, event_id, current_question, status, session_version")
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
    .select("status")
    .eq("id", team.event_id)
    .maybeSingle();

  if (event?.status !== "LIVE") {
    const code =
      event?.status === "PAUSED" ? "EVENT_PAUSED" :
      event?.status === "ENDED" ? "EVENT_ENDED" :
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
