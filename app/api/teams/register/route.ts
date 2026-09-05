import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createTeamSession } from "@/lib/team-session";
import { isValidBitsId, isValidPin, MIN_ADDITIONAL_MEMBERS, MAX_ADDITIONAL_MEMBERS } from "@/lib/validation";

const Member = z.object({
  name: z.string().trim().min(1).max(80),
  // No format restriction on BITS ID by organizer request.
  bitsId: z.string().trim().min(1).max(60)
});

const Payload = z.object({
  teamName: z.string().trim().min(2).max(80),
  leaderName: z.string().trim().min(2).max(80),
  leaderBITSID: z.string().trim().min(1).max(60),
  contactNumber: z.string().trim().min(6).max(20),
  // Teams choose their own 4-digit PIN at registration (not derived from
  // the BITS ID) and log back in with team name / mobile / BITS ID + PIN.
  pin: z.string().trim().length(4),
  // Leader + 1-4 additional members = team size 2-5, enforced server-side.
  members: z.array(Member).min(MIN_ADDITIONAL_MEMBERS).max(MAX_ADDITIONAL_MEMBERS)
});

export async function POST(request: Request) {
  const parsed = Payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { code: "INVALID_REGISTRATION", message: "Check the registration fields. Teams need 2-5 members." },
      { status: 400 }
    );
  }

  if (!isValidBitsId(parsed.data.leaderBITSID)) {
    return NextResponse.json(
      { code: "INVALID_BITS_ID", message: "Enter the leader's BITS ID." },
      { status: 400 }
    );
  }

  if (!isValidPin(parsed.data.pin)) {
    return NextResponse.json(
      { code: "INVALID_PIN", message: "PIN must be exactly 4 digits." },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();
  const eventId = process.env.NEXT_PUBLIC_EVENT_ID;
  if (!eventId) return NextResponse.json({ message: "Event not configured." }, { status: 500 });

  const { data: event } = await supabase
    .from("events")
    .select("id, status, registration_open")
    .eq("id", eventId)
    .maybeSingle();

  if (!event || !event.registration_open || !["REGISTRATION", "LIVE"].includes(event.status)) {
    return NextResponse.json(
      { code: "REGISTRATION_CLOSED", message: "Registration is currently closed." },
      { status: 403 }
    );
  }

  const leaderBITSID = parsed.data.leaderBITSID.toUpperCase();

  const { data: existing } = await supabase
    .from("teams")
    .select("id")
    .eq("event_id", eventId)
    .eq("leader_bits_id", leaderBITSID)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { code: "DUPLICATE_REGISTRATION", message: "This leader BITS ID is already registered." },
      { status: 409 }
    );
  }

  const { data: inserted, error } = await supabase
    .from("teams")
    .insert({
      event_id: eventId,
      team_name: parsed.data.teamName,
      leader_name: parsed.data.leaderName,
      leader_bits_id: leaderBITSID,
      login_code: parsed.data.pin.trim(),
      members: parsed.data.members.map((m) => ({
        name: m.name,
        bitsId: m.bitsId.toUpperCase()
      })),
      contact_number: parsed.data.contactNumber,
      current_question: 1,
      questions_completed: 0,
      status: "ACTIVE",
      session_version: 1
    })
    .select("id, session_version")
    .single();

  if (error || !inserted) {
    return NextResponse.json({ code: "SERVER_ERROR", message: error?.message ?? "Registration failed." }, { status: 500 });
  }

  // Registration itself proves the team is legitimate — log them straight in
  // rather than making them re-enter their details on a separate login screen.
  await createTeamSession({
    teamId: inserted.id,
    sessionVersion: inserted.session_version
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
