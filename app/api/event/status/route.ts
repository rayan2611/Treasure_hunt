import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const eventId = process.env.NEXT_PUBLIC_EVENT_ID;
  if (!eventId) return NextResponse.json({ code: "EVENT_NOT_CONFIGURED" }, { status: 500 });

  const { data, error } = await supabaseAdmin()
    .from("events")
    .select("id, name, status, registration_open, total_questions, hunt_start_time, hunt_end_time")
    .eq("id", eventId)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ code: "EVENT_NOT_FOUND" }, { status: 404 });

  // Aggregate-only, non-sensitive count — no team identities or private fields exposed.
  const { count } = await supabaseAdmin()
    .from("teams")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .neq("status", "DISQUALIFIED");

  return NextResponse.json({ ...data, team_count: count ?? 0 });
}
