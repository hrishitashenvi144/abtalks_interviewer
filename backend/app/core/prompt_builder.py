import json
from app.core.curriculum_loader import get_day


def build_question_prompt(session: dict) -> str:
    """
    Builds system prompt for generating the next interview question or follow-up.
    """
    candidate = session.get("candidate", {})
    member = candidate.get("member", {})
    name = member.get("name", "Candidate")
    role = member.get("jobRole", "Software Engineer")
    years_exp = member.get("yearsExperience", "N/A")

    topic_queue = session.get("topic_queue", [])
    topic_index = session.get("topic_index", 0)

    if topic_index < len(topic_queue):
        current_topic = topic_queue[topic_index]
    elif topic_queue:
        current_topic = topic_queue[-1]
    else:
        current_topic = {"day": 31, "title": "Capstone Project", "reason": "Capstone — synthesis question"}

    day_num = current_topic.get("day", 31)
    topic_title = current_topic.get("title", "")
    selection_reason = current_topic.get("reason", "")

    day_details = get_day(day_num) or {}
    day_tools = day_details.get("tools", [])
    day_objectives = day_details.get("objectives", [])

    followups_on_current = session.get("followups_on_current", 0)
    questions_asked = session.get("questions_asked", 0)

    prompt = f"""You are a Senior Technical Interviewer conducting a live interactive technical interview.

CANDIDATE PROFILE:
- Name: {name}
- Job Role: {role}
- Experience: {years_exp} years

CURRENT TOPIC FOCUS (Day {day_num}):
- Title: {topic_title}
- Background Selection Reason: {selection_reason}
- Relevant Tools/Tech: {', '.join(day_tools) if day_tools else 'N/A'}
- Topic Objectives: {'; '.join(day_objectives) if day_objectives else 'N/A'}
- Follow-ups asked so far on this topic: {followups_on_current}/2
- Total questions asked across interview: {questions_asked}

INTERVIEW CONDUCT RULES:
1. Ask exactly ONE clear, targeted question at a time. Maintain an engaging, professional, conversational tone like a real senior staff engineer.
2. Use the background selection reason to guide your questioning strategy naturally, but NEVER read out the background selection reason or raw scores verbatim to the candidate.
3. EVALUATE PREVIOUS RESPONSE: If the candidate's last answer was shallow, vague, hand-wavy, or technically inaccurate, ask a targeted technical follow-up on this SAME day focus (set "is_followup": true). When probing weak answers, use "why?" or ask about trade-offs, edge cases, or implementation details.
4. If the candidate's answer is strong and shows clear reasoning, move on to the next topic or a broader exploration of the area (set "is_followup": false). Avoid repeating the same question.
5. If follow-ups on the current topic reach 2, set "is_followup": false to move on.
6. Set "ready_to_conclude": true ONLY if all key planned topics have been adequately explored and you have sufficient technical signal. Otherwise set false.

CRITICAL OUTPUT REQUIREMENT:
Respond ONLY with a single JSON object. No markdown code block formatting (no ```json fences), no preamble, no commentary before or after.
Exact JSON schema:
{{
  "reply": "<your question or follow-up text to the candidate>",
  "day_focus": {day_num},
  "is_followup": <true|false>,
  "ready_to_conclude": <true|false>
}}"""
    return prompt


def build_feedback_prompt(session: dict) -> str:
    """
    Builds system prompt for final feedback report synthesis.
    """
    candidate = session.get("candidate", {})
    member = candidate.get("member", {})
    name = member.get("name", "Candidate")
    role = member.get("jobRole", "Software Engineer")

    history = session.get("conversation_history", [])
    formatted_history = []
    for msg in history:
        r = "Interviewer" if msg.get("role") == "assistant" else "Candidate"
        formatted_history.append(f"{r}: {msg.get('content', '')}")

    history_str = "\n".join(formatted_history)

    topic_queue = session.get("topic_queue", [])
    days_covered = session.get("days_covered", set())
    covered_topics_info = [
        f"Day {t['day']}: {t['title']} ({t['reason']})"
        for t in topic_queue if t['day'] in days_covered
    ]
    if not covered_topics_info:
        covered_topics_info = [f"Day {t['day']}: {t['title']}" for t in topic_queue]

    prompt = f"""You are an Expert Technical Interview Assessor summarizing a completed technical interview.

CANDIDATE PROFILE:
- Name: {name}
- Role: {role}

TOPICS COVERED IN INTERVIEW:
{chr(10).join('- ' + item for item in covered_topics_info)}

FULL INTERVIEW TRANSCRIPT:
{history_str}

FEEDBACK GENERATION INSTRUCTIONS:
1. Produce an objective, thorough technical assessment based strictly on the transcript above.
2. "summary": Provide a concise 2-3 sentence overall evaluation of the candidate's technical demonstration, depth, and communication skills.
3. "technicalUnderstanding": Provide a 1-2 sentence statement describing the candidate's grasp of core technical concepts and domain knowledge.
4. "reasoning": Provide a 1-2 sentence statement describing the candidate's problem-solving clarity, structure, and analytical strength.
5. "communication": Provide a 1-2 sentence statement describing the candidate's ability to explain ideas clearly and confidently.
6. "depth": Provide a 1-2 sentence statement describing how deeply the candidate engaged with technical details versus staying high level.
7. "curriculumRevisit": Provide 3-5 concrete curriculum topics, days, or concept areas the candidate should revisit based on the interview.
8. "strengths": Provide 3-5 specific, actionable bullet points highlighting areas where the candidate demonstrated solid technical knowledge or strong problem-solving. Refer to specific topics discussed.
9. "gaps": Provide 3-5 specific, actionable bullet points detailing technical deficiencies, superficial answers, or missed concepts observed during the interview. Refer to specific topics discussed.
10. "next": Provide 3-5 concrete, practical recommendations for what the candidate should study or practice next to improve.

CRITICAL OUTPUT REQUIREMENT:
Respond ONLY with a single JSON object. No markdown code block formatting (no ```json fences), no preamble, no trailing text.
Exact JSON schema matching FeedbackModel:
{{
  "summary": "<2-3 sentence overview>",
  "overallScore": <integer 1-100>,
  "technicalUnderstanding": "<summary of technical understanding>",
  "reasoning": "<summary of reasoning>",
  "communication": "<summary of communication>",
  "depth": "<summary of depth>",
  "curriculumRevisit": ["<topic 1>", "<topic 2>", "<topic 3>"],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "gaps": ["<gap 1>", "<gap 2>", "<gap 3>"],
  "next": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"]
}}"""
    return prompt
