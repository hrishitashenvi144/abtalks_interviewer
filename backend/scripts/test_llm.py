import os
import sys
from pathlib import Path

# Add backend root to Python path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from dotenv import load_dotenv
load_dotenv()

from app.core.llm import get_llm_client


def test_provider(provider_name: str | None = None):
    provider_str = provider_name or os.getenv("LLM_PROVIDER", "gemini")
    print(f"--- Testing LLM Provider: {provider_str} ---")
    try:
        client = get_llm_client(provider_name)
        messages = [{"role": "user", "content": "Say hello in one brief sentence."}]
        system_prompt = "You are a polite test assistant."

        response = client.generate(messages, system_prompt)
        print(f"SUCCESS ({provider_str}):\n{response}\n")
    except Exception as err:
        print(f"FAILED ({provider_str}): {err}\n")


if __name__ == "__main__":
    # Test configured default provider
    test_provider()
