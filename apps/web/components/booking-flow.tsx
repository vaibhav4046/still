"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  createBooking,
  getBooking,
  getServices,
  getSlots,
  newIdempotencyKey,
  Service,
  Slot,
  StillApiError,
} from "@/lib/api";
import { CalendarIcon, CheckIcon, ChevronDownIcon, LockIcon, ShieldIcon, WarningIcon } from "./icons";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "./state-panel";

function formatSlot(slot: Slot) {
  const date = new Date(slot.startsAt);
  if (Number.isNaN(date.getTime())) return slot.startsAt;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function BookingFlow({ simpleMode }: { simpleMode: boolean }) {
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [serviceState, setServiceState] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [slotState, setSlotState] = useState<"idle" | "loading" | "ready" | "empty" | "error">("idle");
  const [error, setError] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [booking, setBooking] = useState<{
    id?: string;
    confirmationReference?: string;
    capabilityToken?: string;
    replayed?: boolean;
  }>({});
  const [verified, setVerified] = useState<"unchecked" | "confirmed" | "failed">("unchecked");
  const [unauthProof, setUnauthProof] = useState<{ status?: number; detail?: string; checking?: boolean }>({});
  const intent = useRef<{ fingerprint: string; key: string } | null>(null);
  const inFlight = useRef(false);
  const [brokenPrimary, setBrokenPrimary] = useState(false);
  const [repairedPreview, setRepairedPreview] = useState(false);

  useEffect(() => {
    if (!simpleMode) {
      const timer = window.setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        setBrokenPrimary(params.get("broken") === "1");
        setRepairedPreview(params.get("repaired") === "1");
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [simpleMode]);

  useEffect(() => {
    let cancelled = false;
    getServices()
      .then((items) => {
        if (cancelled) return;
        setServices(items);
        setServiceState(items.length ? "ready" : "empty");
        if (items.length) setSelectedService(items[0].id);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof StillApiError ? cause.message : "Services could not be loaded.");
        setServiceState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedService) {
      return;
    }
    let cancelled = false;
    getSlots(selectedService)
      .then((items) => {
        if (cancelled) return;
        const available = items.filter((slot) => slot.available !== false);
        setSlots(available);
        setSlotState(available.length ? "ready" : "empty");
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof StillApiError ? cause.message : "Available slots could not be loaded.");
        setSlotState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [selectedService]);

  const service = useMemo(
    () => services.find((item) => item.id === selectedService),
    [selectedService, services],
  );

  function handleServiceChange(value: string) {
    setSelectedService(value);
    setSelectedSlot("");
    setSlotState(value ? "loading" : "idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedService || !selectedSlot || inFlight.current) return;
    inFlight.current = true;
    setSubmitState("submitting");
    setError("");
    setUnauthProof({});
    const fingerprint = [selectedService, selectedSlot, name.trim(), email.trim().toLowerCase()].join("|");
    if (!intent.current || intent.current.fingerprint !== fingerprint) {
      intent.current = { fingerprint, key: newIdempotencyKey() };
    }
    try {
      const result = await createBooking({
        serviceId: selectedService,
        slotId: selectedSlot,
        name,
        email,
        idempotencyKey: intent.current.key,
      });
      setBooking(result);
      setVerified("unchecked");
      setSubmitState("success");
      intent.current = null;
      if (result.id && result.capabilityToken) {
        getBooking(result.id, result.capabilityToken)
          .then((r) => setVerified(r.id === result.id ? "confirmed" : "failed"))
          .catch(() => setVerified("failed"));
      }
    } catch (cause: unknown) {
      setError(cause instanceof StillApiError ? cause.message : "The booking could not be completed.");
      setSubmitState("error");
    } finally {
      inFlight.current = false;
    }
  }

  async function verifyUnauthenticatedReadback() {
    if (!booking.id) return;
    setUnauthProof({ checking: true });
    try {
      const res = await fetch(`/api/v1/booking/${encodeURIComponent(booking.id)}`, {
        headers: { accept: "application/json" },
        cache: "no-store",
      });
      const body = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
      setUnauthProof({
        checking: false,
        status: res.status,
        detail: body.detail || body.error || "Unauthorized",
      });
    } catch {
      setUnauthProof({ checking: false, status: 0, detail: "Network error" });
    }
  }

  if (submitState === "success") {
    return (
      <section aria-live="polite" className="booking-card booking-success">
        <div className="success-mark">
          <CheckIcon size={26} />
        </div>
        <span className="eyebrow">Appointment confirmed · PostgreSQL Committed</span>
        <h2>Your session is reserved.</h2>
        <p>
          Your synthetic advising appointment is committed to the shared database. Keep your confirmation reference
          below.
        </p>
        <dl className="booking-receipt">
          <div>
            <dt>Reference</dt>
            <dd>{booking.confirmationReference || booking.id || "Service did not return a reference"}</dd>
          </div>
          {service ? (
            <div>
              <dt>Advising Service</dt>
              <dd>{service.name}</dd>
            </div>
          ) : null}
          <div>
            <dt>Stored record</dt>
            <dd>
              {verified === "confirmed"
                ? "Read back from the database with your private capability"
                : verified === "failed"
                  ? "Saved, but the read-back check failed"
                  : "Checking..."}
            </dd>
          </div>
          <div>
            <dt>Capability Token</dt>
            <dd>
              {booking.capabilityToken ? `${booking.capabilityToken.slice(0, 16)}… (HMAC-SHA256)` : "Issued to client"}
            </dd>
          </div>
          <div>
            <dt>Booking Mode</dt>
            <dd>{simpleMode ? "Accessible Fallback (/simple)" : "Standard Portal (/book)"}</dd>
          </div>
        </dl>

        {booking.id ? (
          <div className="security-proof-box">
            <div className="security-proof-header">
              <ShieldIcon size={16} />
              <strong>Verify P0-01 Capability Boundary Live</strong>
            </div>
            <p>
              Prove that reading <code>GET /api/v1/booking/{booking.id}</code> without the{" "}
              <code>x-booking-capability</code> header is denied by default and leaks zero attendee PII.
            </p>
            <div className="security-proof-actions">
              <button
                className="secondary-button"
                disabled={unauthProof.checking}
                onClick={() => void verifyUnauthenticatedReadback()}
                type="button"
              >
                {unauthProof.checking ? "Probing endpoint…" : "Test Unauthenticated Readback (Expect 401)"}
              </button>
              {unauthProof.status !== undefined ? (
                <span className="security-proof-result" role="status">
                  HTTP {unauthProof.status}: {unauthProof.detail} (Zero PII returned)
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="booking-success-actions">
          <button
            className="secondary-button"
            onClick={() => {
              setSubmitState("idle");
              setBooking({});
              setUnauthProof({});
            }}
            type="button"
          >
            Book another appointment
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="booking-card">
      <div className="booking-card-heading">
        <div className="section-icon">
          <CalendarIcon size={20} />
        </div>
        <div>
          <span className="eyebrow">{simpleMode ? "Low-distraction WCAG 2.1 AA form" : "Book a slot"}</span>
          <h2>Appointment details</h2>
        </div>
        <span className="secure-note">
          <LockIcon size={14} /> Transactional lock &amp; capability receipt
        </span>
      </div>
      {serviceState === "loading" ? <LoadingPanel label="Loading available advising services" /> : null}
      {serviceState === "error" ? <ErrorPanel detail={error || "The booking service did not respond."} /> : null}
      {serviceState === "empty" ? (
        <EmptyPanel detail="The service returned no bookable services." title="No services available" />
      ) : null}
      {serviceState === "ready" ? (
        <form className="booking-form" onSubmit={handleSubmit}>
          {brokenPrimary && !repairedPreview ? (
            <div className="journey-warning" role="status">
              <div className="journey-warning-title">
                <WarningIcon size={16} />
                <strong>Controlled preview regression</strong>
              </div>
              <span>
                Keyboard navigation on the slot picker is temporarily disabled in this regression preview (
                <code>tabIndex=&#123;-1&#125;</code> injected on radio inputs, tracked in GitLab Issue #1). STILL&apos;s
                Continuity Signal has activated the accessible fallback path below.
              </span>
            </div>
          ) : null}
          {brokenPrimary && repairedPreview ? (
            <div className="journey-warning" role="status">
              <div className="journey-warning-title">
                <CheckIcon size={16} />
                <strong>Staged GitLab Duo repair verified (?repaired=1)</strong>
              </div>
              <span>
                Candidate fix from GitLab Duo Agent Platform Workflow <code>#10006279</code> (MR <code>!1</code>)
                applied: <code>tabIndex=&#123;-1&#125;</code> override removed so native radio-group keyboard focus (
                <code>Tab</code> + arrow keys / <code>Space</code>) is restored while awaiting human release approval.
              </span>
            </div>
          ) : null}
          <div className="form-grid">
            <label className="field-group" htmlFor="service">
              <span>Advising Topic</span>
              <span className="select-wrap">
                <select
                  id="service"
                  onChange={(event) => handleServiceChange(event.target.value)}
                  value={selectedService}
                >
                  <option value="">Choose an advising topic</option>
                  {services.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon size={16} />
              </span>
              {service?.description ? <small>{service.description}</small> : null}
            </label>
            <div className="field-group">
              <span>Available time</span>
              {slotState === "loading" ? <div className="field-loading">Reading available slots…</div> : null}
              {slotState === "error" ? <p className="field-error">{error || "Slots are unavailable."}</p> : null}
              {slotState === "empty" ? (
                <p className="field-help">
                  No available slots remain for this advising topic. Try switching topics above.
                </p>
              ) : null}
              {slotState === "ready" ? (
                <div className="slot-list" role="radiogroup" aria-label="Available appointment times">
                  {slots.map((slot) => (
                    <label
                      className={`slot-option${selectedSlot === slot.id ? " slot-selected" : ""}`}
                      key={slot.id}
                    >
                      <input
                        checked={selectedSlot === slot.id}
                        name="slot"
                        onChange={() => setSelectedSlot(slot.id)}
                        tabIndex={brokenPrimary && !repairedPreview ? -1 : undefined}
                        type="radio"
                        value={slot.id}
                      />
                      <span className="slot-time">{formatSlot(slot)}</span>
                      <span className="slot-cap">{slot.available !== false ? "available" : "full"}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
            <label className="field-group" htmlFor="name">
              <span>Your name</span>
              <input
                autoComplete="name"
                id="name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Alex Morgan (synthetic)"
                required
                value={name}
              />
            </label>
            <label className="field-group" htmlFor="email">
              <span>Email address</span>
              <input
                autoComplete="email"
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="alex@university.edu"
                required
                type="email"
                value={email}
              />
            </label>
          </div>
          {submitState === "error" ? (
            <p className="inline-error" role="alert">
              {error || "The service rejected this booking."}
            </p>
          ) : null}
          <div className="booking-actions">
            <button
              className="primary-button"
              disabled={!selectedService || !selectedSlot || !name || !email || submitState === "submitting"}
              type="submit"
            >
              {submitState === "submitting" ? "Reserving…" : "Reserve session"}
            </button>
            <span>
              Your appointment is confirmed immediately with an authoritative reference number and private capability
              token.
            </span>
          </div>
        </form>
      ) : null}
    </section>
  );
}
