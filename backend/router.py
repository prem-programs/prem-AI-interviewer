import json
import os
import re
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, List

try:
    from backend.models.request import InterviewRequest
    from backend.models.response import InterviewResponse, FeedbackResponse
    from backend.session_store import session_store
    from backend.agent.profile_analyzer import ProfileAnalyzer
    from backend.agent.interview_agent import interview_agent
except ModuleNotFoundError:
    from models.request import InterviewRequest
    from models.response import InterviewResponse, FeedbackResponse
    from session_store import session_store
    from agent.profile_analyzer import ProfileAnalyzer
    from agent.interview_agent import interview_agent

router = APIRouter()

def resolve_data_path(filename: str) -> str:
    possible_paths = [
        os.path.join(os.path.dirname(__file__), "data", filename),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", "data", filename),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", filename),
        os.path.join("backend", "data", filename),
        os.path.join("data", filename)
    ]
    for p in possible_paths:
        if os.path.exists(p):
            return p
    return os.path.join(os.path.dirname(__file__), "data", filename)

CANDIDATES_FILE = resolve_data_path("candidates.json")
CURRICULUM_FILE = resolve_data_path("curriculum.json")

def clean_for_speech(text: str) -> str:
    if not text:
        return ""
    # Strip code blocks
    cleaned = re.sub(r'```[\s\S]*?```', ' [code snippet omitted] ', text)
    # Strip inline code ticks
    cleaned = re.sub(r'`([^`]+)`', r'\1', cleaned)
    # Strip markdown bold/italic
    cleaned = re.sub(r'[*_]{1,3}([^*_]+)[*_]{1,3}', r'\1', cleaned)
    # Strip header hashes
    cleaned = re.sub(r'#+\s*', '', cleaned)
    # Normalize extra whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

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
            tts_text=clean_for_speech(reply_text),
            done=False,
            mainQuestionCount=session.get("mainQuestionCount", 1),
            meta={
                "questionCount": session["questionCount"],
                "mainQuestionCount": session.get("mainQuestionCount", 1),
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

        turn_meta = session.get("lastTurnMeta", {})
        is_follow_up = turn_meta.get("isFollowUp", False)
        follow_up_count = turn_meta.get("followUpCount", 0)
        evaluation_score = turn_meta.get("evaluationScore", None)
        main_q_count = session.get("mainQuestionCount", 1)

        meta_dict = {
            "questionCount": session["questionCount"],
            "mainQuestionCount": main_q_count,
            "depthTier": session["depthTier"],
            "topicsCovered": session["topicsCovered"],
            "isFollowUp": is_follow_up,
            "followUpCount": follow_up_count,
            "evaluationScore": evaluation_score,
            "evaluationReason": turn_meta.get("evaluationReason", "")
        }

        return InterviewResponse(
            reply=reply_text,
            tts_text=clean_for_speech(reply_text),
            done=done,
            isFollowUp=is_follow_up,
            followUpCount=follow_up_count,
            evaluationScore=evaluation_score,
            mainQuestionCount=main_q_count,
            feedback=feedback_obj,
            meta=meta_dict
        )


    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Payload must contain either 'candidate' (to start) or 'message' (to continue)."
    )
