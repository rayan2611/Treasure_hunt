import { NextResponse } from "next/server";
import { z } from "zod";
import { createTeamSession } from "@/lib/team-session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isValidPin } from "@/lib/validation";

// Teams log back in with team name / mobile number / BITS ID (any one) plus
// the 4-digit PIN they chose at registration.
const Payload = z.object({
  identifier: z.string().trim().min(1).max(80),
  pin: z.string().trim().length(4)
});

export async function POST(request: Request) {
  const parsed = Payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isValidPin(parsed.data.pin)) {
    return NextResponse.json(
      { code: "INVALID_LOGIN", message: "Enter your team name, mobile number or BITS ID, plus your 4-digit PIN." },
      { status: 400 }
    );
  }

  const eventId = process.env.NEXT_PUBLIC_EVENT_ID;
  if (!eventId) return NextResponse.json({ message: "Event not configured." }, { status: 500 });

  const supabase = supabaseAdmin();

  // Escape commas so a stray "," in the identifier can't break the .or() filter syntax.
  const identifier = parsed.data.identifier.replace(/,/g, "");
  const bitsIdCandidate = identifier.toUpperCase();

  const { data: matches, error } = await supabase
    .from("teams")
    .select("id, session_version, status")
    .eq("event_id", eventId)
    .eq("login_code", parsed.data.pin)
    .or(`team_name.ilike.${identifier},contact_number.eq.${identifier},leader_bits_id.eq.${bitsIdCandidate}`);

  if (error) return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });

  const active = (matches ?? []).filter((t) => t.status !== "DISQUALIFIED");

  if (active.length === 0) {
    return NextResponse.json(
      { code: "INVALID_LOGIN", message: "No registered team matches those details." },
      { status: 401 }
    );
  }

  if (active.length > 1) {
    return NextResponse.json(
      { code: "LOGIN_COLLISION", message: "That matched more than one team — enter your full BITS ID instead." },
      { status: 409 }
    );
  }

  const team = active[0];

  await createTeamSession({
    teamId: team.id,
    sessionVersion: team.session_version
  });

  return NextResponse.json({ ok: true });
}
