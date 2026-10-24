# Screenshot autopsy — user-provided 24 October still-continuity screenshot

## Observed at roughly 1812 px desktop width
1. Header 80 px tall, too many equal-weight choices (Console / Reserve a session / Simple path / Regression preview / Video & Telemetry) plus prominent environment badge and developer CTA `Try /book`.
2. Hero underneath contains overlapping semi-opaque blue-grey mountain/polygon vectors taking roughly 400+ pixels of height without exposing product promise, primary user action or interactive proof.
3. One `Scroll to explore` control floats near the lower centre; it does not establish the value of scrolling. Four square icon controls appear without obvious text labels in the hero.
4. Content starts far below fold: `00 / TECHNICAL REPORT · CAMPUS & CIVIC ADVISING CONTINUITY`, refresh live state and a pill describing the product.
5. Large editorial serif text `Keep the journey` is cut by viewport and visually separated from the hero. The screenshot alone cannot tell if this is intentional scroll reveal or an overflow regression.
6. A bottom floating CTA bar (`Reserve Session`, `/simple WCAG Path`) visibly overlaps the serif heading/first content block, a release-blocking visual collision.
7. Right-column `PRODUCTION INVARIANTS` card has a green `VERIFIED` badge but little/no evidence content visible in the screenshot.
8. Mixed font personalities: UI sans, technical all-caps mono, enormous traditional serif, terse path labels, informal `Scroll to explore` — no coherent information hierarchy.
9. Disclosure `SYNTHETIC ENVIRONMENT` is loud compared with the main product benefit (not visible in hero).

## What screenshot does not prove
- Backend is broken; screenshot can't establish this.
- Overall WCAG compliance; screenshot is not an accessibility audit.
- Motion quality or frame rate; static screenshots can't measure animation.
- Validity of GitLab Duo session, MR lineage, or pipeline.
- Current state after this screenshot; check live deployment revision/time first.

## Screenshot-only internal scores (not official or independently measured user study)
First-fold value proposition 1/10; hierarchy 2/10; composition 2/10; typography cohesion 3/10; nav clarity 4/10; narrative/interaction proposition 2/10; polish 3/10. Approximate 2.4/10 screenshot impression. Target >=8/10 for first-fold clarity after actual viewport inspection; avoid magic scores.

## Root cause hypothesis to validate against code
Agent treated skills and design adjectives as additive decoration instead of building a testable information architecture and rejecting bad screenshots. Actual CSS/component implementation and commits must be audited to confirm exact root causes. A full rewrite is not the default remedy.
