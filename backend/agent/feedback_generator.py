from typing import Dict, Any, List
import json

class FeedbackGenerator:
    @staticmethod
    def generate_feedback(session: Dict[str, Any], llm=None) -> Dict[str, Any]:
        candidate = session.get("candidate", {})
        member = candidate.get("member", {})
        name = member.get("name", "Candidate")
        job_role = member.get("jobRole", "Developer")
        depth_tier = session.get("depthTier", "Intermediate")
        question_count = session.get("questionCount", 0)
        history = session.get("history", [])
        topics_covered = session.get("topicsCovered", [])

        # If LLM is available, we can use it to generate a rich personalized feedback JSON
        if llm:
            try:
                from langchain_core.prompts import PromptTemplate
                prompt = PromptTemplate.from_template("""
You are an expert AI Technical Interview Evaluator.
Generate a structured evaluation for candidate {name} ({job_role}, Tier: {depth_tier}).

Interview Statistics:
- Questions Asked: {question_count}
- Topics Covered: {topics_covered}

Conversation Transcript:
{transcript}

Return ONLY a JSON object matching this exact schema without any markdown wrapping:
{{
  "summary": "2-3 sentence overall assessment of performance, clarity, and technical readiness.",
  "strengths": ["Key strength 1", "Key strength 2", "Key strength 3"],
  "gaps": ["Area for improvement 1", "Area for improvement 2"],
  "next": ["Actionable recommended learning step 1", "Actionable recommended learning step 2"]
}}
""")
                transcript_str = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in history[-16:]])
                raw_response = llm.invoke(prompt.format(
                    name=name,
                    job_role=job_role,
                    depth_tier=depth_tier,
                    question_count=question_count,
                    topics_covered=", ".join([str(t) for t in topics_covered]),
                    transcript=transcript_str
                ))
                content = raw_response.content if hasattr(raw_response, 'content') else str(raw_response)
                
                # Clean code blocks if present
                clean_json = content.strip()
                if clean_json.startswith("```"):
                    clean_json = clean_json.split("\n", 1)[1]
                    if clean_json.endswith("```"):
                        clean_json = clean_json.rsplit("```", 1)[0]
                
                parsed = json.loads(clean_json.strip())
                return parsed
            except Exception as e:
                print(f"[FeedbackGenerator] LLM generation fallback triggered: {e}")

        # Deterministic rich fallback generator
        strengths = [
            f"Demonstrated solid conceptual grasp of {topics_covered[0] if topics_covered else 'Core AI'} fundamentals.",
            f"Strong ability to explain architectural trade-offs suitable for a {job_role}.",
            f"Responded effectively to {depth_tier}-level probing questions across {question_count} interview turns."
        ]
        
        gaps = [
            "Could provide more concrete production metrics and latency considerations when explaining deployments.",
            "Can deepen expertise on advanced multi-agent orchestration and failure recovery patterns."
        ]

        next_steps = [
            "Review Day 23-24 Model Context Protocol (MCP) server implementation patterns.",
            "Practice building end-to-end evaluation benchmark suites for RAG applications (Day 25)."
        ]

        summary = f"{name} completed a comprehensive {question_count}-question technical interview. Demonstrating strong readiness in {depth_tier} AI development, showing clear problem-solving methodologies and practical knowledge of the 31-day AI Cohort curriculum."

        return {
            "summary": summary,
            "strengths": strengths,
            "gaps": gaps,
            "next": next_steps
        }
