# Prompts Log

Actual prompts given to implementation agents, in chronological order.
Preserved verbatim for traceability. Cross-referenced with docs/AI_LOG.md
session numbers.

---

## Session 1 — Milestone 0: Scaffolding
**Agent:** Google Antigravity

Set up the initial project skeleton for "The Interview Agent" hackathon submission.

Create this exact folder structure:
/backend
  /app
    /api          (route handlers only)
    /core         (interview engine, prompt builders, session logic)
    /core/llm     (provider abstraction)
    /models       (pydantic schemas)
    /data         (curriculum.json, candidates.json will go here later)
  main.py
  requirements.txt
/frontend
  (Vite + React app)
/docs
  AI_LOG.md
  PROMPTS.md
  DECISIONS.md
  TASKS.md
README.md
.gitignore
.env.example

LLM PROVIDER ABSTRACTION:
Create /backend/app/core/llm/base.py defining an abstract interface:
  class LLMClient(ABC):
      def generate(self, messages: list[dict], system_prompt: str) -> str

Create gemini_client.py (google-generativeai SDK, gemini-2.5-flash) and
claude_client.py (anthropic SDK, claude-sonnet-4-6) as two implementations
of the same interface. Create factory.py with get_llm_client() reading
LLM_PROVIDER from environment, defaulting to "gemini".

main.py boots FastAPI with a single GET /health endpoint. No interview
routes yet. DECISIONS.md logs rationale for FastAPI + in-memory state +
no vector DB, and for the LLM provider abstraction. TASKS.md lists all
milestones M0-M7 as unchecked.

Commit using Conventional Commits, one commit per logical unit. Stop after
scaffolding — do not implement interview logic yet.

---

## Session 2 — Milestone 1: Curriculum Data & Topic Selection
**Agent:** Google Antigravity

Implement the data layer and topic-selection algorithm for the Interview
Agent backend. Do NOT touch API routes or LLM calls yet.

1. curriculum_loader.py: load_curriculum(), get_day(day_number), 
   get_module_for_day(day_number)

2. topic_selector.py implementing this scoring algorithm:
   - skipped == true → score += 10
   - passed == false → score += 10
   - passed == true AND attempts >= 4 → score += 6
   - passed == true AND attempts in [2,3] → score += 2
   - passed == true AND attempts == 1 → score += 0

   select_interview_topics(candidate, min_days=5):
   - Sort by score descending
   - Always include Day 31 (Capstone) placed last, as closing question
   - Enforce module diversity: max 2 days per module
   - Each result includes: day, title, score, reason (human-readable
     explanation, e.g. "Skipped — testing self-study depth")

3. test_topic_selection.py: run against 3-4 candidate profiles with
   different signal patterns, print results.

4. DECISIONS.md entry explaining why topic selection is deterministic,
   not LLM-driven.

Commit using Conventional Commits. Run test_topic_selection.py and report
output. Stop — do not proceed to session state or API work without review.

---

## Session 3 — Milestone 2: Interview Engine Core
**Agent:** Google Antigravity

Implement the Interview Engine core. Do NOT build API routes or touch
main.py — that is a later milestone.

1. models/schemas.py: FeedbackModel, InterviewTurnResult, LLMTurnOutput
   (internal, for parsing LLM JSON responses: reply, day_focus,
   is_followup, ready_to_conclude)

2. core/session_store.py: in-memory dict keyed by sessionId. Session
   shape: candidate, topic_queue, topic_index, questions_asked,
   days_covered (set), followups_on_current, conversation_history, phase.
   Functions: create_session, get_session, update_session.

3. core/prompt_builder.py:
   a) build_question_prompt(session): includes candidate info, current
      topic (day title/objectives/tools + reason string), instructs
      LLM to ask one question at a time conversationally, decide
      is_followup based on whether previous answer was shallow/incorrect
      vs solid, respond ONLY with valid JSON matching the schema.
   b) build_feedback_prompt(session): includes full conversation history,
      days covered, instructs LLM to respond ONLY with FeedbackModel JSON
      shape, summary 2-3 sentences, strengths/gaps/next each 3-5 concise
      actionable points referencing actual topics discussed.

