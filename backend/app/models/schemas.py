from pydantic import BaseModel


class FeedbackModel(BaseModel):
    summary: str
    strengths: list[str]
    gaps: list[str]
    next: list[str]
    overallScore: int | None = None
    technicalUnderstanding: str | None = None
    reasoning: str | None = None
    communication: str | None = None
    depth: str | None = None
    curriculumRevisit: list[str] = []


class InterviewTurnResult(BaseModel):
    reply: str
    done: bool
    feedback: FeedbackModel | None = None
    dayFocus: int | None = None
    topicTitle: str | None = None
    isFollowup: bool | None = None
    questionNumber: int | None = None
    topicPosition: int | None = None
    topicTotal: int | None = None


class LLMTurnOutput(BaseModel):
    reply: str
    day_focus: int
    is_followup: bool
    ready_to_conclude: bool
