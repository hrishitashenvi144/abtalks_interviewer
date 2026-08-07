from abc import ABC, abstractmethod


class LLMClient(ABC):
    @abstractmethod
    def generate(self, messages: list[dict], system_prompt: str) -> str:
        """
        Generate text response given conversation messages and a system prompt.

        :param messages: List of message dictionaries, e.g. [{"role": "user"|"assistant", "content": "..."}]
        :param system_prompt: System prompt / instruction string
        :return: Generated string content from LLM
        """
        pass
