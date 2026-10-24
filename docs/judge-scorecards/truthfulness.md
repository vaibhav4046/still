# Truthfulness scorecard

| Claim boundary | Status |
| --- | --- |
| Synthetic data is visibly labelled | PROVEN locally |
| Operator metrics are API-backed | PROVEN locally |
| GitLab Duo is not claimed without a run | PROVEN by documentation boundary |
| Deployment is not claimed without a URL and smoke test | PROVEN: Verified live at https://still-continuity.vercel.app with GitLab scheduled smoke_monitor passing (Job #17432257202) |
| Demo is not claimed without capture metadata | PROVEN locally: Claim backed by ffprobe metadata on `media/final/still-demo.mp4` (88.4s, 1920x1080, H.264 + AAC stereo, SRT subtitles) |
