# Prompts


# Prompts Log

Actual prompts given to Antigravity, in order. Copied verbatim for traceability.

---

## Milestone 0 — Scaffolding

Set up the initial project skeleton for "The Interview Agent" hackathon submission.
["""Set up the initial project skeleton for "The Interview Agent" hackathon submission.

Create this exact folder structure:
/backend
  /app
    /api          (route handlers only)
    /core         (interview engine, prompt builders, session logic)
    /core/llm     (provider abstraction — see below)
    /models       (pydantic schemas)
    /data         (curriculum.json, candidates.json will go here later)
  main.py
  requirements.txt
/frontend
  (Vite + React app, plain JS or TS — your choice, but be consistent)
/docs
  AI_LOG.md
  PROMPTS.md
  DECISIONS.md
  TASKS.md
README.md
.gitignore
.env.example

LLM PROVIDER ABSTRACTION (important):
Create /backend/app/core/llm/base.py defining an abstract interface:
  class LLMClient(ABC):
      def generate(self, messages: list[dict], system_prompt: str) -> str

Create /backend/app/core/llm/gemini_client.py implementing LLMClient using the
google-generativeai SDK (model: gemini-2.5-flash).

Create /backend/app/core/llm/claude_client.py implementing LLMClient using the
anthropic SDK (model: claude-sonnet-4-6), as a second implementation of the
same interface. Do not wire this one up as default — just implement it.

Create /backend/app/core/llm/factory.py with a function get_llm_client() that
reads LLM_PROVIDER from environment (via python-dotenv) and returns the
correct client instance ("gemini" -> GeminiClient, "claude" -> ClaudeClient).
Default to "gemini" if unset.

Do NOT call generate() anywhere yet, and do NOT build any interview logic.
This milestone only proves the abstraction compiles and factory returns the
right instance — add one throwaway test script at /backend/scripts/test_llm.py
that instantiates get_llm_client() and calls generate() with a trivial "say
hello" prompt, just to confirm both providers work when keys are present.
Do not commit this script's output/logs, just the script.

Requirements:
- Backend deps in requirements.txt: fastapi, uvicorn, pydantic, python-dotenv,
  google-generativeai, anthropic
- Frontend: Vite + React, no extra UI framework yet (Tailwind comes later)
- .env.example must include:
    LLM_PROVIDER=gemini
    GEMINI_API_KEY=
    ANTHROPIC_API_KEY=
- .gitignore must exclude .env, node_modules, __pycache__, venv, *.pyc
- main.py boots FastAPI with a single GET /health endpoint returning
  {"status": "ok"}. No interview routes yet.
- README.md: placeholder title + "Setup instructions coming soon"
- DECISIONS.md: log one entry explaining:
    (a) why FastAPI + in-memory state + no vector DB
    (b) why a provider-abstracted LLM layer with Gemini as default dev
        provider and Claude as swappable option for final demo
  Keep it to 5-6 bullet points total.
- TASKS.md: markdown checklist with unchecked items: M0 Scaffolding,
  M1 Curriculum/Candidate data loading, M2 Interview engine core,
  M3 API contract implementation, M4 Frontend chat UI,
  M5 Feedback report generation, M6 Polish + deploy, M7 Docs + demo prep.
- AI_LOG.md and PROMPTS.md: create with just a header each, filled in later.

Do NOT implement any interview logic, prompt engineering, or frontend
components beyond a blank Vite starter in this milestone.

Commit using Conventional Commits, one commit per logical unit:
1. chore: initialize backend structure
2. feat: add LLM provider abstraction (gemini + claude)
3. chore: initialize frontend structure
4. docs: add initial project documentation files

Stop after these commits. Report back exactly what was created, and confirm
whether test_llm.py runs successfully if API keys are available. Do not
proceed to further milestones without my review.



"""]

---

## Milestone 1 — Curriculum Data Loader & Topic Selection Algorithm

## Milestone 4 — Feedback generation and evaluation prompt
Updated the feedback prompt to mandate structured JSON output with explicit assessment dimensions and curriculum guidance:

"""
You are an Expert Technical Interview Assessor summarizing a completed technical interview.

CANDIDATE PROFILE:
- Name: {name}
- Role: {role}

TOPICS COVERED IN INTERVIEW:
{covered topic list}

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
{
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
}
"""

## Milestone 1 — Curriculum Data Loader & Topic Selection Algorithm

Implement the data layer and topic-selection algorithm for the Interview Agent backend.
["""Implement the data layer and topic-selection algorithm for the Interview Agent
backend. Do NOT touch the API routes or LLM calls yet — this milestone is pure
data logic, independently testable.

1. Copy curriculum.json and candidates.json (already provided by the user —
   ask them for the file paths if not present in /backend/app/data/) into
   /backend/app/data/.

2. Create /backend/app/core/curriculum_loader.py:
   - load_curriculum() -> loads and caches curriculum.json
   - get_day(day_number: int) -> dict | None — returns the full day object
     (title, type, tools, objectives)
   - get_module_for_day(day_number: int) -> dict | None — returns module info

3. Create /backend/app/core/topic_selector.py implementing this scoring
   algorithm:

   For each mission in candidate.missions, compute a priority score:
     - skipped == true          -> score += 10
     - passed == false          -> score += 10
     - passed == true AND attempts >= 4  -> score += 6
     - passed == true AND attempts in [2,3] -> score += 2
     - passed == true AND attempts == 1 -> score += 0 (baseline only)

   Function: select_interview_topics(candidate: dict, min_days: int = 5) -> list[dict]
   - Compute scores for all missions.
   - Sort descending by score.
   - Always include day 31 (Capstone) if present in candidate's missions,
     regardless of score, placed LAST in the returned order (used as closing
     question).
   - Select top-scoring days until min_days is reached, but enforce diversity:
     do not pick more than 2 days from the same curriculum module (use
     get_module_for_day to check). Skip lower-scored candidates from an
     over-represented module in favor of the next highest-scored day from a
     different module.
   - Each returned dict should include: day, title, score, reason (a short
     human-readable string explaining WHY this day was selected, e.g.
     "Skipped — testing self-study depth" or "Struggled (4 attempts) —
     verifying understanding" or "Capstone — synthesis question"). This
     `reason` field will later be used to justify the agent's topic choices,
     which is a demo/judging feature — DO NOT skip it.

4. Create /backend/scripts/test_topic_selection.py — a standalone script that
   loads candidates.json, runs select_interview_topics() on 3-4 different
   candidate profiles (pick ones with different signal patterns — e.g. one
   with many skips, one with high first-try rate, one with many retries), and
   prints the selected topics with their reasons. This is for manual
   verification only, do not commit test output/logs.

5. Update DECISIONS.md with a short entry explaining the scoring algorithm
   and why deterministic topic selection (not LLM-driven) was chosen for this
   part of the system — 3-4 bullets.

Do not implement session state, the LLM client wiring, or API routes in this
milestone. Do not modify main.py.

Commit using Conventional Commits:
1. feat: add curriculum data loader
2. feat: add deterministic topic selection algorithm
3. docs: document topic selection rationale in DECISIONS.md

After committing, run test_topic_selection.py and paste its output in your
report back to me. Stop here — do not proceed to session state or API work
without my review of the topic selection output."""]