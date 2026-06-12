import json
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from app.agents.state import ExpenseAnalyzerState
from app.agents.llm_factory import get_llm
from loguru import logger


CHAT_SYSTEM_PROMPT = """You are FinBot, an expert personal finance AI assistant embedded in a Daily Expense Analyzer app.

You have access to the user's spending data and can answer questions about:
- Spending patterns and trends
- Budget analysis
- Saving suggestions
- Category comparisons
- Subscription analysis
- Financial health

CONTEXT:
{context}

Guidelines:
- Be conversational, warm, and encouraging
- Use Indian currency (₹)
- Give specific, actionable advice
- Reference actual numbers from their data
- Keep responses concise (3-5 sentences max)
- If data is insufficient, ask for clarification
"""


def chat_node(state: ExpenseAnalyzerState) -> ExpenseAnalyzerState:
    """Handle conversational AI chat with spending context."""
    logger.info("Chat Agent: processing query")
    state["current_step"] = "chat"

    user_query = state.get("user_query", "")
    chat_history = state.get("chat_history", [])

    if not user_query:
        state["chat_response"] = "How can I help you with your finances today?"
        return state

    # Build context from spending data
    insights = state.get("spending_insights", {})
    category_breakdown = state.get("category_breakdown", {})
    predictions = state.get("predictions", {})
    recommendations = state.get("recommendations", [])

    context = {
        "total_spent": insights.get("total_spent", 0),
        "total_income": insights.get("total_income", 0),
        "health_score": insights.get("health_score", 50),
        "top_categories": {k: v["amount"] for k, v in
                           sorted(category_breakdown.items(), key=lambda x: x[1]["amount"], reverse=True)[:5]},
        "monthly_prediction": predictions.get("predicted_monthly_total", 0),
        "risk_level": predictions.get("risk_level", "medium"),
        "top_recommendations": [r.get("title") for r in recommendations[:3]],
    }

    system_prompt = CHAT_SYSTEM_PROMPT.format(context=json.dumps(context, indent=2))

    # Build message history
    messages = [SystemMessage(content=system_prompt)]
    for msg in chat_history[-10:]:  # last 10 messages for context
        if msg.get("role") == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg.get("role") == "assistant":
            messages.append(AIMessage(content=msg["content"]))

    messages.append(HumanMessage(content=user_query))

    try:
        llm = get_llm(temperature=0.5)
        response = llm.invoke(messages)
        state["chat_response"] = response.content.strip()
    except Exception as e:
        logger.error(f"Chat Agent error: {e}")
        state["chat_response"] = (
            "I'm having trouble processing that right now. "
            "Please try again in a moment."
        )

    return state
