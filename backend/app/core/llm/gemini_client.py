import os
import time
import google.generativeai as genai
from app.core.llm.base import LLMClient


class GeminiClient(LLMClient):
    def __init__(self, api_key: str | None = None, model_name: str = "gemini-2.5-flash"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured in environment or passed to client.")
        genai.configure(api_key=self.api_key)
        self.model_name = model_name

    def generate(self, messages: list[dict], system_prompt: str) -> str:
        model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=system_prompt,
        )

        formatted_contents = []
        for msg in messages:
            role = msg.get("role", "user")
            g_role = "model" if role in ("assistant", "model") else "user"
            formatted_contents.append({
                "role": g_role,
                "parts": [msg.get("content", "")]
            })

        if not formatted_contents:
            formatted_contents = [{"role": "user", "parts": ["Hello"]}]

        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = model.generate_content(formatted_contents)
                return response.text if response.text else ""
            except Exception as e:
                err_str = str(e)
                if ("429" in err_str or "ResourceExhausted" in err_str or "Quota" in err_str or "504" in err_str or "DeadlineExceeded" in err_str or "ServiceUnavailable" in err_str) and attempt < max_retries - 1:
                    time.sleep(5 * (attempt + 1))
                else:
                    raise e
