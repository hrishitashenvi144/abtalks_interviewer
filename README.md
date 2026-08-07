# The Interview Agent
# The Interview Agent

AI-powered technical interviewer for ABTalks AI Cohort candidates. Conducts
an adaptive, multi-turn technical interview grounded in each candidate's
actual learning journey (completed/skipped missions, attempts, signals) and
produces structured feedback at the end.

## Status
🚧 In active development (hackathon build).

## Architecture
- **Backend:** FastAPI, in-memory session state
- **LLM:** Provider-abstracted (Gemini 2.5 Flash default, Claude optional)
- **Frontend:** React + Vite
- **No vector DB / persistent DB** — not required by spec, curriculum is
  small and static.

## Setup
_Coming once M2/M3 land — will include env setup, run instructions, and API
usage examples._

## Docs
- `docs/DECISIONS.md` — architecture rationale
- `docs/AI_LOG.md` — development session log
- `docs/PROMPTS.md` — prompts given to the implementation agent
- `docs/TASKS.md` — milestone checklist