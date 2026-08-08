# Speech-to-Speech AI Interview System — Voice Implementation Plan

## Overview

Transform the current text-based AI interview interface into a fully **voice-first, speech-to-speech** interaction system:

- **Candidate speaks → STT** (Web Speech API, runs in browser)
- **LLM generates interviewer response** (existing LangChain/Groq pipeline, no change)
- **Interviewer reply converts to voice → TTS** (Kyutai Pocket TTS, runs on CPU via Python)
- **Browser plays interviewer voice audio** (Web Audio API streaming)

The existing text-based interview still works as a fallback. A new **Voice Mode** button toggles into the full voice experience.

---

## Technology Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| **TTS (AI → Voice)** | Kyutai Pocket TTS (`pip install pocket-tts`) | CPU-only, MIT license, ~200ms first-chunk latency, voice cloning |
| **STT (User → Text)** | Web Speech API (`SpeechRecognition`) | No API key needed, runs in browser natively, real-time interim results |
| **Audio Streaming** | FastAPI WebSocket + Web Audio API | Low-latency chunked PCM streaming from server to browser |
| **Voice Upload** | FastAPI `/api/voice/upload-voice-sample` | Optional: Upload a 5-sec sample to clone interviewer voice |

---

## User Review Required

> [!IMPORTANT]
> **Pocket TTS Python version**: Requires Python 3.10-3.14 and PyTorch 2.5+ (CPU build ~500MB). No GPU needed.

> [!IMPORTANT]
> **Interviewer voice identity**: Two options:
> - Use a **built-in voice** (Pocket TTS ships with pre-defined voices)
> - Upload a **custom 5-second WAV file** to clone a specific interviewer voice
> The plan implements both: a default voice + an optional upload endpoint.

> [!WARNING]
> **Web Speech API browser limitation**: SpeechRecognition is only supported on Chromium browsers (Chrome, Edge) and Safari. Firefox users will see a text-input fallback. The UI will clearly indicate this.

---

## Open Questions

> [!IMPORTANT]
> Should the voice interview **replace** the text chat or should they coexist (i.e., a "Voice Mode" toggle that can be turned on/off mid-interview)?
> The plan below implements a **toggle** so both modes work side-by-side.

---

## Architecture Data Flow

```
User speaks
    → Web Speech API (browser STT) → final transcript text
    → POST /api/interview {message: transcript}
    → LLM generates next interviewer question (existing pipeline)
    → Response {reply: "...", tts_text: "..."}
    → WebSocket /ws/tts {text: reply}
    → Pocket TTS streams PCM audio chunks
    → Web Audio API plays chunks sequentially
    → Audio ends → mic resumes listening
```

---

## Proposed Changes

### Backend - TTS & Voice Infrastructure

#### [NEW] backend/agent/tts_service.py
A wrapper around `pocket-tts` Python API:
- `TTSService.__init__()`: loads model once at startup via `PocketTTS.load()`
- `synthesize_streaming(text, voice)`: yields raw PCM audio chunks (for WebSocket streaming)
- `synthesize_full(text, voice)`: returns full WAV bytes (for REST endpoint)
- Voice sample registry: maps session_id → voice_file path for voice cloning

#### [NEW] backend/voice_router.py
Three new endpoints:
1. `WebSocket /ws/tts` — accepts `{text, voice}`, streams back PCM binary frames
2. `POST /api/voice/synthesize` — returns full WAV file (StreamingResponse)
3. `POST /api/voice/upload-voice-sample` — saves WAV/MP3 to `backend/data/voices/{session_id}.wav`

#### [MODIFY] backend/main.py
Mount the new `voice_router` alongside the existing `router`.

#### [MODIFY] backend/requirements.txt
Add:
```
pocket-tts>=0.1.0
torch>=2.5.0
websockets>=12.0
python-multipart>=0.0.9
```

#### [MODIFY] backend/models/request.py
Add `voice_mode: Optional[bool] = False` to `InterviewRequest`.

#### [MODIFY] backend/models/response.py
Add `tts_text: Optional[str] = None` — clean text to synthesize (stripping evaluation context).

#### [MODIFY] backend/router.py
When `voice_mode=True`, populate `tts_text` in `InterviewResponse` with the clean reply text.

---

### Frontend - Voice Interview Components

