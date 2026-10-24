# STILL — DESIGN.md v2 | THE QUIET CONTROL ROOM

## Non-negotiable creative thesis
**The visitor sees the benefit before the system.** STILL protects the completion of a digital task while GitLab Duo helps repair its broken interface. Show the human journey on the public page and the verification trail in a disciplined operator view. Never confuse a fabricated product metaphor with evidence.

### One-sentence first screen
**A broken form shouldn't stop someone.**
Supporting: **STILL keeps an accessible route open while GitLab Duo investigates the issue and independent tests verify the repair.**
If the actual Duo execution or repair linkage is only supervised, say so in the proof disclosure.

### Interaction architecture — three surfaces, three audiences
1. `/` — case study and interactive real-product proof. Audience: judges and unfamiliar visitors. A first-time judge understands what happened in <= 8 seconds; can choose a working demo in one click.
2. `/book`, `/simple`, `/book?broken=1`, `/book?broken=1&repaired=1` — unchanged transaction routes with consistent design tokens but no showpiece interference. Audience: the end user. Accessibility and error handling first.
3. `/console` or existing operator route — evidence-backed operations. Audience: engineer/judge. Actual timestamps, URLs, statuses, sources; never synthetic claims represented as telemetry.

## Design language
**Calm, editorial, precise, materially grounded.** Think Swiss editorial typography, trustworthy instrument panels, modern physical materials; not generic SaaS AI visuals, not gaming neon, not imitation Apple or Perplexity. White / warm ivory background with very dark ink and a single deep teal accent. Dark mode may exist but does not define the product.

### Design tokens (initial direction, tune using real contrast measurements)
```
--bg: #F7F7F3;       /* chalk */
--surface: #FFFFFF;
--ink: #121A19;      /* dark graphite */
--muted: #586865;
--line: #D9DFDA;
--accent: #006E62;   /* pine */
--accent-strong: #005047;
--accent-wash: #E6F1ED;
--warning: #895B12;
--danger: #A63738;
--success: #17684B;
--radius-sm: 8px;
--radius-md: 14px;
--content-max: 1240px;
--gutter: clamp(20px, 4vw, 64px);
```
Colors are starting points; verify actual foreground/background contrast at rendered states. Do not use success green to imply unproven status. Link blue and selected button accents should be harmonised, not layered as independent palettes.

### Typography
- UI: an available robust sans, e.g. Geist Sans, Inter or system-ui. Use ONE sans throughout nav, forms, data panels and body.
- Display: a tasteful contrasting editorial serif **only if** it increases the value proposition's clarity; otherwise use the same sans for a more coherent result. Never set one random giant serif heading beneath a monospaced control-panel header.
- Mono: limited to commit SHAs, API paths, stages and exact GitLab evidence identifiers.
- Hero: 56–74 desktop / 34–44 mobile, 1.02–1.09 line height, balanced wrap; body: 17–20 and readable contrast; labels: 12–13 minimum when high-contrast, but avoid tiny UI controls.
- Use consistent letter-spacing, optical alignment, baseline rhythm, 4px spacing scale with 8px primary rhythm.

## Page composition (1440x900 desktop contract)
**Header 72px, main content starts immediately.**
Header: STILL wordmark on left; right/center contains Product, Live demo, Evidence (three destinations). One rightmost CTA **Watch it recover** (links to real demonstration). No `/book` path string as button label. Synthetic environment disclosure moves into a small text line beside functional demo context, not a loud capsule competing with the brand.

**First viewport**: hero height roughly 620–700px including nav; 12-column grid: left 5 columns for value proposition and actions; right 7 for a meaningful interactive visualisation, not mountains.
Left visual order:
1. Quiet eyebrow `A BETTER WAY THROUGH SOFTWARE FAILURE` or similarly concrete.
2. Headline `A broken form shouldn't stop someone.`
3. 1–2 sentences identifying user outcome and the Duo repair loop.
4. Primary CTA `See the recovery` -> verified interactive sequence; secondary CTA `Book with the fallback` -> /simple; small `Watch 95-second proof` link when a real video is accessible.
5. Confidence line `Synthetic university service · Real code, tests & GitLab evidence` with disclosure.
Right: THE CONTINUITY BRIDGE — a precise, landscape (not metaphorical mountain) flow with 2 interconnected tracks:
  TOP — User: Normal booking -> inaccessible step -> alternate accessible path -> confirmed booking.
  BOTTOM — Engineering: issue captured -> Duo investigated -> merge request verified -> release awaits approval -> follow-up probe.
  Connections must be real data or clearly labelled DEMONSTRATION / EXEMPLAR. Each step reveals a concrete evidence popover with GitLab URL or a well-labelled instructional placeholder only in local dev; production proof must have actual links.
