import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export default function TermsPage() {
  return (
    <AppShell>
      <div className="public-page legal-page">
        <div className="public-page-header">
          <div>
            <span className="eyebrow">Open-Source Governance &amp; Terms</span>
            <h1>Terms of Use &amp; MIT License</h1>
            <p>
              Service guarantees, transactional invariants, and open-source licensing for the STILL continuity system.
            </p>
          </div>
          <div className="public-route-note">
            <span className="route-kicker">License</span>
            <strong>MIT</strong>
            <span>open source</span>
          </div>
        </div>

        <section className="booking-card legal-card">
          <h2>1. Purpose &amp; Non-Production Advisory</h2>
          <p>
            This deployment demonstrates resilient public-sector and university appointment booking continuity across a
            primary route (<code>/book</code>) and a WCAG 2.1 AA fallback route (<code>/simple</code>). It does not
            schedule real academic advising sessions.
          </p>

          <h2>2. Verifiable Transactional Invariants (P0-02)</h2>
          <p>
            All bookings execute inside a PostgreSQL transaction guarded by <code>pg_advisory_xact_lock</code> on the
            client&apos;s <code>Idempotency-Key</code>. Slot capacity is decremented atomically via{" "}
            <code>UPDATE slots SET remaining_capacity = remaining_capacity - 1 WHERE id = $1 AND remaining_capacity &gt; 0</code>.
            Concurrent requests for the final seat yield exactly one <code>201 Created</code> winner and deterministic{" "}
            <code>409 Conflict</code> responses for contenders.
          </p>

          <h2>3. MIT License</h2>
          <p>
            Source code, contracts, and GitLab CI flows are licensed under the MIT License and published at{" "}
            <a
              className="inline-link"
              href="https://gitlab.com/vaibhav.lalwani/still"
              rel="noopener noreferrer"
              target="_blank"
            >
              gitlab.com/vaibhav.lalwani/still
            </a>
            .
          </p>

          <div className="legal-actions">
            <Link className="secondary-button" href="/">
              Return to Continuity Console
            </Link>
            <Link className="primary-button" href="/book">
              Open Primary Booking (/book)
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
