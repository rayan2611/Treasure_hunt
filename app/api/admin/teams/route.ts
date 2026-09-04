import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const eventId = process.env.NEXT_PUBLIC_EVENT_ID;
  const { data, error } = await supabaseAdmin()
    .from("teams")
    .select("id, team_name, leader_name, leader_bits_id, current_question, questions_completed, status, last_completed_at, finished_at, registered_at")
    .eq("event_id", eventId)
    .order("questions_completed", { ascending: false })
    .order("last_completed_at", { ascending: true, nullsFirst: false })
    .order("registered_at", { ascending: true });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ teams: data ?? [] });
}
