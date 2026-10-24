# STILL OMEGA — Film director's brief
Goal: a genuine, sophisticated product story, not a software feature montage. Max competition duration strictly <180 seconds. Suggested cut 145–160 seconds; keep existing 95.4s if more effective.

## One story
A student needs an appointment. The normal page becomes inaccessible. They still complete the booking. A browser-based journey probe detects the specific failure even while generic health returns HTTP 200. GitLab Duo investigates; a repair MR and CI verification provide an auditable trail. Release governance remains human approved. STILL keeps the service useful during the repair cycle.

## Timeline candidate (total 152 s)
0–08 Cold open: black/ivory editorial title, subtle typographic kinetic reveal: `A form breaks. The deadline doesn't move.` 8 seconds max; immediately cut to actual broken UI.
08–24 Real keyboard-only browser capture on `/book?broken=1`: focus skips slot selection. An inset highlights genuine Tab key actions. Overlay `Health check: green. User journey: broken.` Do not falsify the test.
24–45 Real accessible `/simple` booking; show slot, form, confirmation with synthetic data and success readback. Precise edit on button press, no excessive UI b-roll.
45–62 Meaningful two-lane animated Continuity Bridge demonstrates simultaneous user/engineer work; user lane complete, engineering lane begins. State from actual artefacts; labels accurate.
62–88 Real journey probe evidence and GitLab issue. Browser capture of the real Duo Agent Platform session #10006279. If in a sibling group namespace, legibly disclose.
88–114 Real repair MR !1 and CI #2984938201. Show failing-before and fixed-after browser states, exact commit SHA. Human release gate disclosed. Never imply deployment approval that did not happen.
114–135 Real console incident memory/probe and a verified timestamp. Distinguish `health up` from `journey works`. Show at most two concise data elements.
135–152 Close: `Someone finished today. The code is checked for tomorrow.` STILL / real repo link / try demo / clear category `Supervised`.

## Motion grammar
- Editorial kinetic typography: subtle tracking and masked vertical reveals, 350–550ms; never unreadable variable typography.
- Continuity Bridge: SVG route draws in 450–700ms, user lane branches around failure, reconnects at confirmation. Independent engineer lane follows issue -> Duo -> test; stage pending approval remains unresolved if not released.
- Transitions: 200–350ms cross dissolve / match cuts. Avoid wipe-pack and spinning HUD.
- Focus zoom: crop into relevant actual UI with smooth 450ms transform; preserve legibility and source browser bars when showing proof.
- One large moment: two lanes converge to a stable green successful booking. Never make film overly 3D or fake human outcome.

## Quality & audio
- Genuine footage first. Motion overlays explanatory only, labelled and not used to simulate unseen events.
- 1920x1080, 30fps minimum, 48kHz AAC or compatible; export H.264 MP4. Native 4K if captured, not upsizing 1080p.
- Voiceover: conversational, crisp, natural, 125–145 words/minute. Loudness consistent, no peak clipping.
- Captions: accurate, safe margins, readable, no 3-line wall. Test on mobile playback.
- Music/sound effects original or properly licensed, sparse. No imitation of public figures, brand marks or cloned voices.
- Use Remotion if project supports it and licences/versions work, else FFmpeg. Verify ffprobe and full playback before publishing.

## Production checklist
1. Film script locked against actual trace links and test states.
2. Run browser capture from known-good public deployment and authored synthetic accounts; clear private tokens.
3. Capture actual GitLab session, MR, CI, flags, human gate. Mask private user data and secret headers.
4. Assemble with original SVG motion and narration, render once.
5. Inspect beginning/middle/end and every critical proof shot; fix dead air, jagged transitions and unreadable text.
6. Captions, sound and exported video verified; public YouTube only with authorised access. Record URL after open test in incognito.

## Film vetoes
No simulated agents, fabricated timelines, virtual keyboard captions inconsistent with actual test, unapproved auto-release claim, phony impact numbers, generic AI neon background, extended hero animation before showing problem, inaccessible transcript, or company trademark copy.
