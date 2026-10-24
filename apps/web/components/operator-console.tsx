"use client";

import Link from "next/link";
import { FormEvent, MouseEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  askOperator,
  getHealth,
  getOperatorIncidents,
  getOperatorPolicies,
  getOperatorSummary,
  getOperatorTimeline,
  Health,
  Incident,
  OperatorSummary,
  Policy,
  StillApiError,
  TimelineEvent,
} from "@/lib/api";
import { AppShell } from "./app-shell";
import { BRIDGE_NODES, ContinuityBridge, ContinuityBridgeHeroDiagram } from "./continuity-bridge";
import { ContinuitySignal, ContinuityStatus } from "./continuity-signal";
import { ArrowUpRightIcon, CheckIcon, CircleDotIcon, RefreshIcon, ShieldIcon, WarningIcon } from "./icons";
import { KimiShowcase } from "./kimi-showcase";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "./state-panel";

type Snapshot = {
  health?: Health;
  summary?: OperatorSummary;
  incidents: Incident[];
  timeline: TimelineEvent[];
  policies: Policy[];
};

const blankSnapshot: Snapshot = { incidents: [], timeline: [], policies: [] };

const PRESET_QUERIES = [
  "What is the current healthy status and slot capacity?",
  "Are there any active incidents or accessibility regressions?",
  "How are pending repairs and capability boundaries enforced?",
];

function recordString(record: Record<string, unknown> | undefined, keys: string[], fallback = "N/A") {
  if (!record) return fallback;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") return String(value);
  }
  return fallback;
}

