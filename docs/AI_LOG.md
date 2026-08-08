# AI Development Log

Chronological record of development sessions. Reflects what actually
happened, including detours and fixes — not a cleaned-up narrative.

---

## Session 1 — Milestone 0: Scaffolding
**Agent:** Google Antigravity
- Created backend (FastAPI) and frontend (Vite + React + TS) folder structure
- Implemented `LLMClient` abstract interface with Gemini and Claude
  implementations, plus factory selecting provider via `LLM_PROVIDER` env var
- Added `/health` endpoint to `main.py`
- Initialized docs: AI_LOG.md, PROMPTS.md, DECISIONS.md, TASKS.md
- Commits: [PASTE ACTUAL HASHES]
- Status: complete, pushed to main

## Session 2 — Milestone 1: Curriculum Data & Topic Selection
**Agent:** Google Antigravity
- Implemented `curriculum_loader.py`: `get_day()`, `get_module_for_day()`
- Implemented `topic_selector.py`: deterministic scoring algorithm
  (skipped=10, failed=10, high-attempt pass=6, moderate-attempt pass=2,
  clean pass=0), module-diversity cap (max 2 days/module), capstone
  always included with a human-readable `reason` string per topic
- Verified via `test_topic_selection.py` against all 20 candidate profiles
  — confirmed sensible topic spread and correct prioritization of gaps
  (skipped/failed topics) over clean passes
- Commits: [PASTE ACTUAL HASHES]
- Status: complete, pushed to main

## Session 3 — Milestone 2: Interview Engine Core
**Agent:** Google Antigravity
- Implemented Pydantic schemas (`FeedbackModel`, `InterviewTurnResult`)
- Implemented in-memory `session_store.py` (dict keyed by sessionId)
- Implemented `prompt_builder.py`: `build_question_prompt()` and
  `build_feedback_prompt()`, both instructing the LLM to return structured
  JSON rather than free text
- Implemented `interview_engine.py`: `process_turn()` orchestration —
  backend owns all counting/termination logic (min 8 questions, min 4
  distinct days, max 2 follow-ups per topic before forced advance, hard
  safety cap of 14 questions), LLM only controls content generation
- Added interactive console test script (`test_interview_engine.py`) for
  manual verification without needing the API/frontend built yet
- Verified via a full manual interactive run — confirmed adaptive
  follow-up behavior and correct termination
- Commits: [PASTE ACTUAL HASHES]
- Status: complete, pushed to main

## Session 4 — Quota Exhaustion & Provider Switch
**Issue:** Google Antigravity's usage quota was exhausted with ~24-48 hours
left before submission (quota was to reset only on Aug 14, well past the
deadline).
- Pivoted implementation approach: cloned the repo directly into a
  secondary Claude (Anthropic) sandbox environment with bash/git access,
  to continue work without relying on Antigravity's quota
- Discovered separately: Gemini's free tier for `gemini-2.5-flash` allows
  only 20 requests/day — insufficient for a single full interview session
  (~9-15 LLM calls per run) plus iterative testing. This surfaced as a
  `429 ResourceExhausted` error mid-interview during first live test.
- Added `groq_client.py` implementing the existing `LLMClient` interface,
  using Llama 3.3 70B via Groq's free tier (much higher rate limits, no
  card required)
- Updated `factory.py` to support `LLM_PROVIDER=groq`, added `groq` to
  `requirements.txt`
- Switched default provider to Groq for all development and demo use;
  Gemini and Claude remain available as configured alternatives
- Commits: [PASTE ACTUAL HASHES]
- Status: complete, applied and verified working

## Session 5 — Milestone 3 + 4: API Layer & Frontend
**Agents:** Initially built directly in a Claude sandbox (cloned repo,
implemented, packaged as a tarball for manual application since the
sandbox had no push access); later re-attempted/reconciled via a
VSCode-based coding agent (Cline) after some confusion about which
files existed in which checkout.
- Implemented `POST /api/interview` (routes to `interview_engine.process_turn`,
  handles both session-start and continuation calls, returns clean 400 on
  unknown sessionId)
- Implemented `GET /api/candidates` (demo helper endpoint for the frontend
  candidate picker, not part of the required spec)
- Registered both routers in `main.py`, added permissive CORS middleware
- Built frontend: `CandidateSelect`, `ChatInterview`, `FeedbackReport`
  screens wired to a simple three-state screen state machine
  ("select" -> "interview" -> "feedback")
- Styling: TailwindCSS via CDN, custom graphite/amber/teal/coral palette
  with IBM Plex Mono + Inter typography — intentional "technical session
  log" aesthetic rather than generic AI-hackathon defaults
- **Known friction during this session:** multiple checkouts/agent sessions
  led to temporary confusion about whether frontend files existed; root
  cause was uncommitted work sitting in the working tree across sessions.
  Resolved by auditing `git status` directly and committing what was
  already built rather than rebuilding from scratch.
- Commits: [PASTE ACTUAL HASHES]
- Status: complete, pushed to main

## Session 6 — Bug Fixes: Candidate List & Opening Greeting
**Agent:** VSCode-based coding agent (Cline)
- **Bug 1:** `GET /api/candidates` returned the raw `candidates.json` shape
  (`{"candidates": [...]}`) instead of a plain array, causing
  `Uncaught TypeError: candidates.map is not a function` in the frontend.
  Fixed by returning the unwrapped array.
- **Bug 2:** First interview turn had no opening greeting — jumped straight
  into a technical question. Fixed by adding a conditional instruction in
  `build_question_prompt()`: when `questions_asked == 0`, the LLM opens
  its reply with a brief greeting before the first question.
- **Enhancement:** Extended `InterviewTurnResult` with optional fields
  (`day_focus`, `day_title`, `topic_reason`, `questions_asked`,
  `days_covered_count`) to support a frontend progress indicator and a
  "why this question?" reveal showing the topic-selection reasoning —
  the project's key personalization differentiator, now visible in the UI.
- Commits: [PASTE ACTUAL HASHES]
- Status: complete, verified in browser

## Session 7 — Manual QA / Mock Interview Run
- Ran a full manual interview through the live UI, playing the role of a
  selected candidate profile (the app has no real auth/multi-user system,
  per the technical spec's stated scope — the operator role-plays as the
  chosen candidate to exercise the personalized flow)
- Confirmed adaptive follow-up behavior: a technically strong but
  intentionally opinionated answer (challenging PCA's suitability for
  cluster visualization) produced a genuinely reactive, on-topic follow-up
  rather than a scripted next question
- Observed one anomalous turn where the agent's reply appeared to blend a
  partial answer with its own question (topic: Streamlit session state) —
  suspected a rare LLM JSON-formatting hiccup absorbed by the engine's
  existing retry-once fallback logic. Not reproduced on a second run;
  treated as a known, low-severity, non-blocking risk given the fallback
  already handles malformed responses gracefully.
- Feedback report at interview completion was specific and well-structured
  (not generic filler) — confirmed final output quality is strong
- Status: informal QA complete, no code changes required this session

## Session 8 — Deployment (in progress)
- 