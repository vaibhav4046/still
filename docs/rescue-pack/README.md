# STILL / OMEGA — Design Recovery Sprint
**Created:** 24 October 2026  
**Purpose:** rescue the judge-facing UI, interaction, motion and film without breaking the verified GitLab Duo and booking system.  
**Hard deadline:** 27 October 2026, 13:00 UTC.

## READ FIRST
1. `prompt/ARGON_HIGH_VISUAL_RESCUE.txt` — paste verbatim into the existing Antigravity Argon High coding session.
2. `design/DESIGN.md` — the binding design language and page contracts; save a copy in the existing repository root as `DESIGN.md` after reconciling with actual app code.
3. `video/FILM.md` — real-footage screenplay, 3D/motion restrictions, audio and render tests.
4. `qa/VISUAL_ACCEPTANCE.md` — screenshot gate, behavioural gates and subjective independent judging rubric.
5. `qa/visual-contract.spec.ts` — adaptable Playwright example for geometry and first-screen integrity (does not independently establish WCAG compliance).
6. `source/REFERENCES.md` — official design guidance and skill repositories.

## Preserved facts and caveats
- Existing public site: https://still-continuity.vercel.app
- Existing repo: https://gitlab.com/vaibhav.lalwani/still
- User's attached OpenCode log reports agent workflow #10006279, MR !1, repair pipeline #2984938201, Neon incident memory, 95.4 s video. Revalidate against the actual project before marking verified.
- Personal namespace Duo API was reported blocked; reported workflow ran in a separate authorised community project. Make that distinction explicit; do not conceal it in marketing.
- Existing release is supervised with a human release gate. Do not call it hands-off.
- One captured screenshot demonstrates major visual issues but cannot establish actual animation FPS or all mobile/accessibility defects.
- One pasted test log contained `FAIL health reports postgres backend` despite a broader 15/15 claim. Rerun targeted production health tests; resolve the contradiction, never silently discard the FAIL.

## Key decision
This is a **surgical visual rescue**, NOT a backend rewrite, NOT a new product, and NOT a greenfield redesign. Freeze the functional baseline, work on a feature branch, and keep a one-command rollback.

## Delivery states
All deliverables must be individually labelled VERIFIED / PARTIAL / BLOCKED / NOT RUN, with real commands and evidence. Nothing in this pack asserts that Antigravity has executed it.
