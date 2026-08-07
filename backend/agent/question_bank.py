import json
import os
from typing import Dict, Any, List, Optional

class QuestionBank:
    def __init__(self, curriculum_path: str = None):
        if not curriculum_path:
            base_dir = os.path.dirname(os.path.dirname(__file__))
            curriculum_path = os.path.join(base_dir, "data", "curriculum.json")
        
        self.curriculum = {}
        if os.path.exists(curriculum_path):
            with open(curriculum_path, "r", encoding="utf-8") as f:
                self.curriculum = json.load(f)

        self.modules = self.curriculum.get("modules", [])
        self.days_map = {d["day"]: d for d in self.curriculum.get("days", [])}

    def get_module_by_number(self, module_num: int) -> Optional[Dict[str, Any]]:
        for mod in self.modules:
            if mod.get("n") == module_num:
                return mod
        return None

    def get_day_info(self, day_num: int) -> Optional[Dict[str, Any]]:
        return self.days_map.get(day_num)

    def get_module_for_day(self, day_num: int) -> Optional[Dict[str, Any]]:
        for mod in self.modules:
            days = mod.get("days", [])
            if len(days) == 2 and days[0] <= day_num <= days[1]:
                return mod
        return None

    def get_curriculum_summary(self) -> List[Dict[str, Any]]:
        return self.modules

question_bank = QuestionBank()
