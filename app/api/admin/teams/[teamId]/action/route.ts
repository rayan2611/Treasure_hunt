import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

const Payload = z.object({
  action: z.enum(["UNLOCK_NEXT", "MOVE_BACK", "RESET", "DISQUALIFY", "RESTORE", "INVALIDATE_SESSIONS"]),
  reason: z.string().max(500).optional()
});

export async function POST(
  request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  const adminCtx = await requireAdmin(request);
  if (!adminCtx) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const parsed = Payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Invalid action." }, { status: 400 });

  const { teamId } = await context.params;
  const supabase = supabaseAdmin();

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .maybeSingle();

  if (!team) return NextResponse.json({ message: "Team not found." }, { status: 404 });

  const patch: Record<string, unknown> = {};

  switch (parsed.data.action) {
    case "UNLOCK_NEXT":
      patch.questions_completed = team.questions_completed + 1;
      patch.current_question = team.current_question + 1;
      patch.last_completed_at = new Date().toISOString();
      break;
    case "MOVE_BACK":
      patch.questions_completed = Math.max(0, team.questions_completed - 1);
      patch.current_question = Math.max(1, team.current_question - 1);
      break;
    case "RESET":
      patch.questions_completed = 0;
      patch.current_question = 1;
      patch.last_completed_at = null;
      patch.finished_at = null;
      patch.status = "ACTIVE";
      patch.session_version = team.session_version + 1;
      break;
    case "DISQUALIFY":
      patch.status = "DISQUALIFIED";
      patch.session_version = team.session_version + 1;
      break;
    case "RESTORE":
      patch.status = "ACTIVE";
      break;
    case "INVALIDATE_SESSIONS":
      patch.session_version = team.session_version + 1;
      break;
  }

  const { error } = await supabase.from("teams").update(patch).eq("id", teamId);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  await supabase.from("audit_logs").insert({
    admin_id: adminCtx.user.id,
    action: `TEAM_${parsed.data.action}`,
    team_id: teamId,
    metadata: {
      reason: parsed.data.reason ?? null,
      before: {
        current_question: team.current_question,
        questions_completed: team.questions_completed,
        status: team.status
      },
      patch
    }
  });

  return NextResponse.json({ ok: true });
}
