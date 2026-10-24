import { NextRequest, NextResponse } from "next/server";
import { serverStore, StoreUnavailableError } from "@/lib/server-store";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Unknown id, absent capability and wrong capability all return the same 401.
    const booking = await serverStore.getBookingWithCapability(id, request.headers.get("x-booking-capability"));
    if (!booking) {
      return NextResponse.json({ error: "Unauthorized", detail: "A valid booking capability is required." }, { status: 401, headers: NO_STORE });
    }
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
      },
      { headers: NO_STORE },
    );
  } catch (e) {
    const unavailable = e instanceof StoreUnavailableError;
    return NextResponse.json(
      { error: "Service unavailable", detail: unavailable ? "The datastore is not reachable." : "Unexpected server error." },
      { status: 503, headers: NO_STORE },
    );
  }
}
