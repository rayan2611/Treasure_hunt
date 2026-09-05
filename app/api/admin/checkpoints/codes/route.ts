import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Scan/code audit view: every checkpoint_codes row, joined with team name and
// checkpoint (question) number, newest first.
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const { data, error } = await supabaseAdmin()
    .from("checkpoint_codes")
    .select(
      "id, code, issued_at, expires_at, used_at, status, teams(team_name), questions(question_number)"
    )
    .order("issued_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const codes = (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    status: row.status,
    teamName: (row.teams as unknown as { team_name: string } | null)?.team_name ?? "—",
    questionNumber: (row.questions as unknown as { question_number: number } | null)?.question_number ?? null
  }));

  return NextResponse.json({ codes });
}
