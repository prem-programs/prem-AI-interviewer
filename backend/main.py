import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from backend.router import router

load_dotenv()

app = FastAPI(
    title="AI Technical Interview Agent",
    description="Adaptive multi-turn AI interview system for 31-day AI Cohort graduates",
    version="1.0.0"
)

# Enable CORS for local React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 Starting AI Technical Interviewer Backend on http://localhost:{port}")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
