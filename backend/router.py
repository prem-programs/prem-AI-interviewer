import json
import os
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, List

from backend.models.request import InterviewRequest
from backend.models.response import InterviewResponse, FeedbackResponse
from backend.session_store import session_store
from backend.agent.profile_analyzer import ProfileAnalyzer
from backend.agent.interview_agent import interview_agent

router = APIRouter()

BASE_DIR = os.path.dirname(__file__)
CANDIDATES_FILE = os.path.join(BASE_DIR, "data", "candidates.json")
CURRICULUM_FILE = os.path.join(BASE_DIR, "data", "curriculum.json")

@router.get("/api/health")
def health_check():
    return {"status": "ok", "service": "AI Technical Interview Agent"}

@router.get("/api/candidates")
def get_candidates():
    if os.path.exists(CANDIDATES_FILE):
        with open(CANDIDATES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    raise HTTPException(status_code=404, detail="Candidates data file not found")

@router.get("/api/curriculum")
def get_curriculum():
    if os.path.exists(CURRICULUM_FILE):
        with open(CURRICULUM_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    raise HTTPException(status_code=404, detail="Curriculum data file not found")

@router.post("/api/interview", response_model=InterviewResponse)
def handle_interview(payload: InterviewRequest):
    session_id = payload.sessionId
    
    if not session_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="sessionId is required")

    # Case 1: Start Interview (candidate provided)
    if payload.candidate is not None:
        analysis = ProfileAnalyzer.analyze_profile(payload.candidate)
        depth_tier = analysis["depthTier"]
        
        session = session_store.create_session(
            session_id=session_id,
            candidate_data=payload.candidate,
            depth_tier=depth_tier
        )

        reply_text = interview_agent.start_interview(session)
        
        session["history"].append({"role": "assistant", "content": reply_text})

        return InterviewResponse(
            reply=reply_text,
            done=False,
            meta={
                "questionCount": session["questionCount"],
                "depthTier": depth_tier,
                "topicsCovered": session["topicsCovered"],
                "candidateName": analysis["name"]
            }
        )

    # Case 2: Conversation Turn (message provided)
    if payload.message is not None:
        session = session_store.get_session(session_id)
        if not session:
            # Auto-fallback: if session missing, create default dummy session
            dummy_candidate = {
                "member": {"id": "CAND-001", "name": "Candidate", "jobRole": "AI Engineer", "yearsExperience": 3, "education": "BS CS", "status": "COMPLETED"},
                "missions": [],
                "signals": {"commitDays": 20, "missionsCompleted": 20, "missionsFirstTry": 15}
            }
            session = session_store.create_session(session_id, dummy_candidate, "Intermediate")

        session["history"].append({"role": "user", "content": payload.message})

        reply_text, done, feedback_data = interview_agent.process_turn(session, payload.message)

        session["history"].append({"role": "assistant", "content": reply_text})

        feedback_obj = None
        if done and feedback_data:
            feedback_obj = FeedbackResponse(**feedback_data)

        return InterviewResponse(
            reply=reply_text,
            done=done,
            feedback=feedback_obj,
            meta={
                "questionCount": session["questionCount"],
                "depthTier": session["depthTier"],
                "topicsCovered": session["topicsCovered"]
            }
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Payload must contain either 'candidate' (to start) or 'message' (to continue)."
    )
