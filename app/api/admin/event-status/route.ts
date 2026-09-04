import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

const Payload = z.object({
  status: z.enum(["DRAFT", "REGISTRATION", "LIVE", "PAUSED", "ENDED"]),
  registrationOpen: z.boolean().optional()
});

export async function POST(request: Request) {
  const adminCtx = await requireAdmin(request);
  if (!adminCtx) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const parsed = Payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Invalid status." }, { status: 400 });

  const eventId = process.env.NEXT_PUBLIC_EVENT_ID;
  const supabase = supabaseAdmin();

  const { data: before } = await supabase.from("events").select("*").eq("id", eventId).maybeSingle();

  const patch: Record<string, unknown> = {
    status: parsed.data.status,
    updated_at: new Date().toISOString()
  };

  if (typeof parsed.data.registrationOpen === "boolean") {
    patch.registration_open = parsed.data.registrationOpen;
  }

  if (parsed.data.status === "LIVE" && !before?.hunt_start_time) {
    patch.hunt_start_time = new Date().toISOString();
  }
  if (parsed.data.status === "ENDED") {
    patch.hunt_end_time = new Date().toISOString();
  }

  const { error } = await supabase.from("events").update(patch).eq("id", eventId);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  await supabase.from("audit_logs").insert({
    admin_id: adminCtx.user.id,
    action: "EVENT_STATUS_CHANGED",
    metadata: { from: before?.status, to: parsed.data.status }
  });

  return NextResponse.json({ ok: true });
}
