import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { serverStore } from "@/lib/server-store";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

// Synthetic-data reset for judges and CI. Requires STILL_ADMIN_TOKEN; never exposed without it.
export async function POST(request: Request) {
  const expected = process.env.STILL_ADMIN_TOKEN || "";
  const given = (request.headers.get("authorization") || "").replace(/^Bearer /, "");
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }
  try {
    await serverStore.resetSyntheticData();
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503, headers: NO_STORE });
  }
}
