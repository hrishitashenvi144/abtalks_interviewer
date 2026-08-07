import json
import sys
from pathlib import Path

# Add backend root to Python path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from dotenv import load_dotenv
load_dotenv()

from app.core.interview_engine import process_turn

CANDIDATES_FILE = backend_root / "app" / "data" / "candidates.json"


def main():
    if not CANDIDATES_FILE.exists():
        print(f"Error: {CANDIDATES_FILE} not found.")
        return

    with open(CANDIDATES_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    candidates = data.get("candidates", [])
    # Find CAND-002 (Alex Turner)
    candidate = next((c for c in candidates if c["member"]["id"] == "CAND-002"), None)
    if not candidate:
        candidate = candidates[0]

    member = candidate["member"]
    session_id = f"test-session-{member['id']}"

    print("=" * 70)
    print(f"STARTING INTERVIEW SESSION WITH: {member['name']} ({member['jobRole']})")
    print(f"Session ID: {session_id}")
    print("=" * 70)
    print()

    # Initial turn to start session
    result = process_turn(session_id=session_id, candidate=candidate, message=None)
    turn_num = 1

    while True:
        print(f"--- Turn {turn_num} [Agent] ---")
        print(result.reply)
        print()

        if result.done:
            print("=" * 70)
            print("INTERVIEW CONCLUDED. FINAL FEEDBACK REPORT:")
            print("=" * 70)
            if result.feedback:
                print(json.dumps(result.feedback.model_dump(), indent=2))
            else:
                print("No feedback generated.")
            break

        try:
            user_input = input("Your Answer > ").strip()
        except EOFError:
            print("\n[Input stream closed]")
            break

        if not user_input:
            user_input = "I am not completely sure about this concept."

        print()
        turn_num += 1
        result = process_turn(session_id=session_id, candidate=None, message=user_input)


if __name__ == "__main__":
    main()