Visual centre: single elegant bridge arc/connection built as flat SVG path with subtle depth/light sweep (not fake 3D). States are readable text and geometry, not abstract mountains.

First scroll: **A comparison with proof**. Left: human task outcome, right: actual engineer remediation. Use strong evidence (existing public MR, CI, Duo session) and clear caveats if in different namespaces. No empty production invariants card; if actual data missing display `Evidence unavailable` and hide success badge.
Second scroll: **Try it for yourself**; three large steps: 1 broken input, 2 fallback, 3 inspect verified repair. Keep functional direct links; optionally embedded real constrained view; no misleading browser imitation.
Third scroll: **How the system behaves unattended**; distinguish scheduled browser probes from health endpoint; exact cadence and last run; clearly label what is supervised.
Fourth scroll: **Engineering proof**: GitLab issue, agent session, MR, pipeline, monitor. Source links, status chips with timestamp, stage matrix; show blocked states. Include a compact architecture diagram for Rust/Postgres/Next.js/GitLab; disclose Vercel runtime role honestly.
Footer: MIT, repo, demo, docs, contact/privacy.

## Mobile page composition
No huge hero art preceding value proposition. At 390x844, headline, supporting sentence, primary CTA and 1 real proof affordance must appear without horizontal scroll; visualisation begins immediately below content and may compress to vertical timeline. Sticky nav collapses to three-destination menu; no floating bar across body. At 320px, no overlap; at 200% zoom, maintain function and legibility.

## Operator console
Use three explicit sections: `Today`, `Incidents`, `Evidence`. A serious high-information-density console, not empty 3D panels and cryptic jargon. Current status is honest: last successful scheduled probe (with timestamp and job URL), last verified booking scenario, incident state, Duo activity link, release governance state. All status values come from backend/evidence. No numbers without labels; no `VERIFIED` for empty slots. Real refresh and errors.

## Interaction design
- Functional state labels: Observed, Fallback ready, Investigating, MR verified, Waiting for approval, Released, Live probe passed. Label truly available steps only.
- Each control must have an affordance, focus state, active/disabled state, feedback/error state. No dead demos.
- Page scroll must not hijack wheel, prevent text selection, or trap keyboard focus.
- Hover animations cannot be the only source of information.

## Forbidden visual patterns
Huge random polygon wallpaper; scrolling before value proposition; sticky controls masking copy; ungrounded verified badges; duplicate CTAs; excessive uppercase microtext; meaningless charts; status dots without labels; fake agent thoughts; glassmorphic card stacks; SaaS bento clutter; 3D objects unrelated to task continuity; multiple type aesthetics without hierarchy; hero animation that blocks CTA; faux-terminal code; fabricated testimonials and enterprise metrics.

## Distinctive owned asset
One `Continuity Bridge` illustration, used across site and film. It's an information design, not wallpaper. It depicts a user path branching around a blocked primary form and reconverging at completed task; a lower independent engineering path shows detection -> Duo -> MR -> verification. Animation tells this real story. Idle resting state retains all labelled information.

## Performance constraints
Target motion 60fps on representative midrange hardware where measurable; graceful 30fps degradation; preserve user preference for reduced motion. LCP 2.5s / CLS <=.1 / INP <=200ms as performance budgets on measured test profiles, not promises. Hero should not require heavyweight WebGL unless substantive interaction warrants it. SVG/CSS is preferred; Three.js only if the 3D data meaning can't be conveyed better in 2D.

## Source of truth
Evidence and text tied to actual repo/runtime. Product behaviour and GitLab traces are preserved. No feature claimed hands-off without actual unattended release proof. User-facing route status is not based on synthetic animated phase alone.
