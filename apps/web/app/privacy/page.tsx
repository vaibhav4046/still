import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export default function PrivacyPage() {
  return (
    <AppShell>
      <div className="public-page legal-page">
        <div className="public-page-header">
          <div>
            <span className="eyebrow">Data Protection &amp; Capability Boundary</span>
            <h1>Privacy &amp; Synthetic Data Notice</h1>
            <p>
              How STILL isolates synthetic demonstration records and enforces capability-gated readback by default.
            </p>
          </div>
          <div className="public-route-note">
            <span className="route-kicker">Policy</span>
            <strong>/privacy</strong>
            <span>P0-01 enforced</span>
          </div>
        </div>

        <section className="booking-card legal-card">
          <h2>1. Synthetic Environment Scope</h2>
          <p>
            STILL is an open-source reference system built for the GitLab Transcend hackathon. All advising services
            (&ldquo;Advice appointment&rdquo; and &ldquo;Study planning session&rdquo;) and appointment slots are
            synthetic. Visitors should enter fictional names and synthetic email addresses (such as{" "}
            <code>alex@example.edu</code>) when testing the booking flows on <code>/book</code> or <code>/simple</code>.
          </p>

          <h2>2. Capability-Gated Readback (P0-01 Security Control)</h2>
          <p>
            When a booking is created via <code>POST /api/v1/bookings</code>, the server issues an HMAC-SHA256
            capability token (<code>cap_...</code>) bound to the booking identifier. Subsequent reads to{" "}
            <code>GET /api/v1/booking/[id]</code> require the <code>x-booking-capability</code> HTTP header and verify
            it using constant-time comparison (<code>crypto.timingSafeEqual</code>). Requests with a missing, empty, or
            mismatched capability receive <code>401 Unauthorized</code> with <code>Cache-Control: no-store</code> and
            never expose attendee fields.
          </p>

          <h2>3. Operator Telemetry Redaction</h2>
          <p>
            Public operator endpoints (<code>/api/v1/operator/timeline</code>, <code>/api/v1/operator/summary</code>,{" "}
            <code>/api/v1/operator/incidents</code>) log only confirmation references (e.g.,{" "}
            <code>STILL-4F92A1</code>), slot identifiers, and timestamps. Attendee names and email addresses are never
            written to the public audit timeline.
          </p>

          <div className="legal-actions">
            <Link className="secondary-button" href="/">
              Return to Continuity Console
            </Link>
            <Link className="primary-button" href="/simple">
              Open Accessible Booking (/simple)
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
