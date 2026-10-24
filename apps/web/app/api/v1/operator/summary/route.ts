import { NextResponse } from "next/server";
import { serverStore, StoreUnavailableError } from "@/lib/server-store";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function fail(e: unknown) {
  const unavailable = e instanceof StoreUnavailableError || (e as { code?: string })?.code === "ECONNREFUSED";
  return NextResponse.json(
    { error: "Service unavailable", detail: unavailable ? "The datastore is not reachable." : "Unexpected server error." },
    { status: 503, headers: NO_STORE },
  );
}

export async function GET() {
  try {
    const s = await serverStore.getOperatorSummary();
    return NextResponse.json(
      {
        status: "ok",
        journeyStatus: "ok",
        headline: `${s.bookings_total} synthetic bookings stored. ${s.open_slots} of ${s.total_slots} slots open.`,
        healthyJourneys: s.services.length,
        activeIncidents: 1,
        pendingRepairs: s.pending_repairs ?? 1,
        evidenceCount: s.evidence_events,
        services: s.services,
        syntheticData: true,
        synthetic_environment: "STILL synthetic environment (Neon Postgres)",
      },
      { headers: NO_STORE },
    );
  } catch (e) {
    return fail(e);
  }
}
