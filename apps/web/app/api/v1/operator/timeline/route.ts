import { NextResponse } from "next/server";
import { serverStore, StoreUnavailableError } from "@/lib/server-store";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
function fail(e: unknown) {
  const unavailable = e instanceof StoreUnavailableError || (e as { code?: string })?.code === "ECONNREFUSED";
  return NextResponse.json({ error: "Service unavailable", detail: unavailable ? "The datastore is not reachable." : "Unexpected server error." }, { status: 503, headers: NO_STORE });
}

export async function GET() {
  try { return NextResponse.json({ timeline: await serverStore.getTimeline() }, { headers: NO_STORE }); }
  catch (e) { return fail(e); }
}

