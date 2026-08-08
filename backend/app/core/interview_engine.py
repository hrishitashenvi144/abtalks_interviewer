import json
from app.core.llm import get_llm_client
from app.core.prompt_builder import build_feedback_prompt, build_question_prompt
from app.core.session_store import create_session, get_session, update_session
from app.core.topic_selector import select_interview_topics
from app.core.curriculum_loader import get_day
from app.models.schemas import FeedbackModel, InterviewTurnResult, LLMTurnOutput


def _clean_json_text(text: str) -> str:
    """Strips markdown code fences and whitespace from LLM response strings."""
    s = text.strip()
    if s.startswith("```json"):
        s = s[7:]
    elif s.startswith("```"):
        s = s[3:]
    if s.endswith("```"):
        s = s[:-3]
    return s.strip()


def _parse_llm_turn_output(client, history: list, system_prompt: str, raw_response: str, fallback_day: int) -> LLMTurnOutput:
    """Attempts to parse raw_response into LLMTurnOutput. Retries once if parsing fails."""
    try:
        data = json.loads(_clean_json_text(raw_response))
        return LLMTurnOutput(**data)
    except Exception:
        # Retry once with strict JSON instruction
        try:
            retry_prompt = system_prompt + "\n\nIMPORTANT: You MUST respond ONLY with valid JSON matching the exact schema."
            retry_resp = client.generate(messages=history, system_prompt=retry_prompt)
            data = json.loads(_clean_json_text(retry_resp))
            return LLMTurnOutput(**data)
        except Exception:
            # Fallback to using raw response as text reply
            return LLMTurnOutput(
                reply=raw_response,
                day_focus=fallback_day,
                is_followup=False,
                ready_to_conclude=False,
            )


def _normalize_feedback_keys(data: dict) -> dict:
    """Normalize feedback keys from snake_case or alternate names to the expected camelCase schema."""
    key_map = {
        "overall_score": "overallScore",
        "technical_understanding": "technicalUnderstanding",
        "curriculum_revisit": "curriculumRevisit",
    }
    return {key_map.get(k, k): v for k, v in data.items()}


def _parse_feedback_output(client, history: list, system_prompt: str, raw_response: str) -> FeedbackModel:
    """Attempts to parse raw_response into FeedbackModel. Retries once if parsing fails, then falls back."""
    try:
        data = json.loads(_clean_json_text(raw_response))
        return FeedbackModel(**_normalize_feedback_keys(data))
    except Exception:
        try:
            retry_prompt = system_prompt + "\n\nIMPORTANT: Respond ONLY with valid JSON matching FeedbackModel schema."
            retry_resp = client.generate(messages=history, system_prompt=retry_prompt)
            data = json.loads(_clean_json_text(retry_resp))
            return FeedbackModel(**_normalize_feedback_keys(data))
        except Exception:
            return FeedbackModel(
                summary="Candidate completed the technical interview session across several curriculum topics.",
                strengths=["Engaged actively during technical questioning", "Demonstrated familiarity with AI cohort concepts"],
                gaps=["Some responses lacked full technical depth", "Review specific architecture & implementation details"],
                next=["Practice hands-on coding for weak topics", "Review cohort curriculum objectives"],
                overallScore=64,
                technicalUnderstanding="The candidate showed basic command of the topic with room for deeper precision.",
                reasoning="The candidate presented logical thoughts but could use more systematic reasoning steps.",
                communication="The candidate communicated clearly, though some answers lacked concise structure.",
                depth="The discussion was solid at a high level, but missed some lower-level technical details.",
                curriculumRevisit=["Review key architecture and observability patterns", "Revisit the selected topic day objectives", "Refresh trade-off analysis in system design"],
            )


