import { NextResponse } from "next/server";
import { z } from "zod";
import { readTeamSession } from "@/lib/team-session";
import { supabaseAdmin } from "@/lib/supabase/admin";

const Payload = z.object({
  code: z.string().regex(/^\d{6}$/)
});

// Wrong-attempt rate limiting: too many incorrect codes in a short window for
// the team's current checkpoint blocks further tries without touching the RPC.
const WRONG_ATTEMPT_WINDOW_MS = 60_000;
const WRONG_ATTEMPT_LIMIT = 5;

export async function POST(request: Request) {
  const session = await readTeamSession();
  if (!session) return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });

  const parsed = Payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ code: "INVALID_SUBMISSION" }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  const { data: team } = await supabase
    .from("teams")
    .select("id, event_id, current_question, session_version")
    .eq("id", session.teamId)
    .maybeSingle();

  if (!team || team.session_version !== session.sessionVersion) {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data: question } = await supabase
    .from("questions")
    .select("id")
    .eq("event_id", team.event_id)
    .eq("question_number", team.current_question)
    .eq("is_active", true)
    .maybeSingle();

  if (question) {
    const since = new Date(Date.now() - WRONG_ATTEMPT_WINDOW_MS).toISOString();
    const { count } = await supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("team_id", team.id)
      .eq("question_id", question.id)
      .eq("correct", false)
      .gte("submitted_at", since);

    if ((count ?? 0) >= WRONG_ATTEMPT_LIMIT) {
      return NextResponse.json({ code: "RATE_LIMITED" }, { status: 429 });
    }
  }

  const { data, error } = await supabase.rpc("redeem_checkpoint_code", {
    p_team_id: session.teamId,
    p_code: parsed.data.code
  });

  if (error) {
    return NextResponse.json({ code: "SERVER_ERROR", message: error.message }, { status: 500 });
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result) return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });

  if (result.code === "WRONG_CODE") {
    return NextResponse.json({ correct: false, code: "WRONG_CODE" }, { status: 400 });
  }

  if (result.code === "CODE_EXPIRED") {
    return NextResponse.json({ correct: false, code: "CODE_EXPIRED" }, { status: 410 });
  }

  if (result.code !== "OK" && result.code !== "ALREADY_COMPLETED") {
    const status =
      result.code === "EVENT_PAUSED" ||
      result.code === "EVENT_NOT_STARTED" ||
      result.code === "EVENT_ENDED" ||
      result.code === "TEAM_DISQUALIFIED" ? 403 :
      result.code === "QUESTION_LOCKED" ? 409 :
      result.code === "TEAM_NOT_FOUND" ? 404 :
      400;

    return NextResponse.json({ correct: false, code: result.code }, { status });
  }

  return NextResponse.json({
    correct: true,
    code: result.code,
    currentQuestion: result.current_question,
    questionsCompleted: result.questions_completed,
    finished: result.finished
  });
}
