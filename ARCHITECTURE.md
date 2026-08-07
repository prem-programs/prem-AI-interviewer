# 🤖 AI Interview Agent — Architecture & System Design

> **Project:** prem-AI-interviewer · **Hackathon:** Vibecodathon
> **Date:** 2026-08-07

---

## Overview

An AI-powered technical interview agent that conducts **personalized, multi-turn interviews** for graduates of the 31-day AI Cohort. The agent reads a candidate's learning profile and dynamically generates contextual questions, adapting in real-time based on their answers.

---

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                 React Frontend                   │
│   (Interview Chat UI · Session Management)       │
└────────────────────┬────────────────────────────┘
                     │ POST /api/interview
┌────────────────────▼────────────────────────────┐
│              FastAPI Backend                     │
│  ┌──────────────────────────────────────────┐   │
│  │         Interview Router                 │   │
│  │  (Start vs. Continue based on payload)   │   │
│  └─────────────┬────────────────────────────┘   │
│                │                                │
│  ┌─────────────▼────────────────────────────┐   │
│  │        Session Store (in-memory)          │   │
│  │  sessionId → { candidate, history,        │   │
│  │    questionCount, topicsCovered }         │   │
│  └─────────────┬────────────────────────────┘   │
│                │                                │
│  ┌─────────────▼────────────────────────────┐   │
│  │        Interview Agent (LangChain)        │   │
│  │  · Profile Analyzer                      │   │
│  │  · Question Generator (curriculum-aware) │   │
│  │  · Response Evaluator (adaptive follow-up│   │
│  │  · Feedback Generator                    │   │
│  └─────────────┬────────────────────────────┘   │
└─────────────────┼────────────────────────────────┘
                  │
       ┌──────────▼──────────┐
       │   LLM Provider      │
       │  Groq / OpenAI /    │
       │  Ollama             │
       └─────────────────────┘
```

---

## Folder Structure

```
d:\vibecodathon\
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── router.py                  # POST /api/interview endpoint
│   ├── session_store.py           # In-memory session management
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── interview_agent.py     # Core LangChain interview agent
│   │   ├── profile_analyzer.py   # Candidate profile parsing & scoring
│   │   ├── question_bank.py      # Curriculum-aware question generation
│   │   └── feedback_generator.py # End-of-interview feedback builder
│   ├── models/
│   │   ├── __init__.py
│   │   ├── request.py            # Pydantic request schemas
│   │   └── response.py           # Pydantic response schemas
│   ├── data/
│   │   ├── curriculum.json
│   │   └── candidates.json
│   └── requirements.txt
│
├── frontend/
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── InterviewChat.jsx
│   │   │   ├── CandidateSelector.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   └── FeedbackPanel.jsx
│   │   └── styles/
│   │       └── index.css
│   └── package.json
│
├── curriculum.json
├── candidates.json
├── technical-spec.md
├── ARCHITECTURE.md                # This file
├── PROMPTS.md
└── README.md
```

---

## Technology Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Backend Framework | **FastAPI** | Async, fast, Pydantic native |
| Agent Orchestration | **LangChain** | ReAct agents, conversation memory |
| LLM Provider | **Groq (llama-3.3-70b)** | Speed + quality for hackathon |
| Conversation Memory | **LangChain ConversationBufferMemory** | No DB needed |
| Session State | **Python dict (in-memory)** | Spec: no persistence needed |
| Request Validation | **Pydantic v2** | Type-safe |
| Frontend | **React + Vite** | Fast, component-based |
| CSS | **Vanilla CSS + CSS Variables** | Full design control |

---

## API Contract

### Start Interview
```http
POST /api/interview
Content-Type: application/json

{
  "sessionId": "abc-123",
  "candidate": { ...candidate_object }
}
```
**Response:**
```json
{ "reply": "Welcome! Let's begin your interview.", "done": false }
```

### Conversation Turn
```http
POST /api/interview
Content-Type: application/json

{ "sessionId": "abc-123", "message": "candidate answer here" }
```
**Response:**
```json
{ "reply": "Follow-up question...", "done": false }
```

### End Interview (auto-triggered)
```json
{
  "reply": "Interview completed.",
  "done": true,
  "feedback": {
    "summary": "...",
    "strengths": ["..."],
    "gaps": ["..."],
    "next": ["..."]
  }
}
```

---

## Interview Flow

**Minimum Requirements:**
- ✅ 8+ questions asked
- ✅ 4+ different curriculum days covered
- ✅ Follow-up questions based on prior answers
- ✅ Personalized to candidate's completed missions

**Adaptive Logic:**
- **Shallow answer** → probe deeper on same topic
- **Good answer** → pivot to harder related concept
- **Excellent answer** → fast-track to next topic

---

## Curriculum Coverage (8 Modules, 31 Days)

| # | Module | Days |
|---|--------|------|
| 1 | Environment & Tooling | 1-3 |
| 2 | Data Foundations | 4-6 |
| 3 | Embeddings & Vector Search | 7-10 |
| 4 | LLM Core, Prompting & Fine-Tuning | 11-15 |
| 5 | Chatbot Application Build | 16-20 |
| 6 | Agentic AI & MCP | 21-24 |
| 7 | Evaluation, Security & Deployment | 25-28 |
| 8 | Production & Capstone | 29-31 |

---

## Candidate Profile Schema

```json
{
  "member": {
    "id": "CAND-001",
    "name": "Sarah Johnson",
    "jobRole": "Senior Data Engineer",
    "yearsExperience": 9,
    "education": "MS Computer Science",
    "status": "COMPLETED"
  },
  "missions": [
    { "day": 7, "title": "Embeddings Explained", "passed": true, "attempts": 1 },
    { "day": 8, "title": "Vector Databases Overview", "passed": true, "attempts": 1 }
  ],
  "signals": {
    "commitDays": 28,
    "missionsCompleted": 30,
    "missionsFirstTry": 20
  }
}
```

**Depth Scoring:**
- `missionsFirstTry / missionsCompleted > 0.8` → Expert tier
- `0.5 - 0.8` → Intermediate tier
- `< 0.5` → Beginner tier (more foundational questions)

---

*Generated by Antigravity AI · 2026-08-07*
