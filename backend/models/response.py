from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class FeedbackResponse(BaseModel):
    summary: str
    strengths: List[str]
    gaps: List[str]
    next: List[str]

class InterviewResponse(BaseModel):
    reply: str
    tts_text: Optional[str] = None
    done: bool = False
    isFollowUp: Optional[bool] = False
    followUpCount: Optional[int] = 0
    evaluationScore: Optional[int] = None
    mainQuestionCount: Optional[int] = 0
    feedback: Optional[FeedbackResponse] = None
    meta: Optional[Dict[str, Any]] = None

