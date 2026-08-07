from typing import Dict, Any, Optional

class SessionStore:
    def __init__(self):
        self._sessions: Dict[str, Dict[str, Any]] = {}

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self._sessions.get(session_id)

    def create_session(self, session_id: str, candidate_data: Dict[str, Any], depth_tier: str) -> Dict[str, Any]:
        session = {
            "sessionId": session_id,
            "candidate": candidate_data,
            "depthTier": depth_tier,
            "questionCount": 0,
            "history": [],
            "topicsCovered": [],
            "daysCovered": [],
            "evaluations": [],
            "done": False,
            "feedback": None
        }
        self._sessions[session_id] = session
        return session

    def update_session(self, session_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if session_id in self._sessions:
            self._sessions[session_id].update(updates)
            return self._sessions[session_id]
        return None

    def delete_session(self, session_id: str):
        if session_id in self._sessions:
            del self._sessions[session_id]

# Singleton instance for the application
session_store = SessionStore()
