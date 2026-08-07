# Architectural Decisions

## M0 Architecture & LLM Provider Choices

* **FastAPI Backend**: Chosen for high performance, native async execution, minimal routing overhead, and seamless Pydantic data validation.
* **In-Memory Session State**: Candidate interview sessions and active context are managed in memory to eliminate setup overhead and deliver sub-millisecond session access.
* **No Vector Database**: The structured interview curriculum and candidate profiles fit comfortably within memory/JSON, avoiding vector embedding latency and database indexing overhead.
* **Provider-Abstracted LLM Layer**: Standardizes LLM interactions behind a unified `LLMClient` abstract interface (`generate(messages, system_prompt)`).
* **Gemini as Default Dev Provider**: Uses `gemini-2.5-flash` as default for local development due to high execution speed, low latency, and efficient token consumption.
* **Claude as Swappable Option**: Supports `claude-sonnet-4-6` via simple environment toggle (`LLM_PROVIDER=claude`) for comparison and final presentation options without code changes.
