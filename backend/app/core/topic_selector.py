from app.core.curriculum_loader import get_module_for_day


def compute_mission_score_and_reason(mission: dict) -> tuple[int, str]:
    """
    Computes priority score and reason string for a candidate's mission.
      - skipped == True               -> score = 10
      - passed == False               -> score = 10
      - passed == True and attempts>=4 -> score = 6
      - passed == True and attempts in [2,3] -> score = 2
      - passed == True and attempts == 1 -> score = 0
    """
    skipped = mission.get("skipped", False)
    passed = mission.get("passed", False)
    attempts = mission.get("attempts", 0)

    if skipped:
        return 10, "Skipped — testing self-study depth"
    if not passed:
        return 10, "Failed — testing fundamental concepts"
    if attempts >= 4:
        return 6, f"Struggled ({attempts} attempts) — verifying understanding"
    if attempts in (2, 3):
        return 2, f"Moderate struggle ({attempts} attempts) — reinforcing core concepts"
    return 0, "Baseline — verifying mastery"


def select_interview_topics(candidate: dict, min_days: int = 5) -> list[dict]:
    """
    Selects topics for the candidate's interview session based on priority scoring & diversity rules.

    - Sorts missions descending by score.
    - Day 31 (Capstone) is always included if present in candidate's missions, placed LAST.
    - Diversity rule: max 2 days per curriculum module.
    - Returns list of dicts with keys: 'day', 'title', 'score', 'reason'.
    """
    missions = candidate.get("missions", [])
    if not missions:
        return []

    # Check for Day 31 (Capstone)
    capstone_mission = None
    non_capstone_missions = []

    for m in missions:
        if m.get("day") == 31:
            capstone_mission = m
        else:
            non_capstone_missions.append(m)

    # Calculate score & reason for non-capstone missions
    scored_missions = []
    for m in non_capstone_missions:
        score, reason = compute_mission_score_and_reason(m)
        scored_missions.append({
            "day": m["day"],
            "title": m["title"],
            "score": score,
            "reason": reason
        })

    # Sort descending by score; tie-break deterministically by day number ascending
    scored_missions.sort(key=lambda item: (-item["score"], item["day"]))

    # Target number of non-capstone missions to pick
    target_count = min_days - 1 if capstone_mission else min_days

    # Module tracking to enforce max 2 days per module
    module_counts: dict[int, int] = {}
    
    # Reserve slot in module count for Capstone if present
    if capstone_mission:
        cap_mod = get_module_for_day(31)
        if cap_mod:
            cap_mod_n = cap_mod.get("n", -1)
            module_counts[cap_mod_n] = 1

    selected_topics = []
    for item in scored_missions:
        if len(selected_topics) >= target_count:
            break
        
        mod = get_module_for_day(item["day"])
        mod_n = mod.get("n", -1) if mod else -1
        
        if module_counts.get(mod_n, 0) < 2:
            selected_topics.append(item)
            module_counts[mod_n] = module_counts.get(mod_n, 0) + 1

    # Add Capstone placed LAST if present
    if capstone_mission:
        cap_score, _ = compute_mission_score_and_reason(capstone_mission)
        selected_topics.append({
            "day": capstone_mission["day"],
            "title": capstone_mission["title"],
            "score": cap_score,
            "reason": "Capstone — synthesis question"
        })

    return selected_topics
