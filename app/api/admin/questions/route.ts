import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

const CreateQuestion = z.object({
  questionNumber: z.number().int().positive(),
  title: z.string().max(120).nullable().optional(),
  questionText: z.string().min(1),
  mediaUrl: z.string().url().nullable().optional().or(z.literal("")),
  acceptedAnswers: z.array(z.string().min(1)).min(1)
});

const UpdateQuestion = z.object({
  questionNumber: z.number().int().positive(),
  title: z.string().max(120).nullable().optional(),
  questionText: z.string().min(1).optional(),
  mediaUrl: z.string().url().nullable().optional().or(z.literal("")),
  acceptedAnswers: z.array(z.string().min(1)).min(1).optional(),
  validationMode: z.enum(["EXACT_NORMALIZED", "MULTIPLE_ACCEPTED", "OPTIONAL_FUZZY"]).optional(),
  isActive: z.boolean().optional()
});

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const eventId = process.env.NEXT_PUBLIC_EVENT_ID;
  const { data, error } = await supabaseAdmin()
    .from("questions")
    .select("id, question_number, title, question_text, media_url, accepted_answers, validation_mode, is_active")
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
    media_url: parsed.data.mediaUrl || null,
    accepted_answers: parsed.data.acceptedAnswers,
    validation_mode: "EXACT_NORMALIZED",
    is_active: true
  });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  await supabaseAdmin().from("audit_logs").insert({
    admin_id: admin.user.id,
    action: "QUESTION_CREATED",
    question_id: null,
    metadata: { questionNumber: parsed.data.questionNumber }
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

// Edit an existing question by question_number — the "real question editor"
// organizers use to update clue text/media/accepted answers close to event time
// without any code or schema change.
export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const parsed = UpdateQuestion.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Invalid question update." }, { status: 400 });

  const eventId = process.env.NEXT_PUBLIC_EVENT_ID;
  const supabase = supabaseAdmin();

  const { data: existing } = await supabase
    .from("questions")
    .select("*")
    .eq("event_id", eventId)
    .eq("question_number", parsed.data.questionNumber)
    .maybeSingle();

  if (!existing) return NextResponse.json({ message: "Question not found." }, { status: 404 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.questionText !== undefined) patch.question_text = parsed.data.questionText;
  if (parsed.data.mediaUrl !== undefined) patch.media_url = parsed.data.mediaUrl || null;
  if (parsed.data.acceptedAnswers !== undefined) patch.accepted_answers = parsed.data.acceptedAnswers;
  if (parsed.data.validationMode !== undefined) patch.validation_mode = parsed.data.validationMode;
  if (parsed.data.isActive !== undefined) patch.is_active = parsed.data.isActive;

  const { error } = await supabase
    .from("questions")
    .update(patch)
    .eq("event_id", eventId)
    .eq("question_number", parsed.data.questionNumber);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  await supabase.from("audit_logs").insert({
    admin_id: admin.user.id,
    action: "QUESTION_UPDATED",
    question_id: existing.id,
    metadata: { questionNumber: parsed.data.questionNumber, patch }
  });

  return NextResponse.json({ ok: true });
}
