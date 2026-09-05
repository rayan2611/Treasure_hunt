import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireAdmin } from "@/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Returns one QR data-URL per checkpoint, encoding the phone-camera fallback
// URL (https://<origin>/scan?c=<checkpoint_secret>). The admin dashboard
// renders these into a print-friendly sheet (window.print()) — this route
// never exposes the riddle text or accepted-answer-equivalent, only the
// scan link and an internal "Clue N" reference label.
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const eventId = process.env.NEXT_PUBLIC_EVENT_ID;
  const { data: questions, error } = await supabaseAdmin()
    .from("questions")
    .select("id, question_number, checkpoint_secret")
    .eq("event_id", eventId)
    .order("question_number");

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const origin = new URL(request.url).origin;

  const sheet = await Promise.all(
    (questions ?? []).map(async (q) => {
      const url = `${origin}/scan?c=${encodeURIComponent(q.checkpoint_secret)}`;
      const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 320 });
      return {
        questionId: q.id,
        questionNumber: q.question_number,
        label: `Checkpoint ${q.question_number}`,
        url,
        qrDataUrl
      };
    })
  );

  return NextResponse.json({ checkpoints: sheet });
}
