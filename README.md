# AI-interviewer — Adaptive Real-Time AI Technical Interviewer

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Groq Acceleration](https://img.shields.io/badge/LLM-Groq%20LPU%20(LLaMA%203.3%2070B)-orange?style=for-the-badge&logo=groq)](https://groq.com/)
[![React + Vite](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Speech-to-Speech](https://img.shields.io/badge/Voice-Pocket%20TTS%20%2B%20WebSpeech-ff69b4?style=for-the-badge)](https://github.com/)

An intelligent, speech-to-speech and text-based **AI Technical Interview System** designed to evaluate graduates of the **31-Day AI Cohort**. Powered by **Groq LPU acceleration**, **LangChain ReAct agents**, **Kyutai Pocket TTS**, and **Web Audio API streaming**, the agent dynamically tailors technical interview questions based on candidate profiles, tracks covered curriculum modules, adapts question depth in real time, and generates end-of-interview feedback reports.

---

## Why We Stand Out (Core Strengths & Highlights)

### 1. Lightning-Fast Sub-Second Response Latency
- **Groq LPU Acceleration**: Powered by Groq's high-speed Language Processing Units running `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` at **~500–1000 tokens/sec**.
- **Real-Time Human-Like Conversational Flow**: Delivers instantaneous follow-ups without awkward multi-second waiting times typical of standard cloud APIs.

### 2. Native Speech-to-Speech Voice Experience
- **CPU-Native High-Performance TTS**: Integrates **Kyutai Pocket TTS** yielding raw PCM audio frames over WebSockets in **~200ms**, eliminating external paid voice SaaS dependencies.
- **Browser Speech-to-Text (STT)**: Native Web Speech API integration for hands-free speech recognition with live interim visual transcription.
- **Voice Cloning Capabilities**: Allows uploading a 5-second reference sample (`/api/voice/upload-voice-sample`) to clone dynamic interviewer voice personalities.
- **Interactive Audio Visualizer**: Features a glowing state-aware AI orb avatar and canvas-rendered Web Audio API frequency waveform analyzer (`AnalyserNode`).

### 3. Multi-Model Automatic Failover (Zero-Downtime Reliability)
- Built-in multi-tier fallback mechanism preventing rate-limit crashes during heavy usage:
  $$\text{Groq LLaMA 3.3 70B} \longrightarrow \text{Groq LLaMA 3.1 8B Instant} \longrightarrow \text{Groq LLaMA 3.2} \longrightarrow \text{OpenAI GPT-4o-mini} \longrightarrow \text{Dynamic Rule Engine}$$
- Automatically detects `429 Rate Limit` or quota bounds and seamlessly shifts models mid-interview without interrupting the candidate.

### 4. Adaptive Curriculum-Aware Questioning Engine
- Fully mapped against the **31-Day AI Cohort Curriculum** (8 core modules ranging from vector databases to agentic workflows & deployment).
- **Dynamic Difficulty Adaptation**:
  - *Shallow/Incomplete Answer* $\rightarrow$ Deep-dive probing on missing concepts.
  - *Solid Answer* $\rightarrow$ Harder conceptual challenge on the same topic.
  - *Exceptional Answer* $\rightarrow$ Fast-tracks the candidate to the next curriculum module.
- Tracks question count, days covered, and topic depth to ensure holistic evaluation (minimum 8 questions across 4+ curriculum days).

### 5. Real-Time Candidate Scoring & Feedback Generation
- Parses candidate background, past missions, experience, and completed projects.
- Automatically generates an end-of-interview report containing:
  - Comprehensive performance summary
  - Key technical strengths & identified knowledge gaps
  - Modular scorecard matching curriculum days
  - Customized action plan & study recommendations

### 6. Modern Glassmorphism UI & Visual Excellence
- Built with custom Vanilla CSS variables, high contrast typography, dark mode aesthetics, and micro-animations.
- Seamless mode toggle between traditional text-chat and full hands-free voice mode.

---

## System Architecture

```
                                  +---------------------------------------+
                                  |         React + Vite Frontend         |
                                  |   (Interview UI / Voice Mode / Orb)   |
                                  +-------------------+-------------------+
                                                      |
                                    +-----------------+-----------------+
                                    | REST / WS / Audio Streaming       |
                                    v                                   v
                               +----+---------------------+   +---------+-------------------+
                               |  FastAPI Interview Router|   |   FastAPI Voice Router      |
                               +----+---------------------+   +---------+-------------------+
                                    |                                   |
                                    v                                   v
                               +----+---------------------+   +---------+-------------------+
                               |  Session Store (Memory)  |   |   TTSService (Pocket-TTS)   |
                               +----+---------------------+   +---------+-------------------+
                                    |                                   |
                                    v                                   v
                               +----+---------------------+   +---------+-------------------+
                               |  Interview Agent Engine  |   | WebSocket PCM Audio Stream  |
                               +----+---------------------+   +-----------------------------+
                                    |
            +-----------------------+-----------------------+
            |                       |                       |
            v                       v                       v
   +-----------------+     +-----------------+     +-----------------+
   |  Groq LPU LLM   |     |  OpenAI Fallback|     |  Dynamic Engine |
   | (LLaMA 3.3 70B) |     |  (GPT-4o-mini)  |     |   (Rule-based)  |
   +-----------------+     +-----------------+     +-----------------+
```

---

## Tech Stack

| Layer | Technology | Key Role |
|---|---|---|
| **Backend Framework** | **FastAPI (Python 3.10+)** | Async API endpoints, WebSockets, static host |
| **LLM Engine** | **Groq API + LangChain** | High-throughput ReAct agent execution (~1000 tok/s) |
| **Voice Synthesis (TTS)** | **Kyutai Pocket TTS** | Low-latency CPU streaming audio (~200ms) |
| **Voice Recognition (STT)** | **Web Speech API** | Client-side zero-latency speech recognition |
| **Data Validation** | **Pydantic v2** | Type-safe request/response schemas |
| **Frontend UI** | **React 18 + Vite** | Lightweight, ultra-responsive web application |
| **Styling** | **Vanilla CSS + Glassmorphism** | Custom dark mode design tokens & animations |
| **Icons & Media** | **Lucide React + Web Audio API** | Modern icons, dynamic audio waveform visualizer |

---

## Project Structure

```
prem-AI-interviewer/
├── backend/
│   ├── main.py                     # FastAPI server entry point & static React asset server
│   ├── router.py                   # Main POST /api/interview endpoint & session handler
│   ├── voice_router.py             # WebSocket /ws/tts & voice upload endpoints
│   ├── session_store.py            # In-memory interview session management
│   ├── requirements.txt            # Python dependencies
│   ├── agent/
│   │   ├── interview_agent.py      # Core ReAct agent & multi-model LLM failover pipeline
│   │   ├── profile_analyzer.py    # Candidate profile evaluation & scoring
│   │   ├── question_bank.py       # 31-Day AI Cohort curriculum question bank
│   │   ├── feedback_generator.py  # End-of-interview comprehensive report builder
│   │   ├── tts_service.py         # Kyutai Pocket TTS wrapper & audio streaming engine
│   │   └── stt_service.py         # Speech-to-Text backend processing fallback
│   ├── models/
│   │   ├── request.py             # Pydantic request data models
│   │   └── response.py            # Pydantic response data models
│   └── data/
│       ├── curriculum.json        # 31-Day AI Cohort curriculum modules definition
│       └── candidates.json        # Pre-loaded candidate profiles & mission records
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/
│       │   ├── CandidateSelector.jsx  # Candidate profile selection screen
│       │   ├── InterviewChat.jsx      # Main interview window (text mode)
│       │   ├── VoiceInterviewChat.jsx # Speech-to-speech voice screen with glowing orb
│       │   ├── VoiceModeToggle.jsx    # Text <-> Voice mode quick switch
│       │   ├── VoiceSetup.jsx         # Microphone & voice preview modal
│       │   ├── MessageBubble.jsx      # Chat transcript bubble component
│       │   └── FeedbackPanel.jsx      # Comprehensive final evaluation report UI
│       ├── hooks/
│       │   └── useVoicePipeline.js    # STT + API + WebSocket TTS streaming audio hook
│       └── styles/
│           └── index.css              # Global glassmorphism dark theme CSS
│
├── ARCHITECTURE.md                 # Detailed technical system design & flow documentation
├── PROMPTS.md                      # System prompts & LLM persona specifications
├── VOICE_IMPLEMENTATION_PLAN.md    # Voice system architecture plan
├── Dockerfile                      # Production container deployment config
└── README.md                       # Main documentation
```

---

## Quickstart Guide

### Prerequisites
- **Python**: 3.10 - 3.12 recommended
- **Node.js**: v18+ & `npm`
- **Groq API Key**: (Recommended for ultra-fast response) [Get API Key](https://console.groq.com/)

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Environment Configuration (`.env`)
Create a `.env` file inside the `backend` directory (or use `.env.example`):

```env
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here # Optional fallback
PORT=8000
```

#### Start Backend Server
```bash
python main.py
```
> Server starts at `http://localhost:8000`. Swagger documentation available at `http://localhost:8000/docs`.

---

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install packages
npm install

# Start development server
npm run dev
```
> Access the web application at `http://localhost:5173`.

---

## API Reference

### 1. Start or Continue Interview
- **Endpoint:** `POST /api/interview`
- **Content-Type:** `application/json`

#### Request Body (Start Interview):
```json
{
  "sessionId": "session-12345",
  "candidate": {
    "id": "CAND-001",
    "name": "Sarah Johnson",
    "jobRole": "Senior Data Engineer",
    "yearsExperience": 9,
    "education": "MS Computer Science",
    "status": "COMPLETED"
  }
}
```

#### Request Body (Continue Turn):
```json
{
  "sessionId": "session-12345",
  "message": "I used LanceDB for vector search because it supports zero-copy disk access.",
  "voice_mode": true
}
```

#### Response Body:
```json
{
  "reply": "That's a great choice for memory-efficient retrieval. How did you handle distance metric selection?",
  "tts_text": "That's a great choice for memory-efficient retrieval. How did you handle distance metric selection?",
  "done": false,
  "questionCount": 3,
  "topicsCovered": ["Day 7: Vector Databases", "Day 8: Embeddings"]
}
```

---

### 2. Speech-to-Speech Audio Stream (WebSocket)
- **Endpoint:** `ws://localhost:8000/ws/tts`
- **Payload:** Send text message `{"text": "Hello candidate, let us start."}`
- **Response:** Receives continuous raw PCM audio binary frames (`audio/pcm`).

---

### 3. Voice Sample Upload (Voice Cloning)
- **Endpoint:** `POST /api/voice/upload-voice-sample`
- **Form Data:** `file` (WAV/MP3 audio sample), `session_id`

---

## Curriculum Coverage (31-Day AI Cohort)

The agent dynamically draws questions across 8 comprehensive modules:

| Module | Curriculum Focus | Covered Days |
|---|---|---|
| **Module 1** | Environment, IDE & Tooling setup | Days 1–3 |
| **Module 2** | Data Foundations, Cleaning & Preprocessing | Days 4–6 |
| **Module 3** | Embeddings, LanceDB & Vector Search | Days 7–10 |
| **Module 4** | LLM Architecture, Prompting & Fine-Tuning | Days 11–15 |
| **Module 5** | Production Chatbot & RAG Applications | Days 16–20 |
| **Module 6** | Agentic AI & Model Context Protocol (MCP) | Days 21–24 |
| **Module 7** | AI Evaluation, Security & Guardrails | Days 25–28 |
| **Module 8** | Production Capstone & Deployment | Days 29–31 |

---

## Production Deployment

### Option A: Single-Service Production Build (FastAPI + Built React)

Build the React frontend into static assets served directly by FastAPI:

```bash
# 1. Build frontend dist
cd frontend
npm run build

# 2. Start FastAPI server (serves frontend/dist automatically)
cd ../backend
python main.py
```

### Option B: Docker Container

```bash
# Build Docker image
docker build -t prem-ai-interviewer .

# Run container
docker run -p 8000:8000 -e GROQ_API_KEY="your_api_key" prem-ai-interviewer
```

---

## Project Credits & Hackathon

Developed for **Vibecodathon 2026** under the **prem-AI-interviewer** project banner. 

- **Repository:** `d:\vibecodathon`
- **Architecture Spec:** [ARCHITECTURE.md](file:///d:/vibecodathon/ARCHITECTURE.md)
- **System Prompts:** [PROMPTS.md](file:///d:/vibecodathon/PROMPTS.md)
- **Voice Plan:** [VOICE_IMPLEMENTATION_PLAN.md](file:///d:/vibecodathon/VOICE_IMPLEMENTATION_PLAN.md)

---

<p align="center">
  <i>Built for AI Engineers & Candidates. Powered by Groq, LangChain & FastAPI.</i>
</p>
