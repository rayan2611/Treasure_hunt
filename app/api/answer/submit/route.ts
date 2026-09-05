import { NextResponse } from "next/server";

// This flow has been retired in favor of QR checkpoint scanning
// (see app/api/checkpoint/scan and app/api/checkpoint/verify-code).
// Hard-fail rather than leaving a live alternate path to progress.
export async function POST() {
  return NextResponse.json(
    {
      code: "ANSWER_SUBMISSION_REPLACED",
      message: "This flow has been replaced by QR checkpoint scanning."
    },
    { status: 410 }
  );
}
