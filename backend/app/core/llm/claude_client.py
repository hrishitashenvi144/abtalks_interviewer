import os
import anthropic
from app.core.llm.base import LLMClient


class ClaudeClient(LLMClient):
    def __init__(self, api_key: str | None = None, model_name: str = "claude-sonnet-4-6"):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY is not configured in environment or passed to client.")
        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model_name = model_name

    def generate(self, messages: list[dict], system_prompt: str) -> str:
        formatted_messages = []
        for msg in messages:
            role = msg.get("role", "user")
            if role not in ("user", "assistant"):
                role = "user"
            formatted_messages.append({
                "role": role,
                "content": msg.get("content", "")
            })

        response = self.client.messages.create(
            model=self.model_name,
            max_tokens=1024,
            system=system_prompt,
            messages=formatted_messages,
        )
        if response.content and len(response.content) > 0:
            return response.content[0].text
        return ""
