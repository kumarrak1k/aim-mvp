# Downloads the 2026-08-16 Higgsfield asset bank (final credit spend before
# membership cancellation) into the repo. Videos: 9:16 5s seedance_2_5 clips
# on the energy/preparation/confidence theme. Audio: Raina preset
# (1c3a4775-9afb-52c1-a2bf-b6543231a9a1, speech_rate 15), two takes per line
# so the tail-decay pick rule from reference_seed_audio_tts can be applied.
$base = "https://d8j0ntlcm91z4.cloudfront.net/user_3HDg94GtqB7LsY5SZH3qsWJCmOw"
$footage = "C:\Users\rak1k\aim-mvp\marketing\social\footage-bank"
$vo = "C:\Users\rak1k\aim-mvp\marketing\social\vo\bank"
New-Item -ItemType Directory -Force $footage | Out-Null
New-Item -ItemType Directory -Force $vo | Out-Null

$videos = @(
  @("hf_20260816_095615_3d404e1e-f258-4248-ace6-191442e97b00.mp4", "B01-practise-out-loud-desk.mp4"),
  @("hf_20260816_095615_f8336fff-b3c1-4d7f-87cd-b51a6a50e8bc.mp4", "B02-mirror-rehearsal.mp4"),
  @("hf_20260816_095615_957160e0-fe59-4eeb-aedd-ff3490439b92.mp4", "B03-notes-prep-closeup.mp4"),
  @("hf_20260816_095615_02e98738-3406-40bf-b1ef-80ed0827431c.mp4", "B04-morning-city-walk.mp4"),
  @("hf_20260816_095812_e18e8f97-384b-4dec-8396-b842fd06a945.mp4", "B05-mock-video-interview.mp4"),
  @("hf_20260816_095812_659ad8dc-6b32-4ded-a858-15e8d920e970.mp4", "B06-cv-highlighting.mp4"),
  @("hf_20260816_095812_7a06b98a-cdb9-4dea-bf95-62ef2e46792e.mp4", "B07-office-stairs-energy.mp4"),
  @("hf_20260816_095812_8aac8262-0736-49bb-b6b3-3d1d118bdd86.mp4", "B08-lobby-stride.mp4"),
  @("hf_20260816_095945_9acce034-9339-455f-bcfb-7e1b9b3d5537.mp4", "B09-door-breath-smile.mp4"),
  @("hf_20260816_095945_0f49a5f2-7497-4a80-b928-01df8d2ca9d0.mp4", "B10-cafe-fist-bump.mp4"),
  @("hf_20260816_095945_fe9e9d9d-1b6d-4404-a71d-0bd20815742d.mp4", "B11-confident-interview.mp4"),
  @("hf_20260816_095945_a8eb87b0-1dd8-4c50-a1a2-536ce66c4c81.mp4", "B12-warm-handshake.mp4"),
  @("hf_20260816_100141_6f5b02e8-5cf9-45ce-8296-eb10d927bdf8.mp4", "B13-victory-street-exit.mp4"),
  @("hf_20260816_100141_5fbe7094-09b3-4392-b7d8-9ce486be2db1.mp4", "B14-good-news-call.mp4"),
  @("hf_20260816_100141_cd885ec7-cefb-48fd-a075-f3fc1500aa80.mp4", "B15-checklist-ticks.mp4"),
  @("hf_20260816_100141_8458e13e-98cb-4733-a74e-59a0a9d59fc8.mp4", "B16-blazer-transformation.mp4"),
  @("hf_20260816_100317_212c9dc5-2cbe-4126-942e-836e7a8aa986.mp4", "B18-team-welcome.mp4")
)

