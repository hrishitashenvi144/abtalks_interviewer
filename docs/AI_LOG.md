# AI Development Log

Chronological record of Antigravity sessions. Entries reflect actual work
done — not aspirational or planned work.

---

## Session 1 — Milestone 0: Scaffolding
- Created backend (`FastAPI`) and frontend (`Vite + React`) folder structure
- Implemented `LLMClient` abstract interface with Gemini and Claude
  implementations, plus factory selecting provider via env var
- Added `/health` endpoint to `main.py`
- Initialized docs: AI_LOG.md, PROMPTS.md, DECISIONS.md, TASKS.md
- Commits:  1. 0f50f4b chore: initialize backend structure
            2. e97750e feat: add LLM provider abstraction (gemini + claude)
            3. cd1624d chore: initialize frontend structure
            4. 1852b85 docs: add initial project documentation files
- Status: pushed


## Session 2 — Milestone 1: Curriculum Data & Topic Selection
- Implemented `curriculum_loader.py`: `get_day()`, `get_module_for_day()`
- Implemented `topic_selector.py`: deterministic scoring algorithm
  (skipped=10, failed=10, high-attempt pass=6, moderate-attempt pass=2,
  clean pass=0), module-diversity cap (max 2 days/module), capstone
  always included
- Verified via `test_topic_selection.py` against 20 candidate profiles —
  confirmed sensible topic spread and correct prioritization of gaps
  (skipped/failed topics) over clean passes
- Commits:1. f1ff12a docs: document topic selection rationale in DECISIONS.md
          2. fb8b969 feat: add deterministic topic selection algorithm
          3. d729424 feat: add curriculum data loader

- Status: complete, pushed

## Session 4 — Milestone 4: Rich structured feedback and polished candidate UI
- Extended feedback generation to include overall score, technical understanding,
  reasoning, communication, depth, and curriculum areas to revisit.
- Upgraded frontend feedback UI to show summary, category cards, strengths,
  weaknesses, recommendations, and curriculum revisit guidance.
- Improved candidate cards with explicit mission progress, first-try signals,
  and commit-days visibility.
- Verified frontend build success with `npm run build` and backend model changes
  accepted by runtime type check.
- Status: complete, ready for next demo polish work.

---

## Session 5 — Milestone 5: Complete interview platform UI
- Built a polished application shell with persistent navigation, dashboard,
  history, and settings screens while preserving the existing candidate selection,
  interview, and feedback components.
- Added local interview history persistence, a stronger results layout, and
  transcript support in the feedback report.
- Added layout and theme styles for app shell, dashboard metrics, interview UI,
  results panels, and history entries.
- Verified the frontend compiles successfully with `npm run build`.
- Fixed candidate loading to match the backend candidates API response shape.
- Verified candidate selection and interview start flow against the backend.
- Status: complete, ready for live demo verification.
 to main