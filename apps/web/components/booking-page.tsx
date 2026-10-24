import Link from "next/link";
import { AppShell } from "./app-shell";
import { BookingFlow } from "./booking-flow";

export function BookingPage({ mode }: { mode: "primary" | "simple" }) {
  const simple = mode === "simple";
  return (
    <AppShell>
      <div className={`public-page${simple ? " public-page-simple" : ""}`} data-reveal="true">
        <div className="public-page-header">
          <div>
            <span className="eyebrow">{simple ? "01 / High-Accessibility Booking" : "01 / Student Advising Appointment"}</span>
            <h1>{simple ? "Reserve without the noise." : "Reserve a university advice session."}</h1>
            <p>
              {simple ? (
                <>
                  A high-contrast, keyboard-first booking path conforming to{" "}
                  <span className="kimi-underline">WCAG 2.1 AA</span> with{" "}
                  <span className="kimi-underline">100% capacity and confirmation parity</span>.
                </>
              ) : (
                <>
                  Select an available appointment time with your academic advisor. Bookings are instantly confirmed with{" "}
                  <span className="kimi-underline">transactional PostgreSQL capacity locking</span>.
                </>
              )}
            </p>
          </div>
          <div className="public-route-note hover-zoom-card">
            <span className="route-kicker">Path</span>
            <strong>{simple ? "/simple" : "/book"}</strong>
            <span>{simple ? "accessible fallback" : "interactive view"}</span>
          </div>
        </div>
        <BookingFlow simpleMode={simple} />
        <div className="fallback-callout hover-zoom-card">
          <span>{simple ? "Prefer the interactive calendar view?" : "Experiencing keyboard or screen-reader interaction issues?"}</span>
          <Link href={simple ? "/book" : "/simple"}>{simple ? "Switch to interactive booking" : "Use the simple path (accessible fallback)"} →</Link>
        </div>
      </div>
    </AppShell>
  );
}