4. core/interview_engine.py: process_turn(session_id, candidate, message)
   - First call: run select_interview_topics(), create session, call LLM
     for first topic, return InterviewTurnResult(done=False)
   - Subsequent calls: append message, call LLM, parse JSON (retry once
     on failure, then fallback to raw text)
   - Update counters: is_followup + followups_on_current < 2 → increment
     followups, don't advance topic; else advance topic_index, add
     day_focus to days_covered, reset followups_on_current
   - should_end = (questions_asked >= 8 AND days_covered >= 4 AND
     (topic_index >= len(topic_queue) OR ready_to_conclude)) OR
     questions_asked >= 14 (hard safety cap)
   - If should_end: call build_feedback_prompt(), parse into FeedbackModel
     (retry-once-then-fallback, never crash), return done=True + feedback

5. scripts/test_interview_engine.py: interactive console script — pick a
   candidate, loop process_turn() with input() for simulated answers
   until done=True, print final feedback JSON.

Commit using Conventional Commits. Run test_interview_engine.py
interactively, paste full transcript including feedback JSON. Stop —
do not build API routes or frontend without review.

---

## Session 4 — Groq Fallback Provider
**Context:** Gemini free tier hit a 20 requests/day limit mid-testing
(ResourceExhausted 429), insufficient for a full interview session
(~9-15 calls) plus iteration. Implemented directly (not via an agent)
in a Claude sandbox with bash/git access, since Antigravity's own quota
was separately exhausted around this time.

Add Groq as a new LLMClient implementation:
- groq_client.py implementing the existing LLMClient interface
  (generate(messages, system_prompt) -> str), using Llama 3.3 70B via
  the Groq SDK, reading GROQ_API_KEY from environment.
- Update factory.py to support LLM_PROVIDER=groq.
- Update llm/__init__.py exports.
- Add groq to requirements.txt.

Verified imports resolve cleanly. Packaged as a tarball for manual
application since the sandbox had no push access to the user's repo.

---

## Session 5 — Milestone 3 + 4: API Layer & Frontend (Initial Build)
**Context:** Built directly in a Claude sandbox (cloned the repo,
implemented, packaged as a tarball) after Antigravity's quota was
exhausted. This build was later found to be incompletely applied/
committed, leading to confusion resolved in Session 6-7 below.

Implement the API layer and frontend for the Interview Agent, wiring
both to the already-built interview_engine.py. Do NOT modify
interview_engine.py, prompt_builder.py, session_store.py, or
topic_selector.py.

BACKEND:
1. POST /api/interview — routes to process_turn() for both session-start
   (candidate present) and continuation (message present) calls. HTTP 400
   on unknown sessionId for message-only calls.
2. GET /api/candidates — returns candidate list from candidates.json
   (demo helper, not part of required spec).
3. Register both routers in main.py, add CORSMiddleware(allow_origins=["*"]).

FRONTEND:
TailwindCSS via CDN. Single-page app, state machine: "select" ->
"interview" -> "feedback". VITE_API_BASE_URL env var.

1. CandidateSelect: GET /api/candidates, render as cards (name, role,
   stat line). Click generates sessionId via crypto.randomUUID(), POSTs
   to start interview.
2. ChatInterview: chat bubbles, auto-scroll, typing indicator, POST on
   send, transitions to feedback screen when done=true.
3. FeedbackReport: sectioned card-based report (Summary, Strengths, Gaps,
   Next Steps), not a JSON dump. "Start New Interview" button.

Mobile-friendly, no horizontal scroll. Commit using Conventional Commits.

---

## Session 5b — VSCode Agent Takeover: Autonomous Build Mode
**Agent:** VSCode-based coding agent (Cline)

STOP AUDITING. We have already verified the backend and API manually.
From this point forward, switch into AUTONOMOUS BUILD MODE.