#### [NEW] frontend/src/hooks/useVoicePipeline.js
Central logic hook combining STT + API call + TTS streaming:
- State machine: `IDLE → LISTENING → PROCESSING → SPEAKING → IDLE`
- `useSpeechRecognition()`: wraps `window.SpeechRecognition`, returns interim + final transcript
- `useWebSocketTTS()`: opens `/ws/tts`, sends text, receives PCM bytes, decodes via Web Audio API `AudioContext.decodeAudioData()`
- On audio end: automatically returns to `LISTENING` state

#### [NEW] frontend/src/components/VoiceInterviewChat.jsx
Brand-new voice-first interview UI:
- **Center animated orb**: Glowing pulsing orb (CSS rings) — blue when AI speaking, amber when user speaking, dim when idle
- **Waveform canvas**: Web Audio API `AnalyserNode` frequency bars below the orb
- **State label**: Dynamic `"🎤 Listening..." / "🤔 Thinking..." / "🔊 Speaking..."`
- **Right panel**: Scrolling live transcript (text still visible)
- **Bottom**: Large round mic button — click to start/stop, hold-to-speak mode
- **Top**: Interview progress (main questions count, topics covered)

#### [NEW] frontend/src/components/VoiceModeToggle.jsx
Sleek toggle button (microphone icon) in the `InterviewChat.jsx` header. Switches between voice/text modes with an animated pill.

#### [NEW] frontend/src/components/VoiceSetup.jsx
Onboarding modal when voice mode is first activated:
- Microphone permission status check
- Browser compatibility warning (non-Chromium)
- Optional: Upload 5-second WAV to clone interviewer voice
- Voice preview playback button

#### [MODIFY] frontend/src/components/InterviewChat.jsx
- Add `voiceMode` state and `<VoiceModeToggle>` in header
- When `voiceMode=true`, render `<VoiceInterviewChat>` instead of text chat layout

#### [MODIFY] frontend/src/styles/index.css
New CSS classes:
- `.voice-orb` — animated AI avatar orb (pulsing glow + CSS wave rings)
- `.voice-orb.speaking` — active animation when AI speaks
- `.voice-orb.listening` — amber active state when user speaks
- `.waveform-canvas` — canvas styling for frequency visualizer
- `.mic-btn` — large round mic button with recording animation
- `.mic-btn.active` — pulsing red ring when recording
- `.voice-transcript-scroll` — right side live transcript panel
- `.voice-mode-badge` — header pill `"🎤 LIVE · Voice Mode"`

---

## File Structure

```
d:\vibecodathon\
├── backend/
│   ├── agent/
│   │   └── tts_service.py          [NEW]
│   ├── data/
│   │   └── voices/                 [NEW folder]
│   ├── voice_router.py             [NEW]
│   ├── models/
│   │   ├── request.py              [MODIFY]
│   │   └── response.py             [MODIFY]
│   ├── router.py                   [MODIFY]
│   ├── main.py                     [MODIFY]
│   └── requirements.txt            [MODIFY]
│
└── frontend/src/
    ├── components/
    │   ├── VoiceInterviewChat.jsx   [NEW]
    │   ├── VoiceModeToggle.jsx      [NEW]
    │   ├── VoiceSetup.jsx           [NEW]
    │   └── InterviewChat.jsx        [MODIFY]
    ├── hooks/
    │   └── useVoicePipeline.js      [NEW]
    └── styles/
        └── index.css                [MODIFY]
```

---

## Verification Plan

### Install & Hardware Verification
1. `pip install pocket-tts` — verify install
2. `pocket-tts generate --text "Hello, welcome to your AI interview"` — verify CPU TTS output
3. Start backend → connect WebSocket `/ws/tts` via wscat — verify PCM binary frames received

### UI Verification
1. Click "Voice Mode" toggle → voice setup modal appears
2. Grant mic permission → state transitions to `LISTENING`
3. Speak an answer → STT transcript appears live
4. On silence/submit → API call made, `PROCESSING` state shown
5. Audio plays back from Pocket TTS → `SPEAKING` state + waveform animation
6. Audio ends → automatically returns to `LISTENING`
7. Upload custom voice sample → verify next TTS response uses cloned voice

### Automated Tests (additions to test_backend.py)
- `test_tts_synthesize_endpoint()` — POST `/api/voice/synthesize` returns `audio/wav`
- `test_voice_upload()` — POST `/api/voice/upload-voice-sample` saves file to `data/voices/`
