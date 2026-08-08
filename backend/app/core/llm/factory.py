import os
from pathlib import Path
from dotenv import load_dotenv
from app.core.llm.base import LLMClient
from app.core.llm.gemini_client import GeminiClient
from app.core.llm.claude_client import ClaudeClient
from app.core.llm.groq_client import GroqClient

# Explicitly load backend/.env relative to this module so the server works
# whether it is launched from the backend directory or from the repository root.
dotenv_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(dotenv_path=dotenv_path)


def get_llm_client(provider: str | None = None) -> LLMClient:
    """
    Factory function to return configured LLMClient instance.
    Reads LLM_PROVIDER from environment if provider is not explicitly passed.
    Defaults to 'gemini' if unset.
    """
    selected_provider = provider or os.getenv("LLM_PROVIDER", "gemini")
    selected_provider = selected_provider.strip().lower()

    if selected_provider == "gemini":
        return GeminiClient()
    elif selected_provider == "claude":
        return ClaudeClient()
    elif selected_provider == "groq":
        return GroqClient()
    else:
        raise ValueError(
            f"Unsupported LLM_PROVIDER: '{selected_provider}'. "
            "Supported options are 'gemini', 'claude', and 'groq'."
        )
