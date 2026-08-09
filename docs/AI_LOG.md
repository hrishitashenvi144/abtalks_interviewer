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

---

## Session 8 — Navigation: Sidebar to Top Navbar
**Agent:** Google Antigravity

Convert the existing left-side vertical Sidebar navigation into a horizontal
top navbar instead. Do NOT rebuild the navigation from scratch, do NOT
change what's in it, do NOT modify any other screen's content or logic.

[Full instruction: find existing Sidebar/Nav component and layout code in
App.tsx currently rendering it as a vertical column on the left. Convert to
horizontal top navbar — full-width bar above main content, main content
stacks below at full width. Arrange items horizontally (logo/brand left,
nav links inline), using existing locked color/typography tokens, no new
colors/fonts. Keep exact same active-state highlighting logic, adapted to
horizontal layout. Ensure responsive behavior at mobile widths (wrap or
simple collapse, no heavy new dependency). Keep all click/routing behavior
unchanged — visual/layout change only, not functional.

Constraint: implement only what's listed, no new dependencies unless
unavoidable for mobile collapse, minimize file rewrites — edit existing
component/CSS in place.

Commit: "style: convert sidebar navigation to top navbar". After
committing, verify at desktop and mobile widths, confirm all nav items
still navigate correctly, report back and stop.]

---

## Session 9 — Visual Redesign: Black & White Chrome Design System
**Agent:** Google Antigravity

Unify the entire application under ONE locked black & white "chrome" design
system, replacing the current amber/teal/coral palette entirely. Do NOT
touch functionality, layout structure, component logic, or the interview
engine/API — this is a color/visual system swap only.

[Full instruction: locked grayscale tokens specified (background #0A0A0B,
surface #141416, surface-2 #1C1C1F, border #2A2A2E, text-primary #F5F5F5,
text-muted #8A8A8E), plus a chrome gradient accent
(linear-gradient(135deg, #E8E8EA 0%, #FFFFFF 25%, #B8B8BC 50%, #FFFFFF 75%,
#D0D0D4 100%)) reserved for primary CTAs and active nav state only, with
dark text on top and a subtle glow on hover. Semantic color-coding for
Strengths/Gaps/Recommendations (previously teal/coral/amber) replaced with
icon + border-weight differentiation since color was no longer available.
Typography unchanged (IBM Plex Mono headings, Inter body) — colors only.
Every existing color reference across every component/CSS file to be
audited and replaced systematically, one screen at a time, committing
after each. No layout/structural/functional changes.

CRITICAL ADDITION — text contrast: explicit rule that any element with the
chrome gradient background MUST use near-black text (#0A0A0B), never light
text on top of it; any element on dark surface tokens MUST use light text,
never dark-on-dark. Explicit instruction to check every screen afterward
for inherited wrong-contrast text, specifically calling out button text,
active nav text, badges/pills, input placeholders, and icon+text
combinations as the most likely failure points.

Constraint: implement only what's listed, no new dependencies, minimize
file rewrites. Commit per screen, Conventional Commits. Report audit list
and confirm every item fixed, describe each screen after.]

---

## Session 10 — Manual Edits: Gibberish Push-back, Skip Question, End Interview Now
**No agent available** (both Antigravity accounts exhausted quota, VSCode
agent unavailable at this point). The following exact code edits were
specified and applied manually by hand across four files.

**backend/app/core/prompt_builder.py** — extended the response-evaluation
instruction in `build_question_prompt()`:
> "If the candidate's last answer was shallow, vague, hand-wavy, technically
> inaccurate, gibberish, nonsensical, off-topic, or clearly not a genuine
> attempt (e.g. random characters, 'idk', one-word non-answers, empty
> effort), do NOT treat it as a valid answer and do NOT move to a new topic.
> Instead, set 'is_followup': true and respond with a brief, professional
> push-back that names the issue and re-asks the same core question in a
> slightly different way... Only treat an answer as valid if it shows some
> genuine technical engagement, even if imperfect."

**backend/app/api/interview.py** — extended `InterviewRequest` with
`skip: bool | None = None` and `endNow: bool | None = None`; extended the
routing condition from checking only `payload.message is not None` to
`payload.message is not None or payload.skip or payload.endNow`, passing
both flags through to `process_turn()`.

**backend/app/core/interview_engine.py** — extended `process_turn()`
signature with `skip: bool = False, end_now: bool = False`. Added handling:
`end_now` immediately triggers feedback generation on the conversation so
far and returns `done=True`, bypassing normal minimum-question/day
requirements (explicit user override). `skip` force-advances the topic
index, adds the current day to `days_covered`, increments question count,
and resets the follow-up counter — without calling the LLM to evaluate an
answer.

**frontend/src/lib/api.ts** — added `skipQuestion(sessionId)` and
`endInterviewNow(sessionId)` functions mirroring the existing `sendMessage`
pattern.

**frontend/src/components/ChatInterview.tsx** — added "Skip Question" and
"End Interview" buttons to the input footer, the latter behind a
`window.confirm()` guard, both calling their respective new API functions
and handling the response identically to a normal turn.

**Bug found and fixed during this session:** an initial partial application
of the `interview.py` edit (schema updated, routing logic not yet updated)
caused Skip/End Interview to incorrectly return the old
"Request must include either 'candidate' or 'message'" error. Diagnosed via
the exact error message matching stale code, corrected by completing the
routing logic edit.

---

## Session 11 — PDF Feedback Report: Text Truncation Fix
A bug was identified where competency breakdown descriptions in the
downloadable PDF feedback report were being cut off mid-sentence (a text-
wrapping/overflow issue in the PDF generation code). This was diagnosed
and fixed outside the scope of this logged conversation; exact prompt/edit
text not captured here. Verified fixed — PDF now renders full, readable
competency descriptions.

---

## Session 12 — Full Redeploy & Reliability Hardening
Not agent-implementation prompts — infrastructure/ops steps performed
directly by the developer with guidance:
- Deleted and recreated both Render (backend) and Vercel (frontend)
  hosting projects from scratch as a precautionary clean-start measure
- Re-configured environment variables (`LLM_PROVIDER`, `GROQ_API_KEY` on
  Render; `VITE_API_BASE_URL` on Vercel) before each service's first build,
  to avoid the earlier-discovered issue where Vercel doesn't auto-rebuild
  on env-var-only changes
- Configured an external keep-alive cron (cron-job.org, free tier) pinging
  `/health` every 10 minutes to prevent Render free-tier cold-start delays
  from affecting judge-facing load times

---

## Session 13 — Final README Rewrite
Drafted by Claude (this assistant) directly at the developer's request,
given the submission format is repo + live link + docs only (no live
pitch). Content covers: live demo link, a "try it in 30 seconds" judge
walkthrough, an explanation of the personalization/deterministic-topic-
selection and answer-dependent-follow-up design (the project's key
differentiators), architecture summary, the exact API contract verified
field-by-field against technical-spec.md, local run instructions, and
links to all docs/ files.
- 