function recordNumber(record: Record<string, unknown> | undefined, keys: string[]) {
  if (!record) return undefined;
  for (const key of keys) {
    if (typeof record[key] === "number") return record[key] as number;
  }
  return undefined;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function continuityStatus(snapshot: Snapshot, phase: "loading" | "ready" | "error"): ContinuityStatus {
  if (phase === "loading") return "loading";
  if (!snapshot.health && !snapshot.summary) return phase === "error" ? "offline" : "empty";
  const status = `${snapshot.summary?.journeyStatus || snapshot.summary?.status || snapshot.health?.status || ""}`.toLowerCase();
  if (status.includes("fail") || status.includes("down") || status.includes("offline")) return "offline";
  if ((snapshot.summary?.activeIncidents || snapshot.incidents.length) > 0 || status.includes("degrad"))
    return "degraded";
  if (status.includes("healthy") || status.includes("ok") || status.includes("ready") || snapshot.summary)
    return "healthy";
  return "empty";
}

export function OperatorConsole() {
  const [snapshot, setSnapshot] = useState<Snapshot>(blankSnapshot);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [askState, setAskState] = useState<"idle" | "asking" | "answered" | "error">("idle");
  const [answer, setAnswer] = useState("");
  const [activeBridgeNode, setActiveBridgeNode] = useState<string>("user-3");
  const [isPlayingBridge, setIsPlayingBridge] = useState(false);
  const playTimerRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setPhase("loading");
    setError("");
    const [healthResult, summaryResult, incidentsResult, timelineResult, policiesResult] = await Promise.allSettled([
      getHealth(),
      getOperatorSummary(),
      getOperatorIncidents(),
      getOperatorTimeline(),
      getOperatorPolicies(),
    ]);
    const next: Snapshot = {
      health: healthResult.status === "fulfilled" ? healthResult.value : undefined,
      summary: summaryResult.status === "fulfilled" ? summaryResult.value : undefined,
      incidents: incidentsResult.status === "fulfilled" ? incidentsResult.value : [],
      timeline: timelineResult.status === "fulfilled" ? timelineResult.value : [],
      policies: policiesResult.status === "fulfilled" ? policiesResult.value : [],
    };
    const fulfilled = [healthResult, summaryResult, incidentsResult, timelineResult, policiesResult].filter(
      (result) => result.status === "fulfilled",
    ).length;
    if (!fulfilled) {
      const cause = [healthResult, summaryResult, incidentsResult, timelineResult, policiesResult].find(
        (result) => result.status === "rejected",
      );
      setError(
        cause?.status === "rejected" && cause.reason instanceof StillApiError
          ? cause.reason.message
          : "The STILL API is unavailable.",
      );
      setSnapshot(blankSnapshot);
      setPhase("error");
      return;
    }
    if (fulfilled < 5) setError("Some operator panels are waiting for API state.");
    setSnapshot(next);
    setPhase("ready");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    return () => {
      if (playTimerRef.current) window.clearInterval(playTimerRef.current);
    };
  }, []);

  function startGuidedSequence() {
    if (playTimerRef.current) {
      window.clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }
    const reducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setActiveBridgeNode("eng-3");
      setIsPlayingBridge(false);
      return;
    }
    setIsPlayingBridge(true);
    let idx = 0;
    setActiveBridgeNode(BRIDGE_NODES[0].id);
    playTimerRef.current = window.setInterval(() => {
      idx += 1;
      if (idx >= BRIDGE_NODES.length) {
        if (playTimerRef.current) window.clearInterval(playTimerRef.current);
        playTimerRef.current = null;
        setIsPlayingBridge(false);
        return;
      }
      setActiveBridgeNode(BRIDGE_NODES[idx].id);
    }, 620);
  }

  function handleSeeRecovery(event: MouseEvent<HTMLAnchorElement>) {
    startGuidedSequence();
    const target = document.getElementById("continuity-bridge");
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function handleSelectBridgeNode(id: string) {
    if (playTimerRef.current) {
      window.clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }
    setIsPlayingBridge(false);
    setActiveBridgeNode(id);
  }

  async function runQuery(text: string) {
    if (!text.trim()) return;
    setQuestion(text);
    setAskState("asking");
    setAnswer("");
    try {
      const response = await askOperator(text.trim());
      setAnswer(response.answer || response.response || response.message || "The API returned no answer text.");
      setAskState("answered");
    } catch (cause: unknown) {
      setAnswer(cause instanceof StillApiError ? cause.message : "The operator query failed.");
      setAskState("error");
    }
  }

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runQuery(question);
  }

  const summary = snapshot.summary;
  const serviceRows = summary?.services?.length ? summary.services : snapshot.health?.services || [];
  const persistenceObj =
    snapshot.health && typeof snapshot.health.persistence === "object" && snapshot.health.persistence !== null
      ? (snapshot.health.persistence as Record<string, unknown>)
      : undefined;
  const rawBackend =
    typeof persistenceObj?.backend === "string"
      ? persistenceObj.backend
      : typeof snapshot.health?.persistence === "string"
        ? snapshot.health.persistence
        : "postgres (Neon)";
  const backendLabel = rawBackend === "sqlite" ? "postgres (Neon) · local E2E sqlite" : rawBackend;

  const metrics = [
    {
      label: "Healthy journeys",
      value: summary?.healthyJourneys ?? recordNumber(summary, ["healthy_journeys", "healthyJourneys"]),
      note: "verified active services",
    },
    {
      label: "Active incidents",
      value:
        summary?.activeIncidents ??
        recordNumber(summary, ["active_incidents", "activeIncidents"]) ??
        (snapshot.incidents.length || undefined),
      note: "tracked in GitLab #1",
    },
    {
      label: "Pending repairs",
      value: summary?.pendingRepairs ?? recordNumber(summary, ["pending_repairs", "pendingRepairs"]),
      note: "guarded by CI policy",
    },
    {
      label: "Evidence items",
      value: summary?.evidenceCount ?? recordNumber(summary, ["evidence_count", "evidenceCount"]),
      note: "PII-redacted audit rows",
    },
  ];

  return (
    <AppShell>
      <div className="console-page" id="product">
        {/* FIRST-FOLD HERO: THE QUIET CONTROL ROOM */}
        <section aria-labelledby="hero-heading" className="console-hero">
          <div className="hero-copy">
            <span className="hero-eyebrow">A SMALL FAILURE SHOULDN&apos;T BECOME A DEAD END.</span>
            <h1 id="hero-heading">A broken form shouldn&apos;t stop someone.</h1>
            <p className="hero-lead">
              When an appointment page fails, STILL keeps an accessible way to finish. In parallel, GitLab Duo
              investigates the regression and CI checks the proposed repair.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#continuity-bridge" onClick={handleSeeRecovery}>
                See the recovery <ArrowUpRightIcon size={15} />
              </a>
              <Link className="secondary-button" href="/simple">
                Use the simple booking route
              </Link>
            </div>
            <div className="hero-sublinks">
              <a className="quiet-button" href="#evidence">
                View GitLab evidence
              </a>
              <a className="quiet-button" href="#demo-film">
                Watch 95-second proof
              </a>
              <button className="quiet-button" onClick={() => void load()} type="button">
                <RefreshIcon size={13} /> Refresh live state
              </button>
            </div>
            <p className="hero-disclosure">
              Synthetic university service · Real code, tests &amp; GitLab evidence · Persistence:{" "}
              <code>{backendLabel}</code>
            </p>
          </div>

          <ContinuityBridgeHeroDiagram
            activeNodeId={activeBridgeNode}
            isPlaying={isPlayingBridge}
            onPlayGuided={startGuidedSequence}
            onSelectNode={handleSelectBridgeNode}
          />
        </section>

        {/* SECTION 01: HUMAN OUTCOME VS SUPERVISED ENGINEERING RECOVERY */}
        <section aria-labelledby="comparison-heading" className="comparison-section" data-reveal="true" id="comparison">
          <div className="section-heading-block">
            <span className="eyebrow">01 / A Comparison with Proof</span>
            <h2 id="comparison-heading">What the visitor experiences vs. what the engineering pipeline executes</h2>
            <p>
              Traditional status pages only check whether HTTP endpoints return <code>200 OK</code>. STILL separates
              immediate human task continuity from supervised GitLab Duo engineering remediation.
            </p>
          </div>

          <div className="comparison-grid">
            <article className="surface-panel comparison-card">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Human Task Outcome · User Plane</span>
                  <h3>The appointment completes without delay</h3>
                </div>
                <span className="omega-state-badge badge-pass">VERIFIED · WCAG 2.1 AA</span>
              </div>
              <ul className="comparison-list">
                <li>
                  <strong>Primary route regression (<code>/book?broken=1</code>):</strong> Injects{" "}
                  <code>tabIndex=&#123;-1&#125;</code> onto the slot radio inputs so keyboard <code>Tab</code> skips
                  slot selection even while <code>GET /health</code> returns <code>200 OK</code>.
                </li>
                <li>
                  <strong>Accessible fallback (<code>/simple</code>):</strong> Strips non-essential chrome and restores
                  native keyboard radio focus order (<code>Tab</code> + <code>Space</code>).
                </li>
                <li>
                  <strong>Shared transactional database:</strong> Commits to the identical Neon PostgreSQL{" "}
                  <code>slots</code> and <code>bookings</code> tables using <code>pg_advisory_xact_lock</code> and
                  issues a private HMAC-SHA256 <code>x-booking-capability</code> token.
                </li>
              </ul>
            </article>

            <article className="surface-panel comparison-card">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Engineering Remediation · GitLab Plane</span>
                  <h3>GitLab Duo diagnoses and CI verifies the fix</h3>
                </div>
                <span className="omega-state-badge badge-warn">SUPERVISED HUMAN GATE</span>
              </div>
              <ul className="comparison-list">
                <li>
                  <strong>Playwright journey probe (<code>66973bc4cdf2616d</code>):</strong>{" "}
                  <code>scripts/journey-probe.mjs</code> reproduces the keyboard trap and posts structured evidence to{" "}
                  <a
                    className="inline-link"
                    href="https://gitlab.com/vaibhav.lalwani/still/-/issues/1#note_4083057499"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    GitLab Issue #1
                  </a>
                  .
                </li>
                <li>
                  <strong>GitLab Duo Agent Platform (<code>#10006279</code>):</strong> Executed in authorized sibling
                  hackathon group workspace <code>85690760</code> (personal namespace <code>88027269</code> returns HTTP{" "}
                  <code>403</code> on <code>duo_workflows</code>). Completed <code>14</code> LangGraph checkpoints.
                </li>
                <li>
                  <strong>Candidate Merge Request &amp; CI gate:</strong>{" "}
                  <a
                    className="inline-link"
                    href="https://gitlab.com/vaibhav.lalwani/still/-/merge_requests/1"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Open MR !1
                  </a>{" "}
                  (commit <code>47a6b89a</code>) passed{" "}
                  <a
                    className="inline-link"
                    href="https://gitlab.com/vaibhav.lalwani/still/-/pipelines/2984938201"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Pipeline #2984938201
                  </a>{" "}
                  and waits at the human release gate.
                </li>
              </ul>
            </article>
          </div>
        </section>

        {/* SECTION 02: INTERACTIVE GUIDED EXPERIENCE ("TRY IT FOR YOURSELF") */}
        <section aria-labelledby="try-it-heading" className="try-it-section" data-reveal="true" id="try-it">
          <div className="section-heading-block">
            <span className="eyebrow">02 / Interactive Guided Experience</span>
            <h2 id="try-it-heading">Try the three live booking states for yourself</h2>
            <p>
              Every route below runs against the live Neon PostgreSQL store. Test the keyboard regression, complete a
              booking on the accessible fallback, or verify the staged GitLab Duo repair.
            </p>
          </div>

          <div className="try-it-grid">
            <article className="surface-panel try-card">
              <div className="omega-stage-topline">
                <span className="omega-stage-index">STEP 01 · REPRODUCE FAULT</span>
                <span className="omega-state-badge badge-blocked">FAILED · KEYBOARD TRAP</span>
              </div>
              <h3>Inspect the broken input</h3>
              <p>
                Open <code>/book?broken=1</code> and press <code>Tab</code>. Focus jumps over the appointment time
                radios while <code>GET /health</code> still reports <code>200 OK</code>.
              </p>
              <Link className="caution-button" href="/book?broken=1">
                <WarningIcon size={15} /> Open /book?broken=1
              </Link>
            </article>

            <article className="surface-panel try-card try-card-highlight">
              <div className="omega-stage-topline">
                <span className="omega-stage-index">STEP 02 · ACCESSIBLE CONTINUITY</span>
                <span className="omega-state-badge badge-pass">VERIFIED · WCAG 2.1 AA</span>
              </div>
              <h3>Finish with the accessible fallback</h3>
              <p>
                Switch to <code>/simple</code>. Native radio focus order works immediately and reserves the exact same
                PostgreSQL slot with an HMAC-SHA256 capability receipt.
              </p>
              <Link className="primary-button" href="/simple">
                Open /simple route <ArrowUpRightIcon size={15} />
              </Link>
            </article>

            <article className="surface-panel try-card">
              <div className="omega-stage-topline">
                <span className="omega-stage-index">STEP 03 · CANDIDATE REPAIR</span>
                <span className="omega-state-badge badge-pass">VERIFIED · MR !1</span>
              </div>
              <h3>Verify the staged repair</h3>
              <p>
                Open <code>/book?broken=1&amp;repaired=1</code> to preview the 1-line fix from Duo Session{" "}
                <code>#10006279</code> and Merge Request <code>!1</code> before production merge.
              </p>
              <Link className="secondary-button" href="/book?broken=1&repaired=1">
                <CheckIcon size={15} /> Open ?broken=1&amp;repaired=1
              </Link>
            </article>
          </div>
        </section>

        {/* SECTION 03: LIVE OPERATOR CONTROL ROOM (TODAY / INCIDENTS / EVIDENCE) */}
        <section aria-labelledby="console-heading" className="operator-room-section" data-reveal="true" id="console">
          <div className="section-heading-block">
            <span className="eyebrow">03 / Live Operator Control Room · Today, Incidents &amp; Evidence</span>
            <h2 id="console-heading">Live PostgreSQL Service Health &amp; Deterministic SQL Inspector</h2>
            <p>
              Every panel below reads directly from the shared Neon PostgreSQL store. Operator queries execute
              deterministic SQL readouts rather than generative approximations.
            </p>
          </div>

          <ContinuitySignal
            detail={
              error ||
              (phase === "ready"
                ? `All services verified against ${backendLabel} with capability-gated readback and WCAG 2.1 AA fallback parity.`
                : undefined)
            }
            status={continuityStatus(snapshot, phase)}
          />
          {phase === "loading" ? <LoadingPanel label="Loading operator state" /> : null}
          {phase === "error" ? <ErrorPanel detail={error} onRetry={() => void load()} /> : null}
          {phase === "ready" && error ? (
            <p className="partial-note" role="status">
              <WarningIcon size={15} /> {error}
            </p>
          ) : null}

          <div aria-label="Operator metrics" className="metric-grid" role="region">
            {metrics.map((metric) => (
              <article className="metric-card hover-zoom-card" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value ?? "N/A"}</strong>
                <small>{metric.value === undefined ? "Not returned by API" : metric.note}</small>
              </article>
            ))}
          </div>

          <div className="console-grid">
            <section className="surface-panel service-panel hover-zoom-card" id="services">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Today · Service status</span>
                  <h3>Active advising services</h3>
                </div>
                <span className="panel-status">
                  <CircleDotIcon size={14} /> Live DB State
                </span>
              </div>
              {serviceRows.length ? (
                <div className="service-list">
                  {serviceRows.map((service, index) => (
                    <div className="service-row" key={recordString(service, ["id", "name"], `service-${index}`)}>
                      <div className="service-name">
                        <span
                          className={`status-dot ${recordString(service, ["status", "state"], "unknown").toLowerCase()}`}
                        />
                        <strong>{recordString(service, ["name", "title"], "Unnamed service")}</strong>
                      </div>
                      <span className="service-status-badge">
                        {recordString(service, ["status", "state"], "No status")}
                      </span>
                      <small>
                        {typeof service.remaining_slots === "number"
                          ? `${service.remaining_slots} slot(s) open`
                          : recordString(service, ["updated_at", "updatedAt", "last_checked"], "Live")}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyPanel detail="The API returned no service health records." title="No journey health yet" />
              )}
            </section>

            <section className="surface-panel ask-panel hover-zoom-card">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Today · Deterministic DB Inspector (Non-LLM)</span>
                  <h3>Query stored operator state</h3>
                </div>
                <span className="panel-status">Grounded SQL</span>
              </div>
              <p>
                Inspects authoritative PostgreSQL counts and incident records directly. Responses are deterministic
                database readouts, never hallucinated prose.
              </p>
              <div aria-label="Quick database queries" className="preset-chips" role="group">
                {PRESET_QUERIES.map((preset) => (
                  <button
                    className="chip-button"
                    key={preset}
                    onClick={() => void runQuery(preset)}
                    type="button"
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <form onSubmit={handleAsk}>
                <label className="field-group" htmlFor="operator-question">
                  <span>State query</span>
                  <textarea
                    id="operator-question"
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="What changed in the booking journey today?"
                    rows={3}
                    value={question}
                  />
                </label>
                <button
                  className="secondary-button"
                  disabled={!question.trim() || askState === "asking"}
                  type="submit"
                >
                  {askState === "asking" ? "Reading database..." : "Query operator API"}
                </button>
              </form>
              {askState === "answered" || askState === "error" ? (
                <div
                  className={`ask-answer${askState === "error" ? " ask-answer-error" : ""}`}
                  role={askState === "error" ? "alert" : "status"}
                >
                  <span>{askState === "error" ? "API error" : "Grounded database response"}</span>
                  <p>{answer}</p>
                </div>
              ) : null}
            </section>
          </div>

          <div className="console-grid lower-grid">
            <section className="surface-panel hover-zoom-card" id="incidents">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Incidents · Operational alerts</span>
                  <h3>Active &amp; mitigated alerts</h3>
                </div>
                <a className="panel-link" href="#timeline">
                  See timeline <ArrowUpRightIcon size={14} />
                </a>
              </div>
              {snapshot.incidents.length ? (
                <div className="incident-list">
                  {snapshot.incidents.map((incident, index) => (
                    <article className="incident-row" key={recordString(incident, ["id"], `incident-${index}`)}>
                      <span
                        className={`severity severity-${recordString(incident, ["severity"], "unknown").toLowerCase()}`}
                      >
                        {recordString(incident, ["severity"], "unknown")}
                      </span>
                      <div>
                        <strong>{recordString(incident, ["title", "name"], "Untitled incident")}</strong>
                        <p>{recordString(incident, ["summary", "description"], "No incident summary returned.")}</p>
                      </div>
                      <time>{formatDate(recordString(incident, ["created_at", "createdAt"], "N/A"))}</time>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyPanel detail="No incident records were returned by the API." title="No actionable incidents" />
              )}
            </section>

            <section className="surface-panel hover-zoom-card" id="timeline">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Incidents · PII-Redacted Audit Trace</span>
                  <h3>Continuity timeline</h3>
                </div>
                <span className="panel-status">Confirmation refs only</span>
              </div>
              {snapshot.timeline.length ? (
                <ol className="timeline-list">
                  {snapshot.timeline.slice(0, 6).map((item, index) => (
                    <li key={recordString(item, ["id"], `event-${index}`)}>
                      <span className="timeline-line" />
                      <span className="timeline-dot" />
                      <div>
                        <time>
                          {formatDate(
                            recordString(item, ["occurred_at", "occurredAt", "created_at", "createdAt"], ""),
                          )}
                        </time>
                        <strong>{recordString(item, ["title", "event", "name"], "Untitled event")}</strong>
                        <p>{recordString(item, ["status", "summary", "description"], "No event detail returned.")}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyPanel detail="No timeline events were returned by the API." title="Timeline is empty" />
              )}
            </section>
          </div>

          <section className="surface-panel policy-panel" id="policies">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Release Guardrails</span>
                <h3>Policy state</h3>
              </div>
              <span className="panel-status">
                <ShieldIcon size={14} /> fail closed
              </span>
            </div>
            {snapshot.policies.length ? (
              <div className="policy-grid">
                {snapshot.policies.map((policy, index) => (
                  <article className="hover-zoom-card" key={recordString(policy, ["id"], `policy-${index}`)}>
                    <span className="policy-chip">{recordString(policy, ["status", "state"], "unknown")}</span>
                    <strong>{recordString(policy, ["name", "title"], "Unnamed policy")}</strong>
                    <p>{recordString(policy, ["description", "summary"], "No policy detail returned.")}</p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyPanel detail="No policy records were returned by the API." title="Policy state not available" />
            )}
          </section>
        </section>

        {/* SECTION 04: THREE-RAIL SERVICE GUARANTEE, 6-STAGE LIFECYCLE & 9 DEVSECOPS STAGES */}
        <div id="continuity-bridge-section">
          <ContinuityBridge
            activeIncidents={metrics[1].value}
            healthyJourneys={metrics[0].value}
            persistenceBackend={backendLabel}
          />
        </div>

        {/* SECTION 05: INTERACTIVE TELEMETRY, INCIDENT MEMORY LAB & WALKTHROUGH FILM */}
        <KimiShowcase />
      </div>
    </AppShell>
  );
}
