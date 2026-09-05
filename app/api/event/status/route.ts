import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { effectiveEventStatus } from "@/lib/event-status";

export async function GET() {
  const eventId = process.env.NEXT_PUBLIC_EVENT_ID;
  if (!eventId) return NextResponse.json({ code: "EVENT_NOT_CONFIGURED" }, { status: 500 });

  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("events")
    .select("id, name, status, registration_open, total_questions, hunt_start_time, hunt_end_time")
    .eq("id", eventId)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ code: "EVENT_NOT_FOUND" }, { status: 404 });

  const effectiveStatus = effectiveEventStatus(data.status, data.hunt_start_time);

  // Self-heal: once the clock passes hunt_start_time, persist the flip to LIVE
  // so the stored status matches reality without an admin needing to click
  // anything at the exact moment. Fire-and-forget — the response below already
  // reflects the correct status either way.
  if (effectiveStatus !== data.status) {
    void supabase
      .from("events")
      .update({ status: effectiveStatus, updated_at: new Date().toISOString() })
      .eq("id", eventId)
      .eq("status", data.status);
  }

  // Aggregate-only, non-sensitive count — no team identities or private fields exposed.
  const { count } = await supabase
    .from("teams")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .neq("status", "DISQUALIFIED");

  return NextResponse.json({ ...data, status: effectiveStatus, team_count: count ?? 0 });
}
