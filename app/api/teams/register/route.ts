import { NextResponse } from "next/server";
import { z } from "zod";
import { extractLastFourDigits } from "@/lib/normalize";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isValidBitsId, MIN_ADDITIONAL_MEMBERS, MAX_ADDITIONAL_MEMBERS } from "@/lib/validation";

const Member = z.object({
  name: z.string().trim().min(1).max(80),
  bitsId: z.string().trim().min(4).max(40)
});

const Payload = z.object({
  teamName: z.string().trim().min(2).max(80),
  leaderName: z.string().trim().min(2).max(80),
  leaderBITSID: z.string().trim().min(4).max(40),
  contactNumber: z.string().trim().min(6).max(20),
  // Leader + 2-4 additional members = team size 3-5, enforced server-side.
  members: z.array(Member).min(MIN_ADDITIONAL_MEMBERS).max(MAX_ADDITIONAL_MEMBERS)
});

export async function POST(request: Request) {
  const parsed = Payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { code: "INVALID_REGISTRATION", message: "Check the registration fields. Teams need 3-5 members." },
      { status: 400 }
    );
  }

  if (!isValidBitsId(parsed.data.leaderBITSID)) {
    return NextResponse.json(
      { code: "INVALID_BITS_ID", message: "Leader BITS ID must look like 2023A7PS1234P." },
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

  let loginCode: string;
  try {
    loginCode = extractLastFourDigits(leaderBITSID);
  } catch {
    return NextResponse.json(
      { code: "INVALID_BITS_ID", message: "BITS ID must contain at least four digits." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("teams").insert({
    event_id: eventId,
    team_name: parsed.data.teamName,
    leader_name: parsed.data.leaderName,
    leader_bits_id: leaderBITSID,
    login_code: loginCode,
    members: parsed.data.members.map((m) => ({
      name: m.name,
      bitsId: m.bitsId.toUpperCase()
    })),
    contact_number: parsed.data.contactNumber,
    current_question: 1,
    questions_completed: 0,
    status: "ACTIVE",
    session_version: 1
  });

  if (error) {
    return NextResponse.json({ code: "SERVER_ERROR", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