$audio = @(
  @("095639_131aa408-fce1-42f5-b5c5-d21521622643", "question-of-the-week-take1"),
  @("095639_9db6ab54-f620-4fd9-b272-279c5070fde8", "could-you-answer-this-take1"),
  @("095639_0747a58f-eeac-4cdd-a9d7-1286698f6693", "pause-say-it-out-loud-take1"),
  @("095639_0cc49602-dda4-4b18-a6b7-f4ca494b84de", "strong-answer-covers-take1"),
  @("095814_422df1fa-e397-4c4f-b76f-1ec9c984ab8e", "heres-the-model-answer-take1"),
  @("095814_1bc8f782-6306-40a7-84c4-3821d591c99b", "most-answers-miss-this-take1"),
  @("095814_0ca6c933-9e5c-44c3-8d9d-054d13cc9784", "how-would-you-score-take1"),
  @("095814_82a1a47c-4f80-4080-863d-27a14a61ae9c", "try-it-free-cta-take1"),
  @("095858_ca024843-774a-4cd6-979c-dc6bcaa0cccb", "confidence-isnt-luck-take1"),
  @("095858_2217afa8-9fc3-488a-b28f-81cb6edeecc1", "preparation-nerves-energy-take1"),
  @("095858_acc28fe5-5d71-466b-8165-866d8837014e", "practise-out-loud-difference-take1"),
  @("095858_a5828a76-b130-459c-8eab-83a13b1b7427", "every-rehearsal-builds-take1"),
  @("095947_e801cb1d-b1d1-42f0-89b7-f3ad847e7c48", "walk-in-prepared-take1"),
  @("095947_d355c746-00d6-482d-be79-c66245d293f0", "small-practice-big-difference-take1"),
  @("095947_0c955d43-07db-4bcf-a607-8851bc8edee7", "done-the-work-show-it-take1"),
  @("095947_f64a694b-9b7d-4f62-a9cd-73d0ffd9c74c", "ready-when-it-matters-take1"),
  @("100043_566009a8-92a7-4f75-b7e6-de447ffcec48", "star-structure-take1"),
  @("100042_5e97a82a-cf79-42b8-ae90-0ff07474a514", "lets-break-it-down-take1"),
  @("100042_57368a5e-f7ea-4cd5-bd72-0dcfe15ee20f", "step-one-take1"),
  @("100042_0361407b-4043-4bbd-be38-78bbcd4a0627", "step-two-take1"),
  @("100145_7610315d-0201-4627-98f0-823e9da36295", "step-three-take1"),
  @("100145_f2f2dc49-5f06-4a2c-b4a1-903b97a71d09", "one-more-thing-take1"),
  @("100144_8f1c1832-51af-4a0f-8fd3-dab39a2d335a", "watch-what-happens-take1"),
  @("100145_7a8be6b3-c9f2-41ca-8058-28450ac63b1e", "thats-how-you-land-it-take1"),
  @("100229_9685f395-cf8a-4330-bdc3-a337344040f9", "aicm-practise-like-its-real-take1"),
  @("100229_785c2199-633f-45f6-bb46-580ede0691c6", "start-free-today-take1"),
  @("100229_df4cf813-5cc9-42f3-928f-aa8542f59899", "next-role-starts-with-practice-take1"),
  @("100229_7ac0b19e-6bad-4340-8a9c-09dd60d65b01", "new-week-new-question-take1"),
  @("100356_c4889569-0d0f-49db-9cb7-6312a1264214", "question-of-the-week-take2"),
  @("100356_55017542-f74c-44e0-9743-de7a22c84590", "could-you-answer-this-take2"),
  @("100356_54d5de17-8cb0-419b-9856-4a115ff2c40c", "pause-say-it-out-loud-take2"),
  @("100356_0020423b-4149-48b6-8c1d-b99ed781bee2", "strong-answer-covers-take2"),
  @("100356_ddc68fb3-ab3e-4369-a70d-20a5f05583bc", "heres-the-model-answer-take2"),
  @("100356_344590cb-3be6-487b-9e2c-97380bba0e24", "most-answers-miss-this-take2"),
  @("100356_62a46091-ebec-45a5-95bf-c3a1388224dd", "how-would-you-score-take2"),
  @("100356_2ddac4a6-9100-4df7-9efc-543b2da94b4a", "try-it-free-cta-take2"),
  @("100532_49ed3e07-9aea-4a48-b215-054fd9354b44", "confidence-isnt-luck-take2"),
  @("100532_b9f371be-d3b6-4eaa-9681-4794eb3360aa", "preparation-nerves-energy-take2"),
  @("100532_31b6f729-da29-476a-9ea2-673e90029d03", "practise-out-loud-difference-take2"),
  @("100532_5b77ea8d-8472-4371-ae8a-b4cbd7845466", "every-rehearsal-builds-take2"),
  @("100532_6499bcd6-eb34-4cd1-91da-5e797094acc1", "walk-in-prepared-take2"),
  @("100532_4753e6a7-2a61-4276-b3a3-59ba8dd0e0ae", "small-practice-big-difference-take2"),
  @("100532_70933d7e-4b59-4c2d-91f1-54fb32c2c2d2", "done-the-work-show-it-take2"),
  @("100532_880e75ec-4804-42bd-9dbf-3dd7e06f1d21", "ready-when-it-matters-take2"),
  @("100621_ef5002f3-cfaa-4480-9f75-9751492a6021", "star-structure-take2"),
  @("100621_77f07e64-ca2d-4ea9-8250-2afa309770d0", "lets-break-it-down-take2"),
  @("100621_702ede11-3b63-4286-8444-5b961789e3d1", "step-one-take2"),
  @("100621_2b2c9e5f-3b99-490b-b9c8-6f15cfeaa79d", "step-two-take2"),
  @("100621_f352730a-ef53-4c37-98c3-3d7f30bf9003", "step-three-take2"),
  @("100621_3a8e69a1-a446-4f3f-9637-34dbd51c5053", "one-more-thing-take2"),
  @("100720_0385f2ef-deb0-4db6-b8a9-785717935c64", "watch-what-happens-take2"),
  @("100621_72b816b5-e908-42ff-a290-858e86e3578b", "thats-how-you-land-it-take2"),
  @("100720_c7f6f119-361f-407a-8dbe-f446acec4e6e", "aicm-practise-like-its-real-take2"),
  @("100720_d9b61309-cd7b-48a8-aaee-29128a01d73e", "start-free-today-take2"),
  @("100720_65ef50e4-edcb-4eff-867f-867927445491", "next-role-starts-with-practice-take2"),
  @("100720_61b94bcd-004f-446b-b59c-4e25b985098d", "new-week-new-question-take2")
)

$ok = 0; $fail = @()
foreach ($v in $videos) {
  try {
    Invoke-WebRequest -Uri "$base/$($v[0])" -OutFile (Join-Path $footage $v[1]) -UseBasicParsing
    $ok++
  } catch { $fail += $v[1] }
}
foreach ($a in $audio) {
  try {
    Invoke-WebRequest -Uri "$base/hf_20260816_$($a[0]).wav" -OutFile (Join-Path $vo "$($a[1]).wav") -UseBasicParsing
    $ok++
  } catch { $fail += $a[1] }
}
Write-Output "downloaded: $ok  failed: $($fail.Count)"
if ($fail.Count -gt 0) { $fail | ForEach-Object { Write-Output "FAILED: $_" } }
