# Demo video pipeline

Builds the candidate demo video from the captured product screenshots + an
AI voiceover. All local (ffmpeg + a TTS API). Storyboard mirrors `marketing/SCRIPT.md`.

## One-time
- ffmpeg installed (done — Gyan build via winget).
- A **TTS API key** in `.env` (premium voice). Pick one:
  - **ElevenLabs** (recommended — best quality, UK voices): sign up at elevenlabs.io,
    create an API key, then add to `.env`:
    ```
    ELEVENLABS_API_KEY=sk_...
    # optional: pick a voice id from your ElevenLabs Voices page
    ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
    ```
    Free tier (~10k chars/mo) comfortably covers the ~900-character script.
  - **OpenAI** (you already have a key): add `OPENAI_API_KEY=sk-...` to `.env`.
    Uses `tts-1-hd` voice `fable` (override with `OPENAI_TTS_VOICE`).

## Build
```
node scripts/video/render-slides.mjs                          # 1. slides (no key)
npx dotenv-cli -e .env -- node scripts/video/generate-vo.mjs  # 2. voiceover (needs key)
node scripts/video/build.mjs                                  # 3. assemble → marketing/video/candidate-demo.mp4
```
Step 3 detects the VO audio automatically; without it, it produces a **silent
timed draft**. Re-running `generate-vo` then `build` re-renders with the voice.

## Notes
- Slides + audio + segments + the mp4 live under `marketing/video/` (gitignored).
- To publish: review the mp4, then it replaces `public/videos/product-demo.mp4`
  on a branch for sign-off (never auto-deployed).
- World-class polish to add later: crossfades / gentle Ken-Burns motion, light
  background music (needs a licensed track), and the one real on-camera shot for
  the voice+camera scene.
