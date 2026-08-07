# Architectural Decisions

## M0 Architecture & LLM Provider Choices

* **FastAPI Backend**: Chosen for high performance, native async execution, minimal routing overhead, and seamless Pydantic data validation.
* **In-Memory Session State**: Candidate interview sessions and active context are managed in memory to eliminate setup overhead and deliver sub-millisecond session access.
* **No Vector Database**: The structured interview curriculum and candidate profiles fit comfortably within memory/JSON, avoiding vector embedding latency and database indexing overhead.
* **Provider-Abstracted LLM Layer**: Standardizes LLM interactions behind a unified `LLMClient` abstract interface (`generate(messages, system_prompt)`).
* **Gemini as Default Dev Provider**: Uses `gemini-2.5-flash` as default for local development due to high execution speed, low latency, and efficient token consumption.
* **Claude as Swappable Option**: Supports `claude-sonnet-4-6` via simple environment toggle (`LLM_PROVIDER=claude`) for comparison and final presentation options without code changes.

## M1 Deterministic Topic Selection Algorithm

* **Priority Scoring Logic**: Assigns deterministic weighted scores based on candidate signals (skipped = 10, failed = 10, attempts ≥ 4 = 6, attempts 2-3 = 2, first-pass = 0) to target areas needing verification.
* **Module Diversity Enforcement**: Caps selection at a maximum of 2 days per curriculum module, skipping over-represented modules to guarantee balanced technical coverage across the cohort spectrum.
* **Capstone Position**: Guarantees Day 31 (Capstone Project) is included and anchored as the final closing synthesis topic.
* **Deterministic vs LLM-Driven Rationale**: Uses rule-based scoring over LLM generation to ensure 100% reproducible topic selection, zero latency/token costs during selection, and explicit human-auditable selection reasons (`reason` strings) for judging and analytics.
