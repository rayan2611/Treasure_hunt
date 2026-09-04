import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

const CreateQuestion = z.object({
  questionNumber: z.number().int().positive(),
  title: z.string().max(120).nullable().optional(),
  questionText: z.string().min(1),
  mediaUrl: z.string().url().nullable().optional(),
  acceptedAnswers: z.array(z.string().min(1)).min(1)
});

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const eventId = process.env.NEXT_PUBLIC_EVENT_ID;
  const { data, error } = await supabaseAdmin()
    .from("questions")
    .select("id, question_number, title, question_text, media_url, accepted_answers, is_active")
    .eq("event_id", eventId)
    .order("question_number");

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ questions: data ?? [] });
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const parsed = CreateQuestion.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Invalid question." }, { status: 400 });

  const eventId = process.env.NEXT_PUBLIC_EVENT_ID;
  const { error } = await supabaseAdmin().from("questions").insert({
    event_id: eventId,
    question_number: parsed.data.questionNumber,
    title: parsed.data.title ?? null,
    question_text: parsed.data.questionText,
    media_url: parsed.data.mediaUrl ?? null,
    accepted_answers: parsed.data.acceptedAnswers,
    validation_mode: "EXACT_NORMALIZED",
    is_active: true
  });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
