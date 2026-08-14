import time
import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/polls", tags=["Polls"])

class PollOptionCreate(BaseModel):
    text: str

class PollCreateRequest(BaseModel):
    question: str
    options: List[str]
    category: Optional[str] = "General"
    expires_in_hours: Optional[int] = 24

class VoteRequest(BaseModel):
    option_id: str
    voter_id: Optional[str] = "anonymous"

# In-memory storage with rich seed data for immediate evaluation
POLLS_DB = {
    "poll-1": {
        "id": "poll-1",
        "question": "Which Frontend Tech Stack do you prefer for high-performance prototypes?",
        "category": "Engineering",
        "status": "active",
        "created_at": time.time() - 3600 * 3,
        "expires_at": time.time() + 3600 * 21,
        "creator": "Vibe Team",
        "options": [
            {"id": "opt-1", "text": "React + Vite + Vanilla CSS", "votes": 42},
            {"id": "opt-2", "text": "Next.js + Tailwind CSS", "votes": 28},
            {"id": "opt-3", "text": "Vue 3 + Vite + Tailwind", "votes": 15},
            {"id": "opt-4", "text": "SvelteKit + CSS Modules", "votes": 9}
        ],
        "total_votes": 94,
        "is_preset": True
    },
    "poll-2": {
        "id": "poll-2",
        "question": "What is the most valuable AI Feature for Coding Assistants?",
        "category": "AI & Innovation",
        "status": "active",
        "created_at": time.time() - 3600 * 12,
        "expires_at": time.time() + 3600 * 12,
        "creator": "Vibe Team",
        "options": [
            {"id": "opt-201", "text": "Autonomous Agentic Workflows", "votes": 68},
            {"id": "opt-202", "text": "Real-time Live Context Search", "votes": 35},
            {"id": "opt-203", "text": "Instant Code Visualizer & UI Mocks", "votes": 47},
            {"id": "opt-204", "text": "Voice-to-Code Interaction", "votes": 19}
        ],
        "total_votes": 169,
        "is_preset": True
    },
    "poll-3": {
        "id": "poll-3",
        "question": "Where should the Q3 Engineering Team Offsite be hosted?",
        "category": "Team Culture",
        "status": "active",
        "created_at": time.time() - 3600 * 2,
        "expires_at": time.time() + 3600 * 46,
        "creator": "Community",
        "options": [
            {"id": "opt-301", "text": "Goa Beach Resort & Hackathon", "votes": 38},
            {"id": "opt-302", "text": "Manali Mountain Retreat", "votes": 29},
            {"id": "opt-303", "text": "Coorg Coffee Estate & Camping", "votes": 18}
        ],
        "total_votes": 85,
        "is_preset": True
    }
}

@router.get("")
def get_all_polls():
    """Retrieve all active and archived polls sorted by creation time."""
    polls_list = list(POLLS_DB.values())
    polls_list.sort(key=lambda x: x["created_at"], reverse=True)
    return {"status": "success", "polls": polls_list, "count": len(polls_list)}

@router.get("/{poll_id}")
def get_poll(poll_id: str):
    """Get single poll stats."""
    if poll_id not in POLLS_DB:
        raise HTTPException(status_code=404, detail="Poll not found")
    return {"status": "success", "poll": POLLS_DB[poll_id]}

@router.post("")
def create_poll(req: PollCreateRequest):
    """Create a new poll with 3-4 options (validated 2-6 range)."""
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    clean_options = [opt.strip() for opt in req.options if opt.strip()]
    if len(clean_options) < 2:
        raise HTTPException(status_code=400, detail="Poll must have at least 2 options")
    if len(clean_options) > 6:
        raise HTTPException(status_code=400, detail="Poll can have at most 6 options")
        
    poll_id = f"poll-{str(uuid.uuid4())[:8]}"
    options_data = [
        {"id": f"opt-{i+1}-{str(uuid.uuid4())[:4]}", "text": text, "votes": 0}
        for i, text in enumerate(clean_options)
    ]
    
    new_poll = {
        "id": poll_id,
        "question": req.question.strip(),
        "category": req.category or "General",
        "status": "active",
        "created_at": time.time(),
        "expires_at": time.time() + (req.expires_in_hours or 24) * 3600,
        "creator": "You",
        "options": options_data,
        "total_votes": 0,
        "is_preset": False
    }
    
    POLLS_DB[poll_id] = new_poll
    return {"status": "success", "poll": new_poll}

@router.post("/{poll_id}/vote")
def cast_vote(poll_id: str, req: VoteRequest):
    """Cast a vote for an option in the specified poll."""
    if poll_id not in POLLS_DB:
        raise HTTPException(status_code=404, detail="Poll not found")
        
    poll = POLLS_DB[poll_id]
    if poll["status"] != "active":
        raise HTTPException(status_code=400, detail="Poll is closed for voting")
        
    target_option = None
    for opt in poll["options"]:
        if opt["id"] == req.option_id:
            opt["votes"] += 1
            target_option = opt
            break
            
    if not target_option:
        raise HTTPException(status_code=400, detail="Invalid option ID")
        
    poll["total_votes"] += 1
    return {"status": "success", "poll": poll, "voted_option": target_option}

@router.post("/{poll_id}/toggle-status")
def toggle_poll_status(poll_id: str):
    """Toggle poll between active and closed."""
    if poll_id not in POLLS_DB:
        raise HTTPException(status_code=404, detail="Poll not found")
    poll = POLLS_DB[poll_id]
    poll["status"] = "closed" if poll["status"] == "active" else "active"
    return {"status": "success", "poll": poll}
