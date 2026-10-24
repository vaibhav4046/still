# Blockers & Resolution Log

| Blocker | Evidence | Resolution / Status | Status |
|---|---|---|---|
| Rust toolchain was initially missing | Stable Rust/cargo 1.98.1 installed at `~/.cargo/bin` | Verified with `cargo test --workspace`, fmt, and clippy | RESOLVED |
| Source was not a git repository and had no remote | Directory lacked `.git` and remote | Git initialized, committed, and published to `https://gitlab.com/vaibhav.lalwani/still` | RESOLVED |
| GitLab CI rule validation failed | GitLab CI Lint rejected `manual_confirmation` under `rules:` | Removed deprecated rule key; validated with GitLab CI Lint API | RESOLVED |
| Cross-platform npm package mismatch in CI | Alpine/Debian slim missing platform packages under `npm ci` | Switched to `npm install --no-audit` in `test_web` job; pipeline passing | RESOLVED |
| Public hosting authorization and deployment | App required zero-cost public hosting | Deployed to Vercel at `https://still-continuity.vercel.app`; SSO protection disabled | RESOLVED |
| Scheduled remote monitoring execution | Monitoring previously only ran locally | Created GitLab Pipeline Schedule #4509735 probing live Vercel URL with curl in Alpine runner | RESOLVED |
| Demo video encoding and verification | Master footage recorded | 4K MP4 produced at `media/final/still-demo.mp4` (H.264, 3840x2160, 31.0s, verified via ffprobe) | RESOLVED |
| GitLab Duo Workflow API permissions | `POST /ai/duo_workflows/workflows` returns 403 on personal project and group push blocked | Documented exact response codes and organization scoping requirement | DOCUMENTED / BLOCKED ON SUBGROUP |