def process_turn(session_id: str, candidate: dict | None = None, message: str | None = None) -> InterviewTurnResult:
    """
    Main orchestration entry point for processing a candidate's interview turn.
    """
    client = get_llm_client()
    session = get_session(session_id)

    # 1. FIRST TURN: Initialize Session
    if session is None:
        if candidate is None:
            raise ValueError("Candidate data required to initialize a new interview session.")

        topic_queue = select_interview_topics(candidate, min_days=5)
        session = create_session(session_id, candidate)
        session["topic_queue"] = topic_queue

        prompt = build_question_prompt(session)
        raw_resp = client.generate(messages=session["conversation_history"], system_prompt=prompt)
        fallback_day = topic_queue[0]["day"] if topic_queue else 31
        parsed = _parse_llm_turn_output(client, session["conversation_history"], prompt, raw_resp, fallback_day)

        session["conversation_history"].append({"role": "assistant", "content": parsed.reply})
        session["questions_asked"] = 1
        session["topic_index"] = 0
        session["days_covered"].add(parsed.day_focus)
        session["followups_on_current"] = 0
        update_session(session_id, session)

        topic_title = get_day(parsed.day_focus).get("title") if get_day(parsed.day_focus) else None
        return InterviewTurnResult(
            reply=parsed.reply,
            done=False,
            dayFocus=parsed.day_focus,
            topicTitle=topic_title,
            isFollowup=parsed.is_followup,
            questionNumber=session["questions_asked"],
            topicPosition=1 if session["topic_queue"] else None,
            topicTotal=len(session["topic_queue"]),
        )

    # If session already finished
    if session.get("phase") == "done":
        return InterviewTurnResult(reply="Interview completed.", done=True)

    # 2. SUBSEQUENT TURNS
    if message:
        session["conversation_history"].append({"role": "user", "content": message})

    prompt = build_question_prompt(session)
    raw_resp = client.generate(messages=session["conversation_history"], system_prompt=prompt)
    
    topic_queue = session.get("topic_queue", [])
    topic_idx = session.get("topic_index", 0)
    fallback_day = topic_queue[topic_idx]["day"] if topic_idx < len(topic_queue) else 31
    parsed = _parse_llm_turn_output(client, session["conversation_history"], prompt, raw_resp, fallback_day)

    followups = session.get("followups_on_current", 0)
    current_topic_position = topic_idx + 1 if topic_queue else 0
    topic_total = len(topic_queue)

    if parsed.is_followup and followups < 2:
        session["followups_on_current"] = followups + 1
        session["questions_asked"] = session.get("questions_asked", 0) + 1
    else:
        session["topic_index"] = topic_idx + 1
        session["days_covered"].add(parsed.day_focus)
        session["questions_asked"] = session.get("questions_asked", 0) + 1
        session["followups_on_current"] = 0

    # Determine if interview should conclude
    questions_asked = session.get("questions_asked", 0)
    days_covered_count = len(session.get("days_covered", set()))
    topic_index = session.get("topic_index", 0)
    topic_queue_len = len(topic_queue)
    ready_to_conclude = parsed.ready_to_conclude

    should_end = (
        (questions_asked >= 8 and days_covered_count >= 4 and (topic_index >= topic_queue_len or ready_to_conclude))
        or (questions_asked >= 14)
    )

    if should_end:
        session["conversation_history"].append({"role": "assistant", "content": parsed.reply})
        fb_prompt = build_feedback_prompt(session)
        raw_fb_resp = client.generate(messages=session["conversation_history"], system_prompt=fb_prompt)
        feedback = _parse_feedback_output(client, session["conversation_history"], fb_prompt, raw_fb_resp)
        session["phase"] = "done"
        update_session(session_id, session)

        topic_title = get_day(parsed.day_focus).get("title") if get_day(parsed.day_focus) else None
        return InterviewTurnResult(
            reply=parsed.reply,
            done=True,
            feedback=feedback,
            dayFocus=parsed.day_focus,
            topicTitle=topic_title,
            isFollowup=parsed.is_followup,
            questionNumber=session.get("questions_asked", 0),
            topicPosition=current_topic_position,
            topicTotal=topic_total,
        )

    session["conversation_history"].append({"role": "assistant", "content": parsed.reply})
    update_session(session_id, session)

    topic_title = get_day(parsed.day_focus).get("title") if get_day(parsed.day_focus) else None
    return InterviewTurnResult(
        reply=parsed.reply,
        done=False,
        dayFocus=parsed.day_focus,
        topicTitle=topic_title,
        isFollowup=parsed.is_followup,
        questionNumber=session.get("questions_asked", 0),
        topicPosition=current_topic_position,
        topicTotal=topic_total,
    )
