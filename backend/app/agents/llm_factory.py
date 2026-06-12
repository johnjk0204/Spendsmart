from langchain_groq import ChatGroq
from app.config import settings


def get_llm(temperature: float = 0.1) -> ChatGroq:
    """Return a GROQ-backed LLM instance."""
    return ChatGroq(
        model=settings.LLM_MODEL,
        groq_api_key=settings.GROQ_API_KEY,
        temperature=temperature,
    )
