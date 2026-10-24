# STILL OMEGA — measurable visual and product release gate

## Evidence levels
VERIFIED (test actually run with artefact, version, timestamp, environment) | REPORTED (prior log only) | FAILED | BLOCKED | NOT_RUN.

## Mandatory build gate
- Verify starting Git SHA, working feature branch, known-good deployment and ability to rollback.
- Inspect screenshot at 320x720, 390x844, 768x1024, 1024x768, 1440x900, 1920x1080.
- First viewport headline + plain English product benefit visible and unoccluded.
- Primary CTA visible on mobile and desktop; nav concise.
- No giant irrelevant artwork; artwork must demonstrate recovery sequence.
- No proof status banner/empty card claiming success without backend evidence.
- No body-level horizontal overflow or fixed elements obscuring text.
- All links, keyboard nav, `Esc`, focus rings, announcements, loading/empty/error/success work.
- Reduced motion and 200% zoom tested; evaluate focus, manual screen-reader spot test or explicitly disclose not run.
- Primary and fallback booking tests pass; backend privacy and idempotency regression tests pass.
- Duo session is real; MR and CI trace verifiable; namespace/approval caveats disclosed.
- Actual production health check and durable Neon storage read-back after restart/instance boundary verified. Resolve any contradictory `FAIL health` output.
- No changes made to unrelated CleanRoom code; no token committed or leaked in screenshots.
- Link to genuine demo and submission, with state marked incomplete if not publicly uploaded.

## Screenshot-only scoring rubric (reviewers mark each /10 with exact evidence)
A. Hero value clarity (20%): Can first-time user articulate what STILL does in 8 seconds?
B. Composition and editorial craft (15%): H1, whitespace, alignment, consistent typography, content priorities.
C. Interaction and affordances (15%): One primary path, working controls, live route behaviour, obvious focus.
D. Motion delight (10%): causal, smooth, interruptible, measured frame time, reduced-motion equivalent.
E. Accessibility (10%): real keyboard task success, axe + spot check, zoom and contrast.
F. Trust/evidence (15%): actual Duo/MR/CI/probe, source SHA, honest release gate.
G. Distinctiveness (5%): recognisable product-owned Continuity Bridge, not copied template.
H. Demo clarity (10%): under 3 min, visible user outcome and complete evidence.

Internal target >=85/100, with no P0 and all minimum end-to-end gates verified. This cannot be translated into official GitLab scoring probabilities. Record evaluator method and actual observations, not invented experts.

## Design sign-off form
| Check | Status | Evidence | Reviewer |
|---|---|---|---|
| desktop H1 first fold | NOT_RUN | screenshot URL/path | |
| mobile H1+CTA first fold | NOT_RUN | screenshot URL/path | |
| no overlaps 6 widths | NOT_RUN | screenshot+test trace | |
| no giant irrelevant wallpaper | NOT_RUN | before/after capture | |
| live bookings and fallback | NOT_RUN | E2E + API readback | |
| reduced-motion alternative | NOT_RUN | video / browser test | |
| no empty verified cards | NOT_RUN | source+snapshot | |
| real Duo proof | NOT_RUN | session+MR+CI | |
| actual release gate documented | NOT_RUN | GitLab job/page | |
| health/Postgres contradiction resolved | NOT_RUN | actual run result | |
| final MP4 verified | NOT_RUN | ffprobe, playback | |

## Weakest-link repair cadence
Do no more than two overall visual-review/repair rounds after functional first fold. Prioritise actual P0 issues over a highly subjective rating. Use screenshot comparison and concrete counterexamples. Ship baseline under deadline rather than infinite beautification.
