from pydantic import BaseModel


class FeedbackModel(BaseModel):
    summary: str
    strengths: list[str]
    gaps: list[str]
    next: list[str]


class InterviewTurnResult(BaseModel):
    reply: str
    done: bool
    feedback: FeedbackModel | None = None


class LLMTurnOutput(BaseModel):
    reply: str
    day_focus: int
    is_followup: bool
    ready_to_conclude: bool
