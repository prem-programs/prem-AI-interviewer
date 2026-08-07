import sys
import os
import json
from fastapi.testclient import TestClient

# Ensure root workspace is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    print("[PASS] Health check passed!")

def test_get_candidates():
    response = client.get("/api/candidates")
    assert response.status_code == 200
    data = response.json()
    assert "candidates" in data
    assert len(data["candidates"]) == 20
    print(f"[PASS] Candidates endpoint passed! Found {len(data['candidates'])} candidates.")

def test_full_interview_flow():
    session_id = "test-session-999"
    
    # 1. Start Interview
    with open(os.path.join(os.path.dirname(__file__), "data", "candidates.json"), "r") as f:
        candidates_data = json.load(f)
    first_candidate = candidates_data["candidates"][0]

    start_payload = {
        "sessionId": session_id,
        "candidate": first_candidate
    }

    start_res = client.post("/api/interview", json=start_payload)
    assert start_res.status_code == 200
    start_json = start_res.json()
    assert start_json["done"] is False
    assert "reply" in start_json
    print(f"[PASS] Start interview response: {start_json['reply'][:60]}...")

    # 2. Conduct 8 turn messages
    turns = [
        "I set up VS Code with Virtual Environments and Ollama running llama3.",
        "For structured data I use Pandas and SQLite, for unstructured I use pdfplumber and python-docx.",
        "I use ChromaDB locally with SentenceTransformers for generating embeddings and metadata filtering.",
        "I use RAG with OpenAI SDK and prompt engineering with chain-of-thought system prompts.",
        "I build FastAPI backend with chat endpoints and Streamlit/React frontend.",
        "I use LangChain ReAct agents and MCP protocol for tool integration.",
        "I implement API authentication, input sanitization, and deploy with Docker containers.",
        "I monitor latency and token usage using Prometheus and Python logging."
    ]

    for idx, msg in enumerate(turns):
        turn_res = client.post("/api/interview", json={"sessionId": session_id, "message": msg})
        assert turn_res.status_code == 200
        turn_json = turn_res.json()
        print(f"Turn {idx+1} (QCount: {turn_json.get('meta', {}).get('questionCount')}) -> Done: {turn_json['done']}")

        if turn_json["done"]:
            assert "feedback" in turn_json
            feedback = turn_json["feedback"]
            assert "summary" in feedback
            assert len(feedback["strengths"]) > 0
            assert len(feedback["gaps"]) > 0
            assert len(feedback["next"]) > 0
            print("[PASS] Final Feedback schema successfully verified!")
            print(json.dumps(feedback, indent=2))
            break

if __name__ == "__main__":
    print("Running Backend Tests...")
    test_health()
    test_get_candidates()
    test_full_interview_flow()
    print("ALL BACKEND TESTS PASSED SUCCESSFULLY!")
