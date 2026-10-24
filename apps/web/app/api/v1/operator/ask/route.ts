import { NextResponse } from "next/server";
import { serverStore, StoreUnavailableError } from "@/lib/server-store";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
function fail(e: unknown) {
  const unavailable = e instanceof StoreUnavailableError || (e as { code?: string })?.code === "ECONNREFUSED";
  return NextResponse.json({ error: "Service unavailable", detail: unavailable ? "The datastore is not reachable." : "Unexpected server error." }, { status: 503, headers: NO_STORE });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question = String(body.question || body.query || body.prompt || "").trim();
    if (!question) return NextResponse.json({ error: "Question cannot be empty." }, { status: 400, headers: NO_STORE });
    const s = await serverStore.getOperatorSummary();
    const answer = `This is a fixed readout, not a language model. ${s.bookings_total} synthetic bookings are stored, ${s.open_slots} of ${s.total_slots} slots are open, and ${s.evidence_events} events are logged.`;
    return NextResponse.json({ answer, question, timestamp: new Date().toISOString() }, { headers: NO_STORE });
  } catch (e) { return fail(e); }
}

