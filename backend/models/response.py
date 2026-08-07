from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class FeedbackResponse(BaseModel):
    summary: str
    strengths: List[str]
    gaps: List[str]
    next: List[str]

class InterviewResponse(BaseModel):
    reply: str
    done: bool = False
    feedback: Optional[FeedbackResponse] = None
    meta: Optional[Dict[str, Any]] = None