[Full instruction: reuse existing architecture (FastAPI backend, React/
Vite frontend, candidate/curriculum data, topic selection, interview
engine, LLM abstraction, session memory, prompt builders, existing APIs,
basic UI components) — do not rebuild.

Priority order: 1) make complete interview flow work end-to-end,
2) polished professional frontend, 3) genuinely adaptive interviewer,
4) intelligent answer-referencing follow-ups, 5) impressive feedback
report, 6) graceful loading/error states, 7) demo reliability, 8) final
polish.

Core experience specified: candidate selects profile → personalized
interview starts → AI evaluates answers internally → chooses next
question/follow-up → difficulty adapts → context maintained → covers
multiple curriculum days → structured feedback.

UI direction: premium, modern, clean dark/light system, strong
typography, generous spacing, subtle animations, professional dashboard
feel, clear progress indicators.

Features specified for candidate selection, interview screen, and
feedback screen (score, technical understanding, reasoning,
communication, depth, strengths, weaknesses, recommendations, curriculum
areas to revisit, summary).

Engineering rules: reuse existing architecture, avoid unnecessary deps,
avoid rewriting working modules, keep TypeScript strict, don't introduce
databases/state-management libraries, don't change LLM providers, don't
create fake data to hide backend failures.

Required: maintain AI_LOG.md and PROMPTS.md throughout, Conventional
Commits per milestone, don't push unless instructed, don't repeatedly
kill/restart servers or spend most of the task narrating diagnostics —
inspect then build, only stop for major architectural decisions or
missing credentials.]

---

## Session 5c — Adaptive Interview Evaluation Flow
**Agent:** VSCode-based coding agent (Cline)

The current interview flow is functional, but after testing it manually
I see a major product problem: it feels like a generic chatbot asking an
unlimited sequence of technically related questions. We need to
transform it into a REAL adaptive AI interview product.

[Full instruction: do not rebuild, modify existing engine and UI.

Core design: ~6-8 questions but adaptive, not a fixed rule — terminate
when enough evidence collected across competencies, or ask 1-2 extra
targeted questions if evidence is missing.

Question strategy: cover different competencies rather than repeating
one topic. Guideline structure: foundation → applied technical →
scenario/problem-solving → adaptive follow-up → another
competency/domain → higher difficulty → targeted weakness probe →
optional synthesis question. Not rigid — AI decides based on
demonstrated ability.

Adaptive behavior: after every answer, internally assess correctness,
depth, reasoning, confidence, communication, misconceptions, missing
knowledge, competency evidence. Decide: increase difficulty / targeted
follow-up / move to another competency / probe a weakness / conclude.

Follow-ups must be answer-dependent — explicit example given contrasting
a generic follow-up vs one referencing the candidate's specific prior
answer (Prometheus/high-cardinality labels example).

Competency tracking: internal evidence state per session (e.g.
"Technical Fundamentals: strong, System Design: weak"), prioritize weak/
insufficient-evidence areas. Don't expose chain-of-thought — store only
concise structured assessment data.

Termination: when competencies have sufficient evidence AND ~6-8
questions answered AND no critical unanswered areas remain.

Feedback report: overall score, competency scores, strengths, weaknesses,
evidence-backed observations with specific examples, recommended topics,
performance summary, suggested next steps — must be grounded in actual
answers, not invented.

Transcript: feedback page should show Question → Answer → Competency
assessed → Concise evaluation.

Engineering constraints: reuse existing interview engine, session store,
prompt builders, LLM abstraction, candidate/curriculum data, existing
APIs. No database, no unnecessary dependencies, no fake interview data.

AI_LOG.md and PROMPTS.md updates required. Conventional Commit:
"feat: build adaptive interview evaluation flow". Don't push unless
instructed. Don't spend majority of task on diagnostics — build the
feature, only stop for genuine blockers.]

---

## Session 5d — Full Product UI/UX Pass
**Agent:** VSCode-based coding agent (Cline)

Now perform a FULL PRODUCT UI/UX PASS on the existing application.

