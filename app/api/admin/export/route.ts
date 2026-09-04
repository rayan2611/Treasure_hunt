import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

function csvEscape(value: unknown) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Admin-only CSV export of final standings, per backend spec section 15
// (adminExportResults). Ordered by the same deterministic leaderboard rule:
// questions_completed desc, last_completed_at asc, registered_at asc.
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const eventId = process.env.NEXT_PUBLIC_EVENT_ID;
  const { data, error } = await supabaseAdmin()
    .from("teams")
    .select("team_name, questions_completed, status, finished_at, registered_at, last_completed_at")
    .eq("event_id", eventId)
    .order("questions_completed", { ascending: false })
    .order("last_completed_at", { ascending: true, nullsFirst: false })
    .order("registered_at", { ascending: true });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const rows = (data ?? []).filter((t) => t.status !== "DISQUALIFIED");

  const header = ["rank", "team_name", "questions_completed", "status", "finished_at", "registered_at"];
  const lines = [header.join(",")];

  rows.forEach((row, index) => {
    lines.push(
      [
        index + 1,
        csvEscape(row.team_name),
        row.questions_completed,
        row.status,
        csvEscape(row.finished_at ?? ""),
        csvEscape(row.registered_at ?? "")
      ].join(",")
    );
  });

  const csv = lines.join("\n");

  await supabaseAdmin().from("audit_logs").insert({
    admin_id: admin.user.id,
    action: "RESULTS_EXPORTED",
    metadata: { rowCount: rows.length }
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="treasure-hunt-results-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}
