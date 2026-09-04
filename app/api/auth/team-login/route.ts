import { NextResponse } from "next/server";
import { z } from "zod";
import { createTeamSession } from "@/lib/team-session";
import { supabaseAdmin } from "@/lib/supabase/admin";

const Payload = z.object({
  code: z.string().regex(/^\d{4}$/),
  fullBitsId: z.string().trim().min(4).max(40).optional()
});

export async function POST(request: Request) {
  const parsed = Payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { code: "INVALID_LOGIN", message: "Enter a valid four-digit code." },
      { status: 400 }
    );
  }

  const eventId = process.env.NEXT_PUBLIC_EVENT_ID;
  if (!eventId) return NextResponse.json({ message: "Event not configured." }, { status: 500 });

  const supabase = supabaseAdmin();

  let query = supabase
    .from("teams")
    .select("id, leader_bits_id, login_code, session_version, status")
    .eq("event_id", eventId)
    .eq("login_code", parsed.data.code);

  const { data: matches, error } = await query;

  if (error) return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });

  const active = (matches ?? []).filter((t) => t.status !== "DISQUALIFIED");

  if (active.length === 0) {
    return NextResponse.json(
      { code: "INVALID_LOGIN", message: "No registered team matches that code." },
      { status: 401 }
    );
  }

  let team = active[0];

  if (active.length > 1) {
    if (!parsed.data.fullBitsId) {
      return NextResponse.json(
        { code: "LOGIN_COLLISION", message: "Full BITS ID required." },
        { status: 409 }
      );
    }

    const target = parsed.data.fullBitsId.toUpperCase();
    const exact = active.filter((t) => t.leader_bits_id === target);

    if (exact.length !== 1) {
      return NextResponse.json(
        { code: "INVALID_LOGIN", message: "The details do not match a registered team." },
        { status: 401 }
      );
    }

    team = exact[0];
  }

  await createTeamSession({
    teamId: team.id,
    sessionVersion: team.session_version
  });

  return NextResponse.json({ ok: true });
}
