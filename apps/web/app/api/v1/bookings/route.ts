import { NextRequest, NextResponse } from "next/server";
import { serverStore, StoreUnavailableError } from "@/lib/server-store";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };

export async function POST(request: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid booking request", detail: "Body must be JSON." }, { status: 400, headers: NO_STORE });
  }
  const idempotencyKey = request.headers.get("idempotency-key") || request.headers.get("x-idempotency-key") || body.idempotency_key || undefined;

  try {
    const result = await serverStore.createBooking({
      service_id: body.service_id || body.serviceId,
      slot_id: body.slot_id || body.slotId,
      name: body.name || body.attendee_name || "",
      email: body.email || body.attendee_email || "",
      idempotency_key: idempotencyKey,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error, detail: result.error }, { status: result.status, headers: NO_STORE });
    }
    const { booking, replayed } = result;
    return NextResponse.json(
      {
        id: booking.id,
        service_id: booking.service_id,
        service_name: booking.service_name,
        slot_id: booking.slot_id,
        attendee_name: booking.attendee_name,
        attendee_email: booking.attendee_email,
        status: booking.status,
        confirmation_reference: booking.confirmation_reference,
        starts_at: booking.starts_at,
        capability_token: booking.confirmation_code,
        replayed,
      },
      { status: replayed ? 200 : 201, headers: { ...NO_STORE, "x-booking-capability": booking.confirmation_code } },
    );
  } catch (e) {
    const unavailable = e instanceof StoreUnavailableError;
    return NextResponse.json(
      { error: "Service unavailable", detail: unavailable ? "The datastore is not reachable." : "Unexpected server error." },
      { status: 503, headers: NO_STORE },
    );
  }
}
