import json
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter

router = APIRouter()

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CANDIDATES_FILE = DATA_DIR / "candidates.json"


@lru_cache(maxsize=1)
def _load_candidates() -> list[dict]:
    with open(CANDIDATES_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("candidates", [])


@router.get("/api/candidates")
def list_candidates() -> list[dict]:
    """
    Demo helper endpoint (not part of the required spec) so the frontend can
    let a user pick which candidate profile to interview.
    """
    return _load_candidates()
