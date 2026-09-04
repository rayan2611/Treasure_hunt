import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const eventId = process.env.NEXT_PUBLIC_EVENT_ID;
  if (!eventId) return NextResponse.json({ code: "EVENT_NOT_CONFIGURED" }, { status: 500 });

  const { data, error } = await supabaseAdmin()
    .from("events")
    .select("id, name, status, registration_open, total_questions")
    .eq("id", eventId)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ code: "EVENT_NOT_FOUND" }, { status: 404 });
  return NextResponse.json(data);
}
