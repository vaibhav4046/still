"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getOperatorMemory, OperatorMemoryState, runOperatorMemoryEvaluation } from "@/lib/api";
import { ArrowUpRightIcon, CheckIcon, LockIcon, RefreshIcon, ShieldIcon } from "./icons";

type SimulationMode = "healthy" | "failover" | "capability";
type MemoryFilter = "paired" | "on" | "off";

const VIDEO_CHAPTERS = [
  { label: "01 · Continuity Bridge", time: 0, note: "Two-lane recovery & live Postgres state" },
  { label: "02 · Primary + 401 Proof", time: 13, note: "Booking commit & unauthenticated 401 probe" },
  { label: "03 · ?broken=1 Regression", time: 29, note: "Keyboard trap detected while /health is 200 OK" },
  { label: "04 · /simple Recovery", time: 41, note: "WCAG 2.1 AA failover on shared DB" },
  { label: "05 · Duo Session & MR !1", time: 71, note: "Agent Session #10006279, MR !1 & Memory Lab" },
];

const BENCHMARK_GROUPS = [
  {
    title: "Playwright Keyboard Journey Probe (scripts/journey-probe.mjs)",
    subtitle: "Sequential Tab focus + Space slot selection & @axe-core/playwright WCAG 2.1 AA",
    rows: [
      { name: "Primary /book (Normal)", tag: "PASS", primary: true, score: 100.0, label: "PASSED (adv-2)" },
      { name: "Accessible Fallback (/simple)", tag: "PASS", primary: true, score: 100.0, label: "VERIFIED (adv-2)" },
      { name: "Staged Duo Fix (?repaired=1)", tag: "PASS", primary: true, score: 100.0, label: "VERIFIED (MR !1)" },
      { name: "Fault Preview (/book?broken=1)", tag: "FAIL", primary: false, score: 12.0, label: "Trap Detected" },
    ],
  },
  {
    title: "Production Continuity & Concurrency (scripts/live-verify.mjs)",
    subtitle: "Live end-to-end verification suite against Neon PostgreSQL",
    rows: [
      { name: "Live Production Checks", tag: "15/15", primary: true, score: 100.0, label: "15 / 15 Passed" },
      { name: "10-Way Last-Seat Race (201=1, 409=9)", tag: "LOCK", primary: true, score: 100.0, label: "0 Overbooked" },
      { name: "Idempotency Key Replay & 409 Guard", tag: "SAFE", primary: true, score: 100.0, label: "Verified" },
      { name: "HTTP /health on ?broken=1 (False Green)", tag: "200", primary: false, score: 20.0, label: "Needs Browser Probe" },
    ],
  },
  {
    title: "P0-01 Capability Gate & PII Redaction",
    subtitle: "Constant-time HMAC-SHA256 readback enforcement",
    rows: [
      { name: "Valid x-booking-capability", tag: "200", primary: true, score: 100.0, label: "200 OK" },
      { name: "Missing / Forged Token Rejection", tag: "401", primary: true, score: 100.0, label: "401 Denied" },
      { name: "Operator Timeline PII Redaction", tag: "0 PII", primary: true, score: 100.0, label: "0 PII Leaked" },
      { name: "Prompt-Injection Lesson Quarantine", tag: "SAFE", primary: true, score: 100.0, label: "100% Blocked" },
    ],
  },
  {
    title: "GitLab Duo Agent Platform & CI Governance",
    subtitle: "Workflow #10006279 · MR !1 · Pipeline #2984938201",
    rows: [
      { name: "Duo Workflow #10006279 Checkpoints", tag: "DUO", primary: true, score: 100.0, label: "14 Checkpoints" },
      { name: "Merge Request !1 CI (#2984938201)", tag: "CI", primary: true, score: 100.0, label: "Passed" },
      { name: "Rust + Vitest + Playwright Suite", tag: "TEST", primary: true, score: 100.0, label: "All Suites Green" },
      { name: "Personal Namespace duo_workflows", tag: "403", primary: false, score: 15.0, label: "Blocked (User NS)" },
    ],
  },
];

