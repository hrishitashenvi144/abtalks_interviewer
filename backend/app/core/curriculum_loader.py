import json
from functools import lru_cache
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CURRICULUM_FILE = DATA_DIR / "curriculum.json"


@lru_cache(maxsize=1)
def load_curriculum() -> dict:
    """
    Loads and caches the curriculum.json data.
    """
    if not CURRICULUM_FILE.exists():
        raise FileNotFoundError(f"Curriculum file not found at: {CURRICULUM_FILE}")
    
    with open(CURRICULUM_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def get_day(day_number: int) -> dict | None:
    """
    Returns the full day object (title, type, tools, objectives) for a given day_number.
    """
    curriculum = load_curriculum()
    for day_obj in curriculum.get("days", []):
        if day_obj.get("day") == day_number:
            return day_obj
    return None


def get_module_for_day(day_number: int) -> dict | None:
    """
    Returns the module info dict for a given day_number based on the module's day range.
    """
    curriculum = load_curriculum()
    for module in curriculum.get("modules", []):
        days_range = module.get("days", [])
        if len(days_range) == 2 and days_range[0] <= day_number <= days_range[1]:
            return module
    return None
