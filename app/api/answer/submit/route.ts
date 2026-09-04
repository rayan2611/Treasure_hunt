import { NextResponse } from "next/server";
import { z } from "zod";
import { readTeamSession } from "@/lib/team-session";
import { supabaseAdmin } from "@/lib/supabase/admin";

const Payload = z.object({
  questionId: z.string().uuid(),
  answer: z.string().min(1).max(250)
});

const attemptWindow = new Map<string, number>();

export async function POST(request: Request) {
  const session = await readTeamSession();
  if (!session) return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });

  const parsed = Payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ code: "INVALID_SUBMISSION" }, { status: 400 });
  }

  // Starter in-memory limiter. Replace with Redis/Upstash or database-backed limiting in production.
  const now = Date.now();
  const previous = attemptWindow.get(session.teamId) ?? 0;
  if (now - previous < 1200) {
    return NextResponse.json({ code: "RATE_LIMITED" }, { status: 429 });
  }
  attemptWindow.set(session.teamId, now);

  const supabase = supabaseAdmin();

  const { data: team } = await supabase
    .from("teams")
    .select("id, session_version")
    .eq("id", session.teamId)
    .maybeSingle();

  if (!team || team.session_version !== session.sessionVersion) {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("submit_answer_atomic", {
    p_team_id: session.teamId,
    p_question_id: parsed.data.questionId,
    p_answer: parsed.data.answer
  });

  if (error) {
    return NextResponse.json({ code: "SERVER_ERROR", message: error.message }, { status: 500 });
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result) return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });

  if (result.code === "WRONG_ANSWER") {
    return NextResponse.json({ correct: false, code: "WRONG_ANSWER" }, { status: 400 });
  }

  if (result.code !== "OK" && result.code !== "ALREADY_COMPLETED") {
    const status =
      result.code === "EVENT_PAUSED" || result.code === "EVENT_NOT_LIVE" ? 403 :
      result.code === "TEAM_DISQUALIFIED" ? 403 :
      result.code === "QUESTION_LOCKED" ? 409 :
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
