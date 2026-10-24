import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

export async function GET() {
  return NextResponse.json(
    {
      policies: [
        {
          id: "capability-readback",
          name: "Booking readback needs capability",
          status: "enforced",
          description: "GET /api/v1/booking/:id returns 401 unless the exact HMAC capability issued at creation is presented.",
        },
        {
          id: "atomic-capacity",
          name: "Atomic slot capacity",
          status: "enforced",
          description: "Capacity decrement, booking insert and idempotency record commit in one Postgres transaction.",
        },
        {
          id: "trusted-memory-provenance",
          name: "Verified lesson provenance & sanitizer",
          status: "enforced",
          description:
            "Only CI-verified trusted lessons pass into repair context; unverified candidates and prompt-injection payloads are rejected.",
        },
        {
          id: "human-release-gate",
          name: "Human approval before production promotion",
          status: "enforced",
          description:
            "GitLab Duo candidate repairs (MR !1) require passing CI plus explicit human approval before production merge.",
        },
      ],
    },
    { headers: NO_STORE },
  );
}