[Full instruction: current app feels like a basic demo (just
CandidateSelect, ChatInterview, FeedbackReport) without a coherent
product shell, navigation, dashboard, or strong visual identity.

Do NOT rebuild backend architecture, replace interview engine, throw
away working components, introduce a database for UI, or add
unnecessary dependencies.

Product structure specified: Landing/Dashboard, Interview/Practice,
Candidate/Role Selection, Active Interview, Interview Results, Interview
History, Profile/Settings.

Navigation: persistent responsive navbar/sidebar with product branding,
Dashboard, Practice/New Interview, History, Performance/Results,
Profile/settings. No dead links.

Dashboard: heading, "Start Interview" CTA, recent interview, latest
score, competency overview, interview count, recommendations, quick
action.

Candidate selection: upgraded cards showing name, role, experience,
relevant skills, interview focus.

Active interview: candidate/role context, current question, question
number, progress, current competency/topic, conversation history,
answer input, loading state, follow-up indication, error state,
duplicate-submission prevention, clear completion state. No exposed
chain-of-thought.

Results/Feedback: overall score, competency breakdown, strengths,
weaknesses, evidence-backed observations, recommended topics, actionable
suggestions, summary, transcript/evidence. Tasteful visualizations
(progress bars/score cards/radar chart) only if they genuinely help.

History: previous sessions with date/time, role/candidate, score,
status, competency result. No fake persistent data if true persistence
doesn't exist — clear empty state instead.

Design system: premium, modern, professional, AI-native, minimal but not
empty, strong typography/spacing/hierarchy, subtle motion, polished
cards/buttons/inputs, responsive. Explicitly avoid generic "AI startup"
decoration — no random gradients, excessive glassmorphism, floating
blobs, meaningless animations.

Responsiveness: desktop/laptop/tablet/mobile, no horizontal overflow.

Every major screen needs loading/empty/error/success states — no blank
white screens on failure.

Technical constraints: centralized API layer, no duplicated API logic in
components, no unnecessary state-management library, no backend changes
just for UI convenience, no fake data.

AI_LOG.md/PROMPTS.md updates required. Conventional Commit: "feat: build
complete interview platform UI". Don't push automatically. Don't
narrate terminal commands — implement, run, fix, finish, then report
screens created, navigation structure, UX improvements, files changed,
verification, commit hash.]

---

## Session 5e — Production-Quality Platform Pass
**Agent:** VSCode-based coding agent (Cline)

We are no longer treating this as a basic hackathon demo. The goal is to
make the application feel like a polished, production-quality AI
interview platform.

[Full instruction, expanding on 5d with more specificity: do not rebuild
from scratch, replace architecture, add unnecessary dependencies —
preserve all working functionality, work incrementally, verify each
change.

Product standard: comparable to a real SaaS product, not a chatbot
prototype — coherent identity, navigation, information architecture,
visual hierarchy, responsive design, proper states, polished
interactions.

Information architecture: Dashboard, New Interview, Interview Room,
Results, History, Profile/Settings.

New Interview screen: candidate/profile, target role, relevant skills,
interview focus, difficulty, estimated duration, competencies assessed —
user should understand exactly what they're about to do.

Interview Room (renamed/reframed from "chat"): explicitly NOT a generic
ChatGPT-style conversation — dedicated interview environment with
interviewer/question area and candidate answer area as the visual focus,
avoid excessive chat bubbles, should feel like an actual professional
interview.

Adaptive interview: same ~6-8 question guidance, competency evidence
tracking, answer-grounded follow-ups, eventual termination, repeated
from 5c with reinforcement.

Results: Overall Score, Competency Breakdown (Technical Knowledge,
Problem Solving, System Thinking, Communication, role-specific), then
Strengths/Weaknesses/Evidence/Recommendations/Summary/Transcript — all
grounded in actual answers, example strength/gap/recommendation format
given (Prometheus/cardinality example again).

History: role, date, score, duration, status, competency summary per
entry, click to open results, no fabricated historical data if
persistence isn't implemented — polished empty state instead.

Visual design: ONE coherent design system — strong typography,
consistent spacing/cards/hierarchy, restrained palette, consistent
buttons/inputs, subtle borders/shadows, polished hover/focus states,
tasteful animation. Explicit avoid-list: random gradients, excessive
glassmorphism, floating blobs, meaningless animations, giant empty
spaces, generic AI-generated dashboard aesthetics, inconsistent card
styles, oversized decorative headings.

Responsive: desktop/laptop/tablet/mobile, no horizontal overflow.

Every operation needs a loading/error/empty state (loading candidates,
starting interview, generating next question, submitting answer,
generating feedback, no history, API failure). React error boundary
required — never a blank white page after a runtime error.

Technical quality: centralized API layer, reusable components, existing
backend/LLM/interview-engine architecture preserved, no duplicated API
requests in components, no unnecessary state-management framework, no
fake backend data to populate the UI.

Hackathon presentation: demo flow specified as Dashboard → New Interview
→ Select candidate → Interview → Adaptive follow-up → Completion →
Results → Evidence-based recommendations. A judge should understand the
product within the first 20 seconds.

AI_LOG.md/PROMPTS.md maintenance required per milestone. Conventional
Commits, not dozens of trivial ones. Don't push automatically.

Execution: don't narrate terminal commands, inspect → implement → run →
test complete flow → fix runtime issues → report. Explicitly must verify
the full journey (Dashboard → New Interview → Candidate → Start →
Answer questions → Adaptive follow-up → End → Results), not just claim
"the UI was implemented." Final result must feel like a REAL PRODUCT.]

