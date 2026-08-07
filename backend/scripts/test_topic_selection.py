import json
import sys
from pathlib import Path

# Add backend root to Python path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.core.topic_selector import select_interview_topics

CANDIDATES_FILE = backend_root / "app" / "data" / "candidates.json"


def main():
    if not CANDIDATES_FILE.exists():
        print(f"Error: {CANDIDATES_FILE} not found.")
        return

    with open(CANDIDATES_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    candidates = data.get("candidates", [])
    print(f"Loaded {len(candidates)} candidate profiles.\n")

    # Select 4 representative candidates with different signal patterns
    target_ids = ["CAND-001", "CAND-002", "CAND-003", "CAND-004"]
    selected_candidates = [c for c in candidates if c["member"]["id"] in target_ids]

    for candidate in selected_candidates:
        member = candidate["member"]
        signals = candidate.get("signals", {})
        print("=" * 70)
        print(f"CANDIDATE: {member['id']} - {member['name']} ({member['jobRole']})")
        print(f"Signals: {signals.get('missionsCompleted')}/31 completed, {signals.get('missionsFirstTry')} first-try, {signals.get('commitDays')} commit days")
        print("-" * 70)

        topics = select_interview_topics(candidate, min_days=5)

        for i, topic in enumerate(topics, 1):
            print(f"  Topic {i}: Day {topic['day']:2d} | Score: {topic['score']:2d} | {topic['title']}")
            print(f"           Reason: {topic['reason']}")
        print()


if __name__ == "__main__":
    main()
