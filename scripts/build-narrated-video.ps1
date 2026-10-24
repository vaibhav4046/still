param(
  [string]$RawVideoPath = "",
  [string]$OutputMp4 = "C:\Users\lalwa\omnirush.ai\still\media\final\still-demo.mp4"
)

$ErrorActionPreference = "Stop"

$repoRoot = "C:\Users\lalwa\omnirush.ai\still"
$mediaDir = Join-Path $repoRoot "media\final"
$audioDir = Join-Path $mediaDir "audio_parts"
if (!(Test-Path $audioDir)) { New-Item -ItemType Directory -Path $audioDir -Force | Out-Null }

$ffmpeg = "C:\Users\lalwa\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-full_build\bin\ffmpeg.exe"
$ffprobe = "C:\Users\lalwa\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-full_build\bin\ffprobe.exe"

if ([string]::IsNullOrEmpty($RawVideoPath)) {
  $resFile = Join-Path $repoRoot "media\raw\recording-full-result.json"
  if (Test-Path $resFile) {
    $resJson = Get-Content $resFile -Raw | ConvertFrom-Json
    $RawVideoPath = $resJson.video
  }
}

if ([string]::IsNullOrEmpty($RawVideoPath) -or !(Test-Path $RawVideoPath)) {
  Write-Error "Raw video file not found: $RawVideoPath"
  exit 1
}

Write-Host "Raw video: $RawVideoPath"
$videoDur = & $ffprobe -v error -show_entries stream=duration -of default=noprint_wrappers=1:nokey=1 $RawVideoPath
Write-Host "Raw video duration: $videoDur s"

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft Zira Desktop")
$synth.Rate = 0

$segments = @(
  @{ id = "narration_1"; delayMs = 300;   text = "A broken form should not stop someone. STILL keeps critical advising appointments open when a frontend regression breaks the main form, while GitLab Duo and CI verify the repair." },
  @{ id = "narration_2"; delayMs = 14200; text = "On the primary booking route, every reservation commits inside a PostgreSQL transaction with a private HMAC capability token. Unauthenticated reads fail closed with HTTP 401." },
  @{ id = "narration_3"; delayMs = 29200; text = "When a regression injects negative tab index onto the slot picker, HTTP health still reports 200 OK, but STILL's Playwright journey probe catches the keyboard trap." },
  @{ id = "narration_4"; delayMs = 42200; text = "The Continuity Bridge routes the student to the simple accessible form, completing the booking against the exact same Neon PostgreSQL slot capacity." },
  @{ id = "narration_5"; delayMs = 57200; text = "In the Operator Control Room and Incident Memory Lab, PostgreSQL stores verified repair precedents and blocks prompt injection recipes before reuse." },
  @{ id = "narration_6"; delayMs = 73200; text = "On GitLab, the Duo Agent Platform workflow diagnoses the root cause and Merge Request 1 passes all automated CI checks, pausing at the human release gate." },
  @{ id = "narration_7"; delayMs = 88200; text = "STILL is live on Vercel and Neon PostgreSQL, keeping the human journey moving while engineering repairs the cause." }
)

foreach ($seg in $segments) {
  $wav = Join-Path $audioDir "$($seg.id).wav"
  $synth.SetOutputToWaveFile($wav)
  $synth.Speak($seg.text)
  $synth.SetOutputToDefaultAudioDevice()
}
$synth.Dispose()
Write-Host "Speech segments synthesized."

$srtPath = Join-Path $mediaDir "still-demo.srt"
$srtContent = @"
1
00:00:00,300 --> 00:00:13,800
A broken form shouldn't stop someone. STILL keeps advising bookings open via the
Continuity Bridge while GitLab Duo Session #10006279 and CI verify the repair.

2
00:00:14,200 --> 00:00:28,800
Primary booking (/book) commits in Neon PostgreSQL with an HMAC-SHA256 capability token.
Unauthenticated readback returns HTTP 401 and leaks zero PII.

3
00:00:29,200 --> 00:00:41,800
Controlled regression (/book?broken=1) blocks keyboard Tab while /health is 200 OK.
Staged GitLab Duo repair (/book?broken=1&repaired=1) restores focus.

4
00:00:42,200 --> 00:00:56,800
Accessible fallback (/simple): zero-noise WCAG 2.1 AA form sharing the exact same
transactional Neon PostgreSQL capacity lock and capability receipt.

5
00:00:57,200 --> 00:01:12,800
Operator Control Room & Incident Memory Lab: PostgreSQL verified_lessons,
prompt-injection quarantine, and 16-row paired evaluation.

6
00:01:13,200 --> 00:01:27,800
GitLab Evidence: Issue #1, Duo Agent Session #10006279, Open MR !1 (47a6b89a),
and passing Pipeline #2984938201 held at the human release gate.

7
00:01:28,200 --> 00:01:35,800
STILL: Live on Vercel + Neon PostgreSQL (15/15 production checks passing).
"@
[IO.File]::WriteAllText($srtPath, $srtContent, [Text.UTF8Encoding]::new($false))

$vttPath = Join-Path $repoRoot "apps\web\public\media\still-demo.vtt"
$vttContent = "WEBVTT`n`n" + ($srtContent -replace "(\d\d:\d\d:\d\d),(\d\d\d)", '$1.$2')
[IO.File]::WriteAllText($vttPath, $vttContent, [Text.UTF8Encoding]::new($false))
Write-Host "SRT and VTT subtitles created at $srtPath and $vttPath"

$filterComplex = @"
[0:a]adelay=300|300,volume=1.0[a0];
[1:a]adelay=14200|14200,volume=1.0[a1];
[2:a]adelay=29200|29200,volume=1.0[a2];
[3:a]adelay=42200|42200,volume=1.0[a3];
[4:a]adelay=57200|57200,volume=1.0[a4];
[5:a]adelay=73200|73200,volume=1.0[a5];
[6:a]adelay=88200|88200,volume=1.0[a6];
[a0][a1][a2][a3][a4][a5][a6]amix=inputs=7:dropout_transition=0:normalize=0[aout]
"@ -replace "`r`n", "" -replace "`n", ""

$inputArgs = @()
foreach ($seg in $segments) {
  $wav = Join-Path $audioDir "$($seg.id).wav"
  $inputArgs += "-i"
  $inputArgs += $wav
}

$tempAudio = Join-Path $mediaDir "narration_full.wav"
& $ffmpeg -y @inputArgs -filter_complex $filterComplex -map "[aout]" -ac 2 -ar 48000 $tempAudio
Write-Host "Full narration track generated at $tempAudio"

$escapedSrt = ($srtPath -replace '\\', '/').Replace(':', '\:')
$videoFilter = "subtitles='${escapedSrt}':force_style='FontSize=19,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,BorderStyle=4,Outline=2,Shadow=1,MarginV=32,Alignment=2'"

Write-Host "Encoding final MP4..."
& $ffmpeg -y -i $RawVideoPath -i $tempAudio -filter_complex "[0:v]$videoFilter[v]" -map "[v]" -map 1:a -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest $OutputMp4

Write-Host "Checking final encoded MP4..."
& $ffprobe -v error -show_entries format=duration,size,bit_rate:stream=codec_name,width,height -of default=noprint_wrappers=1 $OutputMp4

Write-Host "DONE: Final demo MP4 created at $OutputMp4"
