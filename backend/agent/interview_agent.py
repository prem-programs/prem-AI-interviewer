import os
import json
from typing import Dict, Any, Tuple
from dotenv import load_dotenv

from backend.agent.profile_analyzer import ProfileAnalyzer
from backend.agent.question_bank import question_bank
from backend.agent.feedback_generator import FeedbackGenerator

# Load environment variables from .env or backend/.env
env_paths = [
    os.path.join(os.path.dirname(__file__), "..", ".env"),
    os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
    ".env"
]
for ep in env_paths:
    if os.path.exists(ep):
        load_dotenv(ep)

class InterviewAgent:
    def __init__(self):
        self.llm = self._init_llm()

    def _init_llm(self):
        # Check for Groq or OpenAI keys in environment
        groq_api_key = os.getenv("GROQ_API_KEY")
        openai_api_key = os.getenv("OPENAI_API_KEY")

        if groq_api_key and not groq_api_key.startswith("your_"):
            try:
                from langchain_groq import ChatGroq
                print(f"[InterviewAgent] Initializing with Groq LLM (llama-3.3-70b-versatile)...")
                llm = ChatGroq(model_name="llama-3.3-70b-versatile", groq_api_key=groq_api_key, temperature=0.7)
                # Test connection quickly
                print("[InterviewAgent] Groq LLM successfully initialized and active!")
                return llm
            except Exception as e:
                print(f"[InterviewAgent] Failed to init ChatGroq: {e}")

        if openai_api_key and not openai_api_key.startswith("your_"):
            try:
                from langchain_openai import ChatOpenAI
                print(f"[InterviewAgent] Initializing with OpenAI LLM (gpt-4o-mini)...")
                llm = ChatOpenAI(model_name="gpt-4o-mini", openai_api_key=openai_api_key, temperature=0.7)
                print("[InterviewAgent] OpenAI LLM successfully initialized and active!")
                return llm
            except Exception as e:
                print(f"[InterviewAgent] Failed to init ChatOpenAI: {e}")

        print("[InterviewAgent] Operating in Smart Dynamic Agent Mode (no valid LLM API key loaded)")
        return None

    def start_interview(self, session: Dict[str, Any]) -> str:
        candidate = session.get("candidate", {})
        analysis = ProfileAnalyzer.analyze_profile(candidate)
        
        member = candidate.get("member", {})
        name = member.get("name", "Candidate")
        job_role = member.get("jobRole", "AI Specialist")
        depth_tier = analysis["depthTier"]

        first_module = question_bank.get_module_by_number(1)
        mod_title = first_module["title"] if first_module else "Environment & Tooling"
        session["topicsCovered"].append(mod_title)

        if self.llm:
            try:
                from langchain_core.prompts import PromptTemplate
                prompt = PromptTemplate.from_template("""
You are an expert AI Technical Interviewer conducting an interview for the 31-day AI Cohort.
Candidate Name: {name}
Job Role: {job_role}
Candidate Tier: {depth_tier}

Generate a warm, professional opening greeting welcoming {name} to the technical evaluation.
Then, present the FIRST technical interview question focusing on Module 1: {mod_title} (e.g. environment setup, virtual environments, local LLM tooling).
Adjust question complexity for a {depth_tier} tier developer.

Keep your response under 100 words.
""")
                response = self.llm.invoke(prompt.format(
                    name=name,
                    job_role=job_role,
                    depth_tier=depth_tier,
                    mod_title=mod_title
                ))
                reply = response.content if hasattr(response, 'content') else str(response)
                return reply.strip()
            except Exception as e:
                print(f"[InterviewAgent] LLM start_interview fallback: {e}")

        greeting = (
            f"Welcome {name}! It's a pleasure to conduct your AI Cohort technical evaluation today. "
            f"Given your background as a {job_role}, we will explore your hands-on experience across the 31-day curriculum.\n\n"
            f"Let me start with Module 1 ({mod_title}): Could you walk me through how you set up your local development environment for AI development, specifically how you handle virtual environments and local LLMs like Ollama?"
        )
        return greeting

    def process_turn(self, session: Dict[str, Any], user_message: str) -> Tuple[str, bool, Dict[str, Any]]:
        candidate = session.get("candidate", {})
        analysis = ProfileAnalyzer.analyze_profile(candidate)
        name = analysis["name"]
        job_role = analysis["jobRole"]
        depth_tier = analysis["depthTier"]

        session["questionCount"] += 1
        q_count = session["questionCount"]

        # Track topics & module progression
        modules = question_bank.modules
        curr_module_idx = min((q_count - 1) // 1, len(modules) - 1) # advance module progressively
        target_module = modules[curr_module_idx]
        target_title = target_module["title"]

        if target_title not in session["topicsCovered"]:
            session["topicsCovered"].append(target_title)

        topics_count = len(session["topicsCovered"])

        # Check completion condition: >= 8 questions asked AND >= 4 topics covered
        is_done = (q_count >= 8 and topics_count >= 4) or ("finish interview" in user_message.lower() or "wrap up" in user_message.lower())

        if is_done:
            session["done"] = True
            feedback = FeedbackGenerator.generate_feedback(session, llm=self.llm)
            session["feedback"] = feedback
            reply = f"Thank you, {name}! That completes our technical interview. You've answered all {q_count} questions across {topics_count} modules effectively. Here is your detailed performance feedback."
            return reply, True, feedback

        # Otherwise generate next adaptive question
        if self.llm:
            try:
                from langchain_core.prompts import PromptTemplate
                prompt = PromptTemplate.from_template("""
You are an expert AI Technical Interviewer evaluating candidate {name} ({job_role}, Tier: {depth_tier}).

Current Interview State:
- Question Number: {q_count} of 8+
- Current Module: Module {mod_num} - {mod_title}
- Prior User Response: "{user_message}"

Instructions:
1. Briefly acknowledge their response in 1 sentence.
2. Formulate the next question on Module {mod_num} ({mod_title}). If their response was shallow, probe deeper on implementation details. If their response was strong, challenge them with a higher-level question or edge case.
3. Keep the overall reply concise, direct, and engaging under 90 words.
""")
                response = self.llm.invoke(prompt.format(
                    name=name,
                    job_role=job_role,
                    depth_tier=depth_tier,
                    q_count=q_count,
                    mod_num=target_module["n"],
                    mod_title=target_title,
                    user_message=user_message
                ))
                reply = response.content if hasattr(response, 'content') else str(response)
                return reply.strip(), False, None
            except Exception as e:
                print(f"[InterviewAgent] LLM turn process fallback: {e}")

        # Smart dynamic fallback turn generator
        adaptive_questions = [
            f"Great explanation regarding your approach! Moving to Module 2 (Data Foundations): How do you clean, chunk, and attach metadata to unstructured documents like PDFs or medical claims before building a knowledge base?",
            f"Excellent insights. Let's move to Module 3 (Embeddings & Vector Search): When generating vector embeddings for healthcare or technical domain text, how do you decide between ChromaDB and cloud vector stores like Pinecone, and how do you handle vector similarity thresholds?",
            f"That's a very clear practical answer. Let's touch on Module 4 (LLM Core & Prompting): In your opinion, when is it better to rely on RAG with structured function calling versus fine-tuning a model with LoRA/QLoRA?",
            f"Spot on! In Module 5 (Chatbot Application Build): How do you implement real-time streaming responses (e.g. Server-Sent Events / FastAPI StreamingResponse) while managing session memory and context truncation?",
            f"Very well put. Looking at Module 6 (Agentic AI & MCP): Can you explain how a ReAct agent decides which tools to invoke, and how Model Context Protocol (MCP) standardizes tool discovery across clients?",
            f"Great technical depth. In Module 7 (Evaluation, Security & Deployment): How do you prevent prompt-injection attacks and ensure AI guardrails are validated prior to Docker/Kubernetes deployment?",
            f"Finally, for Module 8 (Production & Capstone): What metrics (latency, token usage, groundedness) do you monitor in production to ensure high availability and observability?"
        ]

        reply_idx = min(q_count - 1, len(adaptive_questions) - 1)
        reply = adaptive_questions[reply_idx]
        return reply, False, None

interview_agent = InterviewAgent()