---

## Session 6 — Read-Only Codebase Audit
**Agent:** VSCode-based coding agent (Cline)

You are taking over an existing hackathon codebase. Do NOT rebuild the
project, reset Git, delete files, rewrite working code, or make broad
architectural changes.

First, perform a READ-ONLY audit of the current repository.

[Instructed to inspect: repo/folder structure, README.md, AI_LOG.md,
PROMPTS.md, DECISIONS.md, TASKS.md, backend architecture, frontend
architecture, API routes, interview engine, candidate/curriculum data,
LLM providers and fallback logic, environment/configuration files,
existing tests/scripts, frontend-to-backend integration, incomplete/
broken functionality. Also `git log --oneline --decorate -15`.

Do NOT modify anything during the audit. Report structure required:
CURRENTLY WORKING, ALREADY IMPLEMENTED, BROKEN/INCOMPLETE, MISSING FROM
PROBLEM STATEMENT, TECHNICAL RISKS, RECOMMENDED NEXT MILESTONE. No
implementation, no commits, no destructive process-killing commands, no
file modification.]

---

## Session 6b — Security/Environment Remediation
**Agent:** VSCode-based coding agent (Cline)

We have completed the read-only audit. Now perform ONLY the
security/environment remediation described below. Do not modify
interview logic, frontend behavior, API contracts, prompts, or
architecture.

CRITICAL: never print, expose, copy, or include any actual API key
values in output, logs, commits, or documentation.

[Instructed to check `git ls-files backend/.env` and .gitignore without
printing .env contents. If backend/.env is tracked: `git rm --cached`
it, ensure .gitignore covers it, create/update .env.example with
placeholder values only, no history rewrite/force-push, no commit yet.
If not tracked: just ensure .gitignore coverage and .env.example is
current. Also check other tracked files (README, source, docs) for
leaked secrets — report only filename/variable name, never the value.
Report git status, git diff --stat, and diff of .gitignore/.env.example
only. No process-killing, no server restarts, no app code changes, no
commit/push.]

**Result confirmed:** backend/.env was NOT tracked by Git and was
already protected by .gitignore.

---

## Session 6c — End-to-End Flow Verification & Stabilization
**Agent:** VSCode-based coding agent (Cline)

We have verified that backend/.env is NOT tracked by Git and is already
protected by .gitignore. Do NOT modify the environment/security setup.

Now move to the next milestone: verify and stabilize the existing
end-to-end interview flow.

