import os
from groq import Groq
from app.core.llm.base import LLMClient


class GroqClient(LLMClient):
    def __init__(self, api_key: str | None = None, model_name: str = "llama-3.3-70b-versatile"):
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is not configured in environment or passed to client.")
        self.client = Groq(api_key=self.api_key)
        self.model_name = model_name

    def generate(self, messages: list[dict], system_prompt: str) -> str:
        formatted = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            role = msg.get("role", "user")
            g_role = "assistant" if role in ("assistant", "model") else "user"
            formatted.append({"role": g_role, "content": msg.get("content", "")})

        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=formatted,
        )
        return response.choices[0].message.content or ""
