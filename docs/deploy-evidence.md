# Deployment evidence

## Verified Public Deployment

- **Hosting Provider:** Vercel (Hobby plan)
- **Project Name:** `still-continuity` (Project ID: `prj_DE2Y2dNJL14gFFJi3JJQh7YIkA1c`)
- **Production Alias:** [https://still-continuity.vercel.app](https://still-continuity.vercel.app)
- **Immutable Deployment URL:** [https://still-continuity-re3h9v642-vaibhav4046s-projects.vercel.app](https://still-continuity-re3h9v642-vaibhav4046s-projects.vercel.app)
- **Deployment Status:** `READY` / Production
- **Protection Status:** Public access verified; SSO/Deployment Protection disabled (`ssoProtection: false`).
- **Verified Timestamp:** 2026-10-24T00:19:37Z

## Verified Public Route Responses

| Route | Expected Function | Live Status | Evidence |
|---|---|---|---|
| `/` | Operator Console | HTTP 200 OK | Shell renders full layout, healthy journeys indicator, and navigation |
| `/book` | Primary Booking Experience | HTTP 200 OK | Form inputs, session selectors, authoritative state contracts |
| `/simple` | Accessible Fallback Flow | HTTP 200 OK | Low-distraction accessible fallback with full booking parity |
| `/book?broken=1` | Controlled Regression Flow | HTTP 200 OK | Accessible notification banner linking immediately to `/simple` |

## Live Health & Monitoring Probe

The public deployment is continuously probed by the GitLab CI scheduled monitoring pipeline (`smoke_monitor` job via pipeline schedule `4509735`). Target configured via protected project variable `STILL_CANDIDATE_URL=https://still-continuity.vercel.app`.
