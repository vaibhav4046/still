import { NextResponse } from "next/server";
import { serverStore, StoreUnavailableError } from "@/lib/server-store";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
function fail(e: unknown) {
  const unavailable = e instanceof StoreUnavailableError || (e as { code?: string })?.code === "ECONNREFUSED";
  return NextResponse.json({ error: "Service unavailable", detail: unavailable ? "The datastore is not reachable." : "Unexpected server error." }, { status: 503, headers: NO_STORE });
}

export async function GET() {
  const checked_at = new Date().toISOString();
  try {
    const db = await serverStore.health();
    return NextResponse.json({
      status: "ok",
      service: "still-web",
      checked_at,
      runtime_started_at: db.runtime_started_at,
      persistence: { backend: db.backend, durable: true, latency_ms: db.latency_ms, durability_verified_at: null },
      synthetic_data: true,
      services: serverStore.getServices(),
    }, { headers: NO_STORE });
  } catch (e) {
    const r = fail(e);
    return r;
  }
}

