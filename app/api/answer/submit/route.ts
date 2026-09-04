import { NextResponse } from "next/server";
import { z } from "zod";
import { readTeamSession } from "@/lib/team-session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/rate-limit";

const Payload = z.object({
  questionId: z.string().uuid(),
  answer: z.string().min(1).max(250)
});

// Database-backed rate limiting: below this many milliseconds since the team's
// last submission (per submissions(team_id, submitted_at desc) index), reject
// without touching the atomic RPC. No in-memory state — safe across any number
// of serverless instances since it reads from the shared database.
const RATE_LIMIT_MS = 1200;

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
    .select("id, session_version")
    .eq("id", session.teamId)
    .maybeSingle();

  if (!team || team.session_version !== session.sessionVersion) {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data: lastSubmission } = await supabase
    .from("submissions")
    .select("submitted_at")
    .eq("team_id", session.teamId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (isRateLimited(lastSubmission?.submitted_at ?? null, Date.now(), RATE_LIMIT_MS)) {
    return NextResponse.json({ code: "RATE_LIMITED" }, { status: 429 });
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
