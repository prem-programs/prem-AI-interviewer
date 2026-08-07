from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class MemberInfo(BaseModel):
    id: str
    name: str
    jobRole: str
    yearsExperience: int
    education: str
    status: str

class MissionInfo(BaseModel):
    day: int
    title: str
    passed: Optional[bool] = None
    skipped: Optional[bool] = None
    attempts: Optional[int] = None

class SignalsInfo(BaseModel):
    commitDays: int
    missionsCompleted: int
    missionsFirstTry: int

class CandidateProfile(BaseModel):
    member: MemberInfo
    missions: List[MissionInfo]
    signals: SignalsInfo

class InterviewRequest(BaseModel):
    sessionId: str = Field(..., description="Unique session identifier for tracking state")
    candidate: Optional[Dict[str, Any]] = Field(None, description="Candidate details provided on start")
    message: Optional[str] = Field(None, description="Candidate response text provided on turn")
