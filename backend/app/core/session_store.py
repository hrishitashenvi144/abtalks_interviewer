from typing import Any

# Module-level in-memory session store
_SESSIONS: dict[str, dict[str, Any]] = {}


def create_session(session_id: str, candidate: dict) -> dict[str, Any]:
    """
    Creates and stores a new interview session dict.
    """
    session = {
        "candidate": candidate,
        "topic_queue": [],
        "topic_index": 0,
        "questions_asked": 0,
        "days_covered": set(),
        "followups_on_current": 0,
        "conversation_history": [],
        "phase": "questioning",
    }
    _SESSIONS[session_id] = session
    return session


def get_session(session_id: str) -> dict[str, Any] | None:
    """
    Retrieves an existing interview session by session_id, or None if not found.
    """
    return _SESSIONS.get(session_id)


def update_session(session_id: str, session_dict: dict[str, Any]) -> None:
    """
    Updates an existing interview session dict in memory.
    """
    _SESSIONS[session_id] = session_dict
