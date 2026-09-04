import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const eventId = process.env.NEXT_PUBLIC_EVENT_ID;
  if (!eventId) return NextResponse.json({ entries: [] });

  const supabase = supabaseAdmin();

  const { data, error } = await supabase.rpc("get_public_leaderboard", {
    p_event_id: eventId,
    p_limit: 10
  });

  if (error) {
    return NextResponse.json({ code: "SERVER_ERROR", message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    entries: (data ?? []).map((row: any) => ({
      rank: Number(row.rank),
      teamName: row.team_name,
      questionsCompleted: row.questions_completed,
      totalQuestions: row.total_questions,
      finished: row.status === "FINISHED"
    }))
  });
}
