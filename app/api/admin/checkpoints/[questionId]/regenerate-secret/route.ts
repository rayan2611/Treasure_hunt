import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Invalidates a checkpoint's printed QR immediately by rotating its secret.
export async function POST(
  request: Request,
  context: { params: Promise<{ questionId: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const { questionId } = await context.params;
  const supabase = supabaseAdmin();

  const { data: existing } = await supabase
    .from("questions")
    .select("id, question_number")
    .eq("id", questionId)
    .maybeSingle();

  if (!existing) return NextResponse.json({ message: "Checkpoint not found." }, { status: 404 });

  const newSecret = randomBytes(24).toString("hex");

  const { error } = await supabase
    .from("questions")
    .update({ checkpoint_secret: newSecret, updated_at: new Date().toISOString() })
    .eq("id", questionId);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  await supabase.from("audit_logs").insert({
    admin_id: admin.user.id,
    action: "CHECKPOINT_SECRET_REGENERATED",
    question_id: questionId,
    metadata: { questionNumber: existing.question_number }
  });

  return NextResponse.json({ ok: true });
}