[Instructed to test the full flow: GET /api/candidates → start interview
→ first AI question → submit answer → next question/follow-up →
maintain session context → multiple turns → completion → structured
feedback → display feedback. Using existing API contracts, engine,
session store, prompt builders, LLM abstraction, frontend.

Constraints: don't change API contract unless objectively broken, no new
dependencies unless necessary, don't replace LLM architecture or switch
providers unless the configured one is unavailable, no broad process
killing, no unrelated file changes, no fake/mock responses to fake a
working demo, no commit yet.

Run existing test scripts (test_topic_selection.py, test_llm.py,
test_interview_engine.py) — for interactive scripts, inspect and test
underlying functions directly rather than getting stuck on input().
Verify HTTP endpoints. If something fails: identify root cause, make
smallest possible fix, test it, explain exactly what changed. Verify
frontend integration end-to-end including session ID consistency.

Report structure: WORKING (exact parts tested), BROKEN (exact failures
+ root causes), CHANGED (files modified + why), NEXT (single
highest-value next feature). Only commit after flow confirmed stable.]

---

## Session 7 — Bug Fix: Candidate List Response Shape
**Agent:** VSCode-based coding agent (Cline)

Fix ONLY the current frontend runtime error.

Browser console shows:
Uncaught TypeError: candidates.map is not a function
at CandidateSelect (CandidateSelect.tsx:52)

The backend GET /api/candidates was intentionally changed to return the
raw candidate array instead of { "candidates": [...] }. Therefore the
frontend API layer and/or CandidateSelect component still expects the
old wrapped response shape.

[Instructed to inspect frontend/src/lib/api.ts, CandidateSelect.tsx, and
the current GET /api/candidates contract. Make the frontend correctly
consume the array-shaped response. Do NOT change the backend or revert
the response format, do NOT redesign the UI, do NOT touch the interview
engine, no new dependencies. Fix the smallest number of files necessary.

Then: build/run frontend to verify no TS/runtime errors, verify
CandidateSelect renders the list, verify Start Interview still reaches
the interview flow. Update AI_LOG.md. Conventional Commit: "fix: align
frontend with candidates API response". Don't push. Report files
changed, exact cause, fix, verification, commit hash.]

---

## Session 7b — Bug Fix: Interview Start 500 Error
**Agent:** VSCode-based coding agent (Cline)

We have a backend failure when starting an interview. DO NOT redesign
anything. DO NOT modify the frontend. DO NOT modify the API contract.
DO NOT make speculative changes.

Browser Network evidence: POST /api/interview returning 500 Internal
Server Error, with a valid request payload (sessionId + candidate
object). Frontend confirmed successfully loading /api/candidates and
successfully sending the interview request — so diagnose the backend.

