# The Interview Agent

**Live demo:** [abtalks-interviewer.vercel.app](https://abtalks-interviewer.vercel.app)
**Demo video:** https://drive.google.com/file/d/1q7_AgAPrFH0uIOTXdK0KFx3mGbKWJjbQ/view?usp=sharing

An AI interviewer that conducts realistic, adaptive technical interviews
based on a candidate's actual progress through the ABTalks 31-day AI
Cohort — not a scripted quiz, but a genuinely personalized conversation
grounded in what each person actually skipped, struggled with, or mastered.

Built for the ABTalks AI Cohort Hackathon — Problem Statement 2.

---

## Try it in 30 seconds

1. Open the [live app](https://abtalks-interviewer.vercel.app)
2. Pick any candidate card — try **Alex Turner**, who has a good mix of
   struggled and skipped topics, so the adaptive behavior is easy to see
3. Answer a couple of questions honestly, then try one deliberately vague
   answer (e.g. "idk") — the interviewer will push back and ask you to
   clarify instead of moving on
4. Finish the interview (or use the "End Interview" button to jump to
   results faster) and see the structured feedback report

*Note: the backend runs on a free-tier host that sleeps after inactivity —
if the first load feels slow, give it ~30 seconds to wake up.*

---

## What makes this different from a scripted question bank

**Topic selection is personalized, not random.** Every candidate comes
with real signals from their cohort journey — missions they skipped,
failed, passed on the first try, or struggled through with multiple
attempts. A deterministic scoring algorithm (not the LLM — this is
intentional, see [Architecture](#architecture)) uses those signals to
decide which curriculum days actually deserve to be probed, and why:

- Skipped a mission? The interview tests whether you self-studied it anyway.
- Struggled through something on the 4th attempt? The interview checks
  if that understanding actually stuck.
- Passed everything cleanly on the first try? The interview verifies
  real mastery instead of assuming it.

Every question the agent asks carries a `reason` — visible in the UI —
so it's transparent *why* that topic was chosen for that candidate.

**Follow-ups are answer-dependent, not scripted.** The interviewer
evaluates each response and decides whether to push deeper on the same
topic, move to a new one, or increase difficulty — grounded in what was
actually said, not a fixed question sequence. Vague, evasive, or
nonsensical answers get a clarifying push-back instead of a free pass to
the next question.

**Feedback is evidence-based.** The final report references what the
candidate actually said during the interview — specific strengths,
specific gaps, specific curriculum areas to revisit — not a generic
score.

---

## Architecture

- **Backend:** FastAPI (Python), in-memory session state keyed by
  `sessionId`. No database — not required by the spec, and unnecessary
  given the scope.
- **LLM:** Provider-abstracted behind a single `LLMClient` interface,
  with interchangeable Gemini, Claude, and Groq implementations. Default
  provider is **Groq** (Llama 3.3 70B) — Gemini's free tier proved too
  rate-limited (20 requests/day) for a multi-turn interview plus
  iterative testing; full rationale in `docs/DECISIONS.md`.
- **Topic selection is deterministic, not LLM-driven.** A scoring
  algorithm (`backend/app/core/topic_selector.py`) ranks curriculum days
  by signal strength (skipped/failed = highest priority, struggled-but-
  passed = medium, clean first-try pass = baseline), enforces topic
  diversity across curriculum modules, and always closes with the
  capstone project. This keeps topic choice reliable and testable rather
  than left to LLM judgment.
- **The interview engine owns termination logic**, not the LLM — a
  minimum of 8 questions across at least 4 distinct curriculum days is
  enforced in code, with a hard safety cap, regardless of what the model
  suggests. The LLM only decides content and follow-up strategy inside
  those guardrails.
- **Frontend:** React + Vite + TypeScript, deployed on Vercel.

Full architectural decisions and rationale: [`docs/DECISIONS.md`](docs/DECISIONS.md)

---

## API Contract

Exposes the single required endpoint per the technical specification:

```
POST /api/interview
```

```json
// Start a session
{ "sessionId": "abc-123", "candidate": { ...candidate.json } }
→ { "reply": "...", "done": false }

// Continue a session
{ "sessionId": "abc-123", "message": "..." }
→ { "reply": "...", "done": false }

// On completion
{
  "reply": "...",
  "done": true,
  "feedback": {
    "summary": "...",
    "strengths": ["..."],
    "gaps": ["..."],
    "next": ["..."]
  }
}
```

No authentication, state maintained server-side via `sessionId`, exactly
as specified. (The app also surfaces some additional optional fields —
competency scores, topic metadata — used to power the richer UI; the
required contract fields are always present alongside them.)

---

## Running locally

**Backend:**
```bash
cd backend
cp .env.example .env   # add your GROQ_API_KEY
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
cp .env.example .env   # set VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev
```

---

## Project Documentation


- [`docs/AI_LOG.md`](docs/AI_LOG.md) — development session log
- [`docs/PROMPTS.md`](docs/PROMPTS.md) — prompts given to implementation agents


---

## A note on how this was built

This project was built collaboratively with multiple AI coding agents
(Google Antigravity and a VSCode-based agent) under close human direction
and review — every architectural decision, prompt, and bug fix is logged
in `docs/`. Nothing in the documentation is fabricated; it reflects the
actual, sometimes messy, iterative process of building this in the
hackathon window, including real debugging detours (an LLM provider
quota issue mid-build, a deployment configuration bug, several rounds of
UI iteration) that are documented rather than hidden.

---

*Built for the ABTalks AI Cohort Hackathon.*
