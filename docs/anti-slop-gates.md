# Anti-Slop & Anti-Vibecode 30-Gate Verification Ledger

Every gate below is evaluated against the live deployment (`https://still-continuity.vercel.app`), the codebase (`C:\Users\lalwa\omnirush.ai\still`), and automated test suites (`vitest`, `playwright`, `axe-core`, `cargo test`, `scripts/live-verify.mjs`).

| Gate # | Rule / Requirement | Verdict | Verifiable Evidence |
|---|---|---|---|
| **01** | **No harsh AI gradients** | **PASS** | Removed dark neon purple (`#8768ff`) and radial blurs. Replaced with "Trust & Ink" civic archival paper (`#f5f2eb`), crisp elevated surfaces (`#ffffff`), and recessed technical wells (`#eae5da`) in `apps/web/app/globals.css`. |
| **02** | **No Lucide icon showcase** | **PASS** | Removed decorative `SparkIcon` and orbital constellations. Custom minimal SVG primitives in `apps/web/components/icons.tsx` are used strictly for semantic status, lock, and navigation cues. |
| **03** | **Surface hierarchy (no endless `#FFFFFF`)** | **PASS** | Four-tier tonal system: `--canvas: #f5f2eb`, `--surface: #ffffff`, `--surface-subtle: #f9f7f2`, `--surface-recessed: #eae5da`, plus `#14171a` technical proof drawer. |
| **04** | **Intentional semantic color system** | **PASS** | Deep civic forest (`--accent: #144936`), neutral ink (`#121518`), `--success: #135337`, `--caution: #7a4106`, `--failure: #8f1919`. All text combinations exceed WCAG 2.1 AA/AAA contrast (>7:1). |
| **05** | **Borders over floating drop-shadows** | **PASS** | Hairline `1px solid var(--line)` (`#d2ccc0`) and `4px` semantic left-accents replace heavy floating drop shadows. |
| **06** | **Information-driven layout (not generic 3-card SaaS)** | **PASS** | Asymmetric Hero + Production Invariants Ledger, 3-Rail **Continuity Bridge** schematic (`apps/web/components/continuity-bridge.tsx`), Service Status + Deterministic SQL Inspector, and Incident/Audit split. |
| **07** | **Zero emojis as product design** | **PASS** | Zero decorative emojis in UI components, status badges, or headings. |
| **08** | **Editorial & legible typography** | **PASS** | Georgia serif display headings paired with Inter UI copy and `ui-monospace` (`tabular-nums`) for all capacities, latencies, timestamps, and confirmation references. |
| **09** | **No fake marketing / social-proof filler** | **PASS** | Zero invented testimonials, fake company logos, or inflated SLA percentages. All metrics come live from PostgreSQL or render `—`. |
| **10** | **8-second value proposition clarity** | **PASS** | Hero kicker: *"The form broke. The appointment didn't."* + immediate primary (`/book`), fallback (`/simple`), and fault-injection (`/book?broken=1`) CTAs. |
| **11** | **Interactive product over static brochure** | **PASS** | Live interactive Continuity Bridge, one-click GitLab Duo transcript drawer, deterministic SQL state inspector chips, and live P0-01 `401` capability boundary verifier on booking receipts. |
| **12** | **No fake AI chatbox** | **PASS** | Replaced the generic "Ask advising telemetry" prompt box with a **Deterministic DB Inspector (Non-LLM)** with preset grounded SQL queries. |
| **13** | **Authoritative shared persistence (P0-02)** | **PASS** | Provisioned Neon PostgreSQL (`apps/web/lib/server-store.ts`). `createBooking` runs in a transaction with `pg_advisory_xact_lock` and atomic slot capacity decrement. |
| **14** | **Capability-gated readback (P0-01)** | **PASS** | `GET /api/v1/booking/[id]` requires `x-booking-capability` verified via `crypto.timingSafeEqual` against HMAC-SHA256 tokens (`cap_...`). Missing/wrong/unknown returns `401 Unauthorized` with `Cache-Control: no-store`. |
| **15** | **PII scrubbing on public telemetry** | **PASS** | `/api/v1/operator/timeline` logs only confirmation references (`STILL-...`) and slot IDs; attendee names and emails are never exposed. |
| **16** | **Client idempotency & double-submit safety (P1-03)** | **PASS** | `BookingFlow` pins `intent.current = { fingerprint, key }` across retries of identical input and blocks concurrent clicks with `inFlight.current`. |
| **17** | **Accessible forms & 44px+ touch targets** | **PASS** | All buttons, selects, and radio rows have `min-height: 44px` and `font-size: 1rem` (`16px`). Explicit `<label>` bindings on every control. |
| **18** | **Zero WCAG 2.1 A/AA violations** | **PASS** | Verified by `@axe-core/playwright` (`e2e/accessibility.spec.ts`) across `/`, `/book`, `/simple`, `/privacy`, and `/terms` (`0` violations). |
| **19** | **Responsive across 320px, 768px, 1440px** | **PASS** | Verified by automated Playwright viewport overflow test (`e2e/accessibility.spec.ts`: `scrollWidth <= clientWidth` on all routes at `320px`, `768px`, `1440px`). |
| **20** | **Respects `prefers-reduced-motion`** | **PASS** | `@media (prefers-reduced-motion: reduce)` in `globals.css` collapses all animation and transition durations to `0.01ms`. |
| **21** | **Zero dead links** | **PASS** | Every navigation, footer, and evidence link resolves to a live route (`/`, `/book`, `/simple`, `/privacy`, `/terms`, `/health`) or verified GitLab URL. |
| **22** | **Real Privacy & Terms pages** | **PASS** | Implemented `apps/web/app/privacy/page.tsx` and `apps/web/app/terms/page.tsx` documenting synthetic data scope, P0-01 HMAC capability rules, and MIT license. |
| **23** | **Explicit loading, empty, and error states** | **PASS** | `LoadingPanel`, `EmptyPanel`, and `ErrorPanel` (`apps/web/components/state-panel.tsx`) handle every asynchronous state transition cleanly. |
| **24** | **Controlled regression is honest & recoverable** | **PASS** | `/book?broken=1` sets `tabIndex={-1}` on slot radios, announces the regression via `role="status"`, and links keyboard users directly to `/simple`. |
| **25** | **Rust & Next.js contract parity** | **PASS** | `services/core/src/main.rs` enforces the same strict `401` capability check and idempotency rules (`cargo test --workspace`: `8/8` passing). |
| **26** | **Concurrency & last-seat race proof** | **PASS** | Verified both in Vitest (`12` concurrent requests -> `1` HTTP 201, `11` HTTP 409) and live against Vercel + Neon (`scripts/live-verify.mjs`: `10` concurrent -> `1` HTTP 201, `9` HTTP 409). |
| **27** | **Genuine GitLab Duo execution proof** | **PASS** | Executed real GitLab Duo GraphQL `aiAction` / `aiMessages` on Issue #1 (`requestId: cc7e274a-16f1-4445-91a1-d93cdf03a68f`, Assistant Message `68a0693c-88c0-4b15-86f0-ad576a029cd1`), documented on Issue #1 Note `#4082842915`. |
| **28** | **Multi-stage GitLab CI & Scheduled Monitor** | **PASS** | `.gitlab-ci.yml` executes `validate`, `test`, `test_web`, `package`, `secure`, `smoke_monitor`, and `evidence_publication`, plus active Pipeline Schedule `#4509735`. |
| **29** | **Truthful narrated demo video (<180s)** | **PASS** | `media/final/still-demo.mp4` (~94s, 1920x1080 H.264 + 48kHz stereo AAC narration + burned SRT captions) recorded from real browser sessions. |
| **30** | **Zero leaked secrets** | **PASS** | Verified by `gitlab/flows/security-check.sh` and git history scan; all tokens live in gitignored `.env` / `.env.local` and masked Vercel/GitLab variables. |