[Instructed to inspect interview.py, interview_engine.py, llm/factory.py,
llm/*.py, schemas.py, .env configuration, requirements.txt. Reproduce
the exact request and capture the ACTUAL Python exception/traceback
before changing any code. Report required first: exact exception, exact
file+line, why it occurs, smallest safe fix. Only then implement the
minimal fix.

After fixing: verify POST /api/interview succeeds, verify frontend can
start an interview, no unrelated file changes, update AI_LOG.md,
Conventional Commit: "fix: resolve interview start backend error". Don't
push. No UI redesign, no Vite/WebSocket/Tailwind work, no unrelated
diagnostics.]

---

## Session 8 — Manual Bug Fixes: PDF Report & Dashboard Layout
**Context:** No coding agent available this session (Antigravity/Cline
both unreliable). Fixes applied as direct manual code edits, guided
step-by-step with exact find/replace blocks.

1. **PDF feedback report — Competency Breakdown text truncation.**
   `frontend/src/lib/pdfExport.ts`: competency values were rendered with
   a single `doc.text()` call and a hardcoded box height, so long values
   overflowed the box and got cut off mid-sentence. Fixed by wrapping
   values with `doc.splitTextToSize()` and computing box height
   dynamically from the resulting line count, so `checkNewPage()` also
   receives the correct height and avoids splitting a box across a page
   break.

2. **PDF feedback report — Executive Summary and list sections rendering
   invisible.** Same file: `doc.setTextColor(232, 237, 248)` (a
   near-white color intended for text on dark card backgrounds) was
   being applied to the Executive Summary paragraph and to
   `renderListSection` bullet items (Strengths/Gaps/Recommendations/
   Curriculum), both of which render directly on the plain white page.
   Changed those two call sites to `doc.setTextColor(30, 41, 59)`.

3. **Dashboard "Quick Improvement Insights" card — broken grid layout.**
   CSS: the intended layout rule was written as `insight-card { ... }`
   (missing the leading `.`), so it never matched
   `className="insight-card"` and no grid was applied. Separately,
   `.insight-chip` had `white-space: nowrap` while receiving full-
   sentence recommendation text, causing its `auto`-sized grid column to
   expand to fit the whole unwrapped sentence and squeeze the sibling
   content column into single-word-per-line wrapping. Fixed the selector,
   changed `grid-template-columns` to `minmax(0, 2fr) minmax(0, 1fr)`,
   added `min-width: 0` to `.insight-content`, set `.insight-chip`
   to `white-space: normal` with `border-radius: 16px` (was `999px`,
   which only worked for single-line pill content) and added a dedicated
   `.insight-label` rule so the heading line is visually distinct from
   the body paragraph.

4. **Dashboard cards — missing padding.** The shared rule for
   `.metrics-panel`, `.insight-panel`, `.hero-panel`, etc. defined
   border/radius/background but no `padding`, so text sat flush against
   card edges on panels without their own child padding. Added
   `padding: 1.5rem` to the shared rule.

5. **Dashboard — stretched empty space above insights section.**
   `.dashboard-grid` had no `align-items` set, defaulting to `stretch`,
   forcing the shorter hero panel to match the height of the taller
   metrics panel. Added `align-items: start`.

6. **Deploy failure — `ERR_PNPM_OUTDATED_LOCKFILE`.** `pnpm-lock.yaml`
   was out of sync with `package.json`, causing Vercel's
   `pnpm install --frozen-lockfile` to fail the build. Fixed by running
   `pnpm install` locally to regenerate the lockfile and committing it.

---

## Session 9 — Light Theme Conversion
**Agent:** Google Antigravity

Convert the app's color theme from dark to light. Scope is CSS-only —
do not touch component structure, JSX, layout, or add any new
dependencies, tests, CI, or Docker config.

1. Locate the :root CSS variables (--bg, --text, --muted, --accent,
--border, or similarly named) and update their values to a light theme:
   - Background: white or near-white (e.g. #ffffff or #f8f9fb)
   - Primary text: dark (e.g. #101524 or similar to current --bg dark
     navy, inverted)
   - Muted/secondary text: a mid-gray with sufficient contrast on white
     (do not reuse the current muted slate-blue value as-is if it fails
     contrast on white — check it)
   - Accent: keep the existing orange (#F5A524) unless it fails contrast
     on white, in which case darken it slightly for accessibility
   - Border: a light gray, not the current dark-theme border color

2. Search the entire frontend/src directory for HARDCODED color values
that bypass the CSS variables — specifically:
   - Any `rgba(255, 255, 255, ...)` used as a background tint (these
     assume a dark base and will be invisible or wrong on light
     backgrounds)
   - Any hardcoded hex/rgb color NOT using a var(--...) reference,
     especially near-white text colors like rgb(232, 237, 248) or
     similar
   - Also check frontend/src/lib/pdfExport.ts (or wherever the PDF
     generator lives) — it has hardcoded RGB values for a dark-themed
     PDF layout. Leave the PDF file completely alone; it is
     intentionally dark-themed and independent of the app's on-screen
     theme. Do not modify it.

3. Replace hardcoded on-screen CSS color values with the appropriate CSS
variable reference so they respond to the theme change. Do not introduce
a theme-toggle or dark/light switcher — this is a one-way conversion to
light theme only, no toggle logic.

4. After changes, verify: no text is invisible or same-color-as-
background anywhere (this app has had 3 separate contrast bugs today
from hardcoded colors — check every card/panel component: Dashboard
stat cards, insight panel, feedback report, chat interview bubbles,
history list).

Do not modify: component logic, API calls, routing, the PDF generator
file, package.json, or any file outside frontend/src/**/*.css and
frontend/src/**/*.tsx (only touch .tsx files if a color is hardcoded
inline via style={} or className with inline color, not for structural
changes).