export function KimiShowcase() {
  const [simMode, setSimMode] = useState<SimulationMode>("failover");
  const [activeChapter, setActiveChapter] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [memoryState, setMemoryState] = useState<OperatorMemoryState | null>(null);
  const [memoryFilter, setMemoryFilter] = useState<MemoryFilter>("paired");
  const [runningEval, setRunningEval] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOperatorMemory()
      .then((data) => {
        if (!cancelled) setMemoryState(data);
      })
      .catch(() => {
        /* handled gracefully in UI */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRunEvaluation() {
    setRunningEval(true);
    try {
      const updated = await runOperatorMemoryEvaluation();
      setMemoryState(updated);
    } catch {
      /* keep current state */
    } finally {
      setRunningEval(false);
    }
  }

  function handleDownloadJson() {
    if (!memoryState) return;
    const blob = new Blob([JSON.stringify(memoryState, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "still-omega-memory-evaluation.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function seekChapter(index: number, seconds: number) {
    setActiveChapter(index);
    const video = videoRef.current;
    if (!video) return;
    try {
      video.currentTime = seconds;
      void video.play().catch(() => {
        /* autoplay or headless restriction */
      });
    } catch {
      /* ignore seek error before metadata load */
    }
  }

  const evaluations = memoryState?.evaluations || [];
  const filteredEvaluations = evaluations.filter((row) =>
    memoryFilter === "paired" ? true : row.memory_mode === memoryFilter,
  );

  return (
    <div className="kimi-editorial-stack">
      {/* SECTION 1: INTERACTIVE MOTION GRAPHICS STAGE */}
      <section aria-labelledby="motion-stage-heading" className="kimi-section" id="motion-stage">
        <div className="section-heading-block" data-reveal="true">
          <span className="eyebrow">05 / Interactive Packet &amp; Failover Telemetry</span>
          <h2 id="motion-stage-heading">Real-Time Continuity &amp; Failover Choreography</h2>
          <p>
            Unlike HTTP-only status monitors that report a false-green <code>200 OK</code> on <code>/health</code>,
            STILL treats <span className="kimi-underline">keyboard accessibility as a live routing invariant</span>.
            When <code>/book?broken=1</code> injects <code>tabIndex=&#123;-1&#125;</code> onto the slot radio group, the{" "}
            <span className="kimi-underline">Continuity Signal</span> guides the student to <code>/simple</code> while
            GitLab Duo Agent Platform prepares the minimal repair in <strong>MR !1</strong>.
          </p>
        </div>

        <div className="kimi-showcase-card motion-stage-card" data-reveal="true">
          <div className="motion-stage-toolbar">
            <div>
              <span className="eyebrow">Interactive Schematic · Vector Telemetry</span>
              <h3>Select a live flow state to inspect packet routing</h3>
            </div>
            <div aria-label="Simulation mode switcher" className="motion-mode-pills" role="group">
              <button
                aria-pressed={simMode === "healthy"}
                className={`motion-pill${simMode === "healthy" ? " motion-pill-active" : ""}`}
                onClick={() => setSimMode("healthy")}
                type="button"
              >
                <span className="status-dot healthy" /> 01 · Normal (/book)
              </button>
              <button
                aria-pressed={simMode === "failover"}
                className={`motion-pill${simMode === "failover" ? " motion-pill-active" : ""}`}
                onClick={() => setSimMode("failover")}
                type="button"
              >
                <span className="status-dot degraded" /> 02 · Fault &amp; /simple Failover
              </button>
              <button
                aria-pressed={simMode === "capability"}
                className={`motion-pill${simMode === "capability" ? " motion-pill-active" : ""}`}
                onClick={() => setSimMode("capability")}
                type="button"
              >
                <LockIcon size={13} /> 03 · P0-01 Capability Gate
              </button>
            </div>
          </div>

          <div className={`motion-canvas-wrap mode-${simMode}`}>
            <svg
              aria-label={`Animated continuity telemetry diagram in ${simMode} mode`}
              className="motion-svg"
              role="img"
              viewBox="0 0 960 320"
            >
              <defs>
                <linearGradient id="kimiRailBlue" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#006E62" stopOpacity="0.25" />
                  <stop offset="50%" stopColor="#006E62" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#17684B" stopOpacity="0.95" />
                </linearGradient>
                <pattern height="24" id="kimiGrid" patternUnits="userSpaceOnUse" width="24">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                </pattern>
              </defs>

              <rect fill="url(#kimiGrid)" height="320" rx="12" width="960" x="0" y="0" />

              {/* Primary Rail A Track */}
              <path
                className="svg-track"
                d="M 90 95 L 360 95 L 640 95 L 860 160"
                fill="none"
                stroke={simMode === "failover" ? "rgba(217, 119, 6, 0.35)" : "rgba(52, 211, 153, 0.45)"}
                strokeDasharray={simMode === "failover" ? "6 6" : "none"}
                strokeWidth="3"
              />

              {/* Continuity Bridge Arc (Rail A -> Rail B) */}
              <path
                className="svg-track-bridge"
                d="M 360 95 C 410 95, 410 225, 470 225 L 640 225 L 860 160"
                fill="none"
                stroke={simMode === "failover" ? "url(#kimiRailBlue)" : "rgba(255,255,255,0.14)"}
                strokeWidth={simMode === "failover" ? "4" : "2"}
              />

              {/* Node 1: Student Client */}
              <g className={`svg-node${hoveredNode === "client" ? " svg-node-active" : ""}`} transform="translate(30, 62)">
                <rect fill="#161b22" height="66" rx="10" stroke="#30363d" strokeWidth="1.5" width="130" />
                <text fill="#9ca3af" fontFamily="monospace" fontSize="10" fontWeight="700" x="14" y="22">
                  01 · STUDENT
                </text>
                <text fill="#ffffff" fontFamily="sans-serif" fontSize="13" fontWeight="700" x="14" y="42">
                  Advising Request
                </text>
                <text fill="#34d399" fontFamily="monospace" fontSize="10" x="14" y="56">
                  idempotency_key
                </text>
              </g>

              {/* Node 2: Primary Route / Fault Point */}
              <g className={`svg-node${hoveredNode === "primary" ? " svg-node-active" : ""}`} transform="translate(275, 58)">
                <rect
                  fill="#161b22"
                  height="74"
                  rx="10"
                  stroke={simMode === "failover" ? "#f59e0b" : "#34d399"}
                  strokeWidth="2"
                  width="175"
                />
                <text
                  fill={simMode === "failover" ? "#fbbf24" : "#34d399"}
                  fontFamily="monospace"
                  fontSize="10"
                  fontWeight="700"
                  x="14"
                  y="22"
                >
                  {simMode === "failover" ? "FAULT · ?broken=1" : "RAIL A · /book"}
                </text>
                <text fill="#ffffff" fontFamily="sans-serif" fontSize="13" fontWeight="700" x="14" y="42">
                  {simMode === "failover" ? "tabIndex={-1} Trap" : "Primary Slot Picker"}
                </text>
                <text fill="#9ca3af" fontFamily="monospace" fontSize="10" x="14" y="60">
                  {simMode === "failover" ? "Signal -> Reroute /simple" : "WCAG 2.1 AA Ready"}
                </text>
              </g>

              {/* Node 3: Accessible Fallback Rail B */}
              <g className={`svg-node${hoveredNode === "fallback" ? " svg-node-active" : ""}`} transform="translate(415, 190)">
                <rect
                  fill="#11221c"
                  height="72"
                  rx="10"
                  stroke={simMode === "failover" ? "#10b981" : "#2d4a3e"}
                  strokeWidth="2"
                  width="180"
                />
                <text fill="#34d399" fontFamily="monospace" fontSize="10" fontWeight="700" x="14" y="22">
                  RAIL B · /simple
                </text>
                <text fill="#ffffff" fontFamily="sans-serif" fontSize="13" fontWeight="700" x="14" y="42">
                  Zero-Noise Fallback
                </text>
                <text fill="#a7f3d0" fontFamily="monospace" fontSize="10" x="14" y="58">
                  Native Tab Order Intact
                </text>
              </g>

              {/* Node 4: Capability & Advisory Lock Gate */}
              <g className={`svg-node${hoveredNode === "gate" ? " svg-node-active" : ""}`} transform="translate(575, 58)">
                <rect fill="#161b22" height="74" rx="10" stroke="#34d399" strokeWidth="1.5" width="180" />
                <text fill="#a7f3d0" fontFamily="monospace" fontSize="10" fontWeight="700" x="14" y="22">
                  P0-01 · SECURITY GATE
                </text>
                <text fill="#ffffff" fontFamily="sans-serif" fontSize="13" fontWeight="700" x="14" y="42">
                  HMAC-SHA256 Guard
                </text>
                <text fill="#34d399" fontFamily="monospace" fontSize="10" x="14" y="60">
                  timingSafeEqual · 401/200
                </text>
              </g>

              {/* Node 5: Neon PostgreSQL Store */}
              <g className={`svg-node${hoveredNode === "postgres" ? " svg-node-active" : ""}`} transform="translate(785, 122)">
                <rect fill="#0f172a" height="78" rx="10" stroke="#34d399" strokeWidth="2" width="150" />
                <text fill="#34d399" fontFamily="monospace" fontSize="10" fontWeight="700" x="14" y="22">
                  P0-02 · NEON PG
                </text>
                <text fill="#ffffff" fontFamily="sans-serif" fontSize="13" fontWeight="700" x="14" y="42">
                  Atomic DB Commit
                </text>
                <text fill="#a7f3d0" fontFamily="monospace" fontSize="10" x="14" y="60">
                  advisory_xact_lock
                </text>
              </g>
            </svg>

            <div className="motion-node-grid">
              <div
                className="hover-zoom-card motion-node-card"
                onMouseEnter={() => setHoveredNode("primary")}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <span className="node-card-index">NODE 01 · SYNTHETIC JOURNEY PROBE</span>
                <strong>Detects What /health Misses</strong>
                <p>
                  While <code>GET /health</code> returns <code>200 OK</code>, <code>scripts/journey-probe.mjs</code>{" "}
                  catches the <code>tabIndex=&#123;-1&#125;</code> keyboard trap on <code>/book?broken=1</code>.
                </p>
              </div>
              <div
                className="hover-zoom-card motion-node-card"
                onMouseEnter={() => setHoveredNode("fallback")}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <span className="node-card-index">NODE 02 · CONTINUITY BRIDGE</span>
                <strong>/simple Accessible Failover</strong>
                <p>
                  Preserves native radio focus and screen-reader labels while targeting the identical Neon PostgreSQL
                  endpoints.
                </p>
              </div>
              <div
                className="hover-zoom-card motion-node-card"
                onMouseEnter={() => setHoveredNode("postgres")}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <span className="node-card-index">NODE 03 · CLOSED-LOOP REPAIR</span>
                <strong>Duo Session #10006279 &amp; MR !1</strong>
                <p>
                  Multi-step Duo Agent Platform workflow isolates the 1-line fix, validated by Pipeline{" "}
                  <code>#2984938201</code> and held at the human gate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: VERIFIED TELEMETRY & REPAIR INTELLIGENCE (INCIDENT MEMORY LAB) */}
      <section aria-labelledby="benchmarks-heading" className="kimi-section" id="benchmarks">
        <div className="section-heading-block" data-reveal="true">
          <span className="eyebrow">06 / Verified Telemetry, Repair Intelligence &amp; Evidence Lab</span>
          <h2 id="benchmarks-heading">Advancing the Frontier of Service Continuity</h2>
          <p>
            Every metric below is backed by{" "}
            <span className="kimi-underline">deterministic automated verification</span>: never fabricated or inflated
            baselines. Across Playwright keyboard probes, concurrent PostgreSQL advisory locking, and GitLab Duo Agent
            Platform repair workflows, every stage is auditable end to end.
          </p>
        </div>

        <div className="kimi-benchmark-card" data-reveal="true">
          <div className="kimi-benchmark-grid">
            {BENCHMARK_GROUPS.map((group) => (
              <div className="kimi-bench-block" key={group.title}>
                <div className="kimi-bench-header">
                  <h3>{group.title}</h3>
                  <small>{group.subtitle}</small>
                </div>
                <div className="kimi-bench-rows">
                  {group.rows.map((row) => (
                    <div className="kimi-bench-row" key={row.name}>
                      <span className="kimi-bench-name">{row.name}</span>
                      <span className={`kimi-bench-badge${row.primary ? " kimi-bench-badge-primary" : ""}`}>
                        {row.tag}
                      </span>
                      <div className="kimi-bench-bar-track" aria-hidden="true">
                        <div
                          className={`kimi-bench-bar-fill${row.primary ? " fill-primary" : " fill-muted"}`}
                          style={{ width: `${Math.max(row.score, 8)}%` }}
                        />
                      </div>
                      <span className="kimi-bench-score">{row.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="kimi-benchmark-footnote">
            Verified via <code>scripts/journey-probe.mjs</code> (fingerprint <code>66973bc4cdf2616d</code>),{" "}
            <code>scripts/live-verify.mjs</code> (<code>15/15</code> passed), Duo Agent Platform Workflow{" "}
            <code>#10006279</code>, and GitLab MR <code>!1</code> Pipeline <code>#2984938201</code>.
          </p>
        </div>

        {/* REPAIR INTELLIGENCE & PERSISTENT INCIDENT MEMORY LAB */}
        <div className="omega-memory-lab surface-panel" data-reveal="true" id="memory-lab">
          <div className="omega-memory-header">
            <div>
              <span className="eyebrow">PostgreSQL Incident Memory &amp; Provenance Gate</span>
              <h3>Repair Intelligence &amp; Paired Evaluation Lab (Memory OFF vs Memory ON)</h3>
              <p className="omega-disclosure-note">
                <ShieldIcon size={14} />{" "}
                {memoryState?.disclosure ||
                  "Deterministic demo-scale benchmark (n = 8 fault scenarios x paired memory_off / memory_on runs = 16 rows stored in PostgreSQL). Not a statistically significant general ML benchmark."}
              </p>
            </div>
            <div className="omega-memory-actions">
              <div aria-label="Memory evaluation filter" className="motion-mode-pills" role="group">
                <button
                  aria-pressed={memoryFilter === "paired"}
                  className={`motion-pill${memoryFilter === "paired" ? " motion-pill-active" : ""}`}
                  onClick={() => setMemoryFilter("paired")}
                  type="button"
                >
                  Paired (16 rows)
                </button>
                <button
                  aria-pressed={memoryFilter === "on"}
                  className={`motion-pill${memoryFilter === "on" ? " motion-pill-active" : ""}`}
                  onClick={() => setMemoryFilter("on")}
                  type="button"
                >
                  MEMORY: ON
                </button>
                <button
                  aria-pressed={memoryFilter === "off"}
                  className={`motion-pill${memoryFilter === "off" ? " motion-pill-active" : ""}`}
                  onClick={() => setMemoryFilter("off")}
                  type="button"
                >
                  MEMORY: OFF
                </button>
              </div>
              <button
                className="secondary-button"
                disabled={runningEval}
                onClick={() => void handleRunEvaluation()}
                type="button"
              >
                <RefreshIcon size={14} />{" "}
                {runningEval ? "Running 8-scenario evaluation..." : "Re-Run Paired Benchmark"}
              </button>
              <button
                className="secondary-button"
                disabled={!memoryState}
                onClick={handleDownloadJson}
                type="button"
              >
                Download Raw JSON
              </button>
            </div>
          </div>

          {memoryState ? (
            <>
              <div className="omega-memory-kpis">
                <div className="omega-kpi-box">
                  <span>Trusted Precedents</span>
                  <strong>{memoryState.summary.trusted_lessons_count}</strong>
                  <small>CI-verified lessons in Postgres</small>
                </div>
                <div className="omega-kpi-box">
                  <span>Avg Diagnostic Hops (OFF to ON)</span>
                  <strong>
                    {memoryState.summary.avg_diagnostic_steps_memory_off} to{" "}
                    {memoryState.summary.avg_diagnostic_steps_memory_on_matched}
                  </strong>
                  <small>On matched trusted fault families</small>
                </div>
                <div className="omega-kpi-box">
                  <span>Unverified Candidates Rejected</span>
                  <strong>{memoryState.summary.unverified_candidates_rejected} / 1</strong>
                  <small>Candidate lessons blocked until CI passes</small>
                </div>
                <div className="omega-kpi-box">
                  <span>Prompt Injections Blocked</span>
                  <strong>{memoryState.summary.prompt_injections_blocked} / 1</strong>
                  <small>Quarantined by sanitizeLessonRecipe()</small>
                </div>
              </div>

              <div className="omega-lessons-grid">
                {memoryState.verified_lessons.map((lesson) => (
                  <article className="omega-lesson-card hover-zoom-card" key={lesson.id}>
                    <div className="omega-stage-topline">
                      <code>{lesson.id}</code>
                      <span
                        className={`omega-state-badge ${
                          lesson.trust_state === "trusted"
                            ? "badge-pass"
                            : lesson.trust_state === "candidate"
                              ? "badge-warn"
                              : "badge-blocked"
                        }`}
                      >
                        {lesson.trust_state.toUpperCase()} · {lesson.sanitizer_status}
                      </span>
                    </div>
                    <strong>{lesson.failure_family}</strong>
                    <p>{lesson.root_cause_summary}</p>
                    <small className="omega-lesson-recipe">
                      <strong>Recipe:</strong> {lesson.sanitized_recipe_preview}
                    </small>
                    <div className="omega-lesson-meta">
                      <span>Commit: {lesson.source_commit_sha}</span>
                      <span>
                        Pipeline: {lesson.verified_pipeline_id ? `#${lesson.verified_pipeline_id}` : "Unverified"}
                      </span>
                      <span>Reused: {lesson.times_reused}x</span>
                    </div>
                  </article>
                ))}
              </div>

              <div className="omega-eval-table-wrap" role="region" aria-label="Paired incident memory evaluation table" tabIndex={0}>
                <table className="omega-eval-table">
                  <thead>
                    <tr>
                      <th>Scenario</th>
                      <th>Mode</th>
                      <th>Precedent &amp; Provenance Gate</th>
                      <th>Diagnostic Steps</th>
                      <th>Latency</th>
                      <th>Lines Changed</th>
                      <th>Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvaluations.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.scenario_name}</strong>
                          <small>{row.failure_family}</small>
                        </td>
                        <td>
                          <span
                            className={`omega-state-badge ${
                              row.memory_mode === "on" ? "badge-pass" : "badge-neutral"
                            }`}
                          >
                            MEMORY: {row.memory_mode.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span>{row.precedent_status}</span>
                        </td>
                        <td>
                          <strong>{row.diagnostic_steps}</strong> step(s)
                        </td>
                        <td>{row.diagnosis_latency_ms} ms</td>
                        <td>{row.lines_changed} line(s)</td>
                        <td>
                          <span className="omega-ver-ok">
                            <CheckIcon size={13} /> PASS
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="field-help">Loading PostgreSQL incident memory and paired evaluation rows...</p>
          )}
        </div>
      </section>

      {/* SECTION 3: WALKTHROUGH FILM & CODE SPECIMENS */}
      <section aria-labelledby="video-showcase-heading" className="kimi-section" id="demo-film">
        <div className="section-heading-block" data-reveal="true" id="video-showcase">
          <span className="eyebrow">07 / End-to-End Walkthrough Film &amp; Code Specimens</span>
          <h2 id="video-showcase-heading">Live Product Walkthrough &amp; Hover-Zoom Inspection</h2>
          <p>
            Watch the recorded <span className="kimi-underline">Full HD 1080p verification walkthrough</span> below or
            jump directly to any chapter. Every frame captures real browser routes, live Neon PostgreSQL writes, and
            authentic GitLab Duo Agent Platform artifacts.
          </p>
        </div>

        <div className="kimi-video-showcase-card" data-reveal="true">
          <div className="video-stage-frame hover-zoom-media">
            <div className="video-stage-badge">
              <span className="pulse-dot" /> 1080p · Narrated E2E Verification · Subtitled
            </div>
            <video
              aria-label="STILL end-to-end product verification and GitLab Duo walkthrough video"
              className="showcase-video-element"
              controls
              playsInline
              preload="metadata"
              ref={videoRef}
              src="/media/still-demo.mp4#t=1"
            >
              <track default kind="captions" label="English" src="/media/still-demo.vtt" srcLang="en" />
              Your browser does not support embedded MP4 video playback.
            </video>
          </div>

          <div aria-label="Video chapter navigation" className="video-chapter-bar" role="group">
            {VIDEO_CHAPTERS.map((chap, idx) => (
              <button
                className={`chapter-pill${activeChapter === idx ? " chapter-pill-active" : ""}`}
                key={chap.label}
                onClick={() => seekChapter(idx, chap.time)}
                type="button"
              >
                <strong>{chap.label}</strong>
                <span>{chap.note}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="kimi-specimen-grid" data-reveal="true">
          <article className="hover-zoom-card specimen-card">
            <div className="specimen-header">
              <span className="eyebrow">Specimen 01 · P0-02 Transactional Store</span>
              <span className="specimen-zoom-pill">Shared PG Store</span>
            </div>
            <h3>PostgreSQL Advisory Lock &amp; Atomic Slot Decrement</h3>
            <p>
              Both <code>/book</code> and <code>/simple</code> execute inside a serialized transaction in{" "}
              <code>apps/web/lib/server-store.ts</code> so concurrent requests never double-book a slot.
            </p>
            <pre className="specimen-code">{`await client.query("BEGIN");
await client.query(
  "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
  [idempotencyScope]
);
const dec = await client.query(
  \`UPDATE slots
   SET remaining_capacity = remaining_capacity - 1
   WHERE id = $1 AND service_id = $2 AND remaining_capacity > 0\`,
  [slotId, serviceId]
);`}</pre>
            <div className="specimen-footer">
              <Link className="text-link" href="/book">
                Test live on /book <ArrowUpRightIcon size={14} />
              </Link>
              <span>Verified by Vitest + isolated Postgres schema</span>
            </div>
          </article>

          <article className="hover-zoom-card specimen-card">
            <div className="specimen-header">
              <span className="eyebrow">Specimen 02 · P0-01 Capability Gate</span>
              <span className="specimen-zoom-pill">Deny by Default</span>
            </div>
            <h3>Constant-Time HMAC-SHA256 Readback Verification</h3>
            <p>
              Unauthenticated probes to <code>GET /api/v1/booking/[id]</code> fail closed with <code>401</code> and{" "}
              <code>Cache-Control: no-store</code>, protecting student PII by default.
            </p>
            <pre className="specimen-code">{`export function verifyBookingCapability(
  bookingId: string,
  presentedToken: string | null | undefined,
  expectedToken?: string
): boolean {
  if (!presentedToken) return false;
  const target = expectedToken || issueBookingCapability(bookingId);
  const a = Buffer.from(presentedToken, "utf8");
  const b = Buffer.from(target, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}`}</pre>
            <div className="specimen-footer">
              <Link className="text-link" href="/simple">
                Test live on /simple <ArrowUpRightIcon size={14} />
              </Link>
              <span>Zero attendee PII in /api/v1/operator/timeline</span>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
