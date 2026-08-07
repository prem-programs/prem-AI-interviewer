from typing import Dict, Any, List

class ProfileAnalyzer:
    @staticmethod
    def analyze_profile(candidate: Dict[str, Any]) -> Dict[str, Any]:
        signals = candidate.get("signals", {})
        completed = signals.get("missionsCompleted", 0)
        first_try = signals.get("missionsFirstTry", 0)
        
        ratio = (first_try / completed) if completed > 0 else 0.5
        
        if ratio > 0.8:
            depth_tier = "Expert"
        elif ratio >= 0.5:
            depth_tier = "Intermediate"
        else:
            depth_tier = "Beginner"

        missions = candidate.get("missions", [])
        passed_days = [m["day"] for m in missions if m.get("passed")]
        skipped_days = [m["day"] for m in missions if m.get("skipped")]

        member = candidate.get("member", {})
        
        return {
            "candidateId": member.get("id"),
            "name": member.get("name"),
            "jobRole": member.get("jobRole"),
            "yearsExperience": member.get("yearsExperience", 0),
            "education": member.get("education"),
            "depthTier": depth_tier,
            "firstTryRatio": round(ratio, 2),
            "passedDays": passed_days,
            "skippedDays": skipped_days,
            "missionsCount": len(missions)
        }
