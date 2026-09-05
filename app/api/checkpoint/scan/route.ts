import { NextResponse } from "next/server";
import { z } from "zod";
import { readTeamSession } from "@/lib/team-session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/rate-limit";
import { generateCheckpointCode } from "@/lib/checkpoint-code";
import { CHECKPOINT_CODE_TTL_MS } from "@/lib/checkpoint-secret";

const Payload = z.object({
  checkpointSecret: z.string().min(1).max(200)
});

// Scans of the same checkpoint within this window are rejected without
// issuing a fresh code (prevents a jittery scanner loop from spamming rows).
const SCAN_RATE_LIMIT_MS = 7000;

export async function POST(request: Request) {
  const session = await readTeamSession();
  if (!session) return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });

  const parsed = Payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ code: "INVALID_CHECKPOINT" }, { status: 400 });
  }

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

  if (team.status === "FINISHED") {
    return NextResponse.json({ code: "ALREADY_COMPLETED" }, { status: 403 });
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
    .select("id, question_number")
    .eq("event_id", team.event_id)
    .eq("checkpoint_secret", parsed.data.checkpointSecret)
    .maybeSingle();

  if (!question) {
    return NextResponse.json({ code: "INVALID_CHECKPOINT" }, { status: 404 });
  }

  if (question.question_number !== team.current_question) {
    return NextResponse.json({ code: "WRONG_CHECKPOINT" }, { status: 409 });
  }

  const { data: lastIssued } = await supabase
    .from("checkpoint_codes")
    .select("issued_at")
    .eq("team_id", team.id)
    .eq("question_id", question.id)
    .order("issued_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (isRateLimited(lastIssued?.issued_at ?? null, Date.now(), SCAN_RATE_LIMIT_MS)) {
    return NextResponse.json({ code: "RATE_LIMITED" }, { status: 429 });
  }

  await supabase
    .from("checkpoint_codes")
    .update({ status: "SUPERSEDED" })
    .eq("team_id", team.id)
    .eq("question_id", question.id)
    .eq("status", "ACTIVE");

  const newCode = generateCheckpointCode();
  const expiresAt = new Date(Date.now() + CHECKPOINT_CODE_TTL_MS).toISOString();

  const { error: insertError } = await supabase.from("checkpoint_codes").insert({
    team_id: team.id,
    question_id: question.id,
    code: newCode,
    expires_at: expiresAt,
    status: "ACTIVE"
  });

  if (insertError) {
    return NextResponse.json({ code: "SERVER_ERROR", message: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ code: newCode, expiresAt });
}
