from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.interview_engine import process_turn
from app.core.session_store import get_session
from app.models.schemas import InterviewTurnResult

router = APIRouter()


class InterviewRequest(BaseModel):
    sessionId: str
    candidate: dict | None = None
    message: str | None = None
    skip: bool | None = None
    endNow: bool | None = None


@router.post("/api/interview", response_model=InterviewTurnResult, response_model_exclude_none=True)
def interview_turn(payload: InterviewRequest) -> InterviewTurnResult:
    """
    Single endpoint driving the full interview flow per the technical spec.

    - First call: payload.candidate is present -> starts a new session.
    - Subsequent calls: payload.message is present -> continues the session.
    """
    if payload.candidate is not None:
        return process_turn(payload.sessionId, candidate=payload.candidate, message=None)

    if payload.message is not None or payload.skip or payload.endNow:
        existing = get_session(payload.sessionId)
        if existing is None:
            raise HTTPException(
                status_code=400,
                detail=f"No active interview session found for sessionId '{payload.sessionId}'. "
                       f"Start a new interview by sending 'candidate' in the request body.",
            )
        return process_turn(
            payload.sessionId,
            candidate=None,
            message=payload.message,
            skip=bool(payload.skip),
            end_now=bool(payload.endNow),
        )

    raise HTTPException(
        status_code=400,
        detail="Request must include either 'candidate' (to start a session) or 'message' (to continue one).",
    )
