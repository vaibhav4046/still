import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

export async function GET() {
  return NextResponse.json({ services: serverStore.getServices() }, { headers: NO_STORE });
}

