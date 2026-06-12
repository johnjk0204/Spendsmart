import json
from langchain_core.messages import HumanMessage, SystemMessage
from app.agents.state import ExpenseAnalyzerState
from app.agents.llm_factory import get_llm
from loguru import logger


RECOMMENDATION_PROMPT = """You are a personal finance advisor for Indian users.
Based on the spending analysis, provide personalized recommendations.

Return JSON with this structure:
{
  "recommendations": [
    {
      "title": "Short actionable title",
      "description": "2-3 sentence detailed advice",
      "potential_savings": <float or null>,
      "priority": "high|medium|low",
      "category": "Food|Travel|Subscriptions|...",
      "action_type": "reduce|cancel|switch|invest|save"
    }
  ],
  "savings_plan": {
    "monthly_target": <float>,
    "weekly_target": <float>,
    "daily_target": <float>,
    "emergency_fund_months": <int>,
    "recommended_investments": ["PPF", "SIP", "FD"],
    "plan_summary": "One paragraph savings plan summary"
  },
  "health_score": <float 0-100>,
  "health_breakdown": {
    "savings_score": <float 0-25>,
    "discipline_score": <float 0-25>,
    "debt_score": <float 0-25>,
    "subscription_score": <float 0-15>,
    "impulse_score": <float 0-10>
  },
  "health_summary": "One sentence health assessment",
  "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"]
}

Return ONLY valid JSON.
"""


def recommendation_node(state: ExpenseAnalyzerState) -> ExpenseAnalyzerState:
    """Generate savings recommendations and health score."""
    logger.info("Recommendation Agent: generating recommendations")
    state["current_step"] = "recommendation"

    insights = state.get("spending_insights", {})
    category_breakdown = state.get("category_breakdown", {})
    predictions = state.get("predictions", {})
    impulse = state.get("impulse_analysis", {})
    subscriptions = state.get("subscription_list", [])

    total_spent = insights.get("total_spent", 0)
    total_income = insights.get("total_income", 0)
    savings_rate = ((total_income - total_spent) / total_income * 100) if total_income > 0 else 0

    # Heuristic health score
    savings_score = min(25, savings_rate * 25 / 30)  # 30% savings = full score
    discipline_score = max(0, 25 - (impulse.get("impulse_percentage", 0) / 4))
    subscription_total = sum(s.get("amount", 0) for s in subscriptions)
    subscription_pct = (subscription_total / total_spent * 100) if total_spent > 0 else 0
    subscription_score = max(0, 15 - subscription_pct * 0.5)
    impulse_score = max(0, 10 - impulse.get("impulse_count", 0) * 2)
    debt_score = 25  # simplified
    fallback_score = savings_score + discipline_score + debt_score + subscription_score + impulse_score

    try:
        summary = {
            "total_spent": total_spent,
            "total_income": total_income,
            "savings_rate_pct": round(savings_rate, 1),
            "impulse_spending_pct": round(impulse.get("impulse_percentage", 0), 1),
            "impulse_count": impulse.get("impulse_count", 0),
            "subscription_total": round(subscription_total, 2),
            "subscription_count": len(set(s.get("merchant") for s in subscriptions)),
            "top_3_categories": sorted(
                [(k, v["amount"]) for k, v in category_breakdown.items()],
                key=lambda x: x[1], reverse=True
            )[:3],
            "risk_level": predictions.get("risk_level", "medium"),
        }

        llm = get_llm(temperature=0.4)
        messages = [
            SystemMessage(content=RECOMMENDATION_PROMPT),
            HumanMessage(content=f"Financial summary:\n{json.dumps(summary, indent=2)}"),
        ]
        response = llm.invoke(messages)
        content = response.content.strip()

        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        llm_output = json.loads(content)

        state["recommendations"] = llm_output.get("recommendations", [])
        state["savings_plan"] = llm_output.get("savings_plan", {})
        state["health_score"] = llm_output.get("health_score", fallback_score)
        state["spending_insights"]["health_score"] = llm_output.get("health_score", fallback_score)
        state["spending_insights"]["health_summary"] = llm_output.get("health_summary", "")
        state["spending_insights"]["improvements"] = llm_output.get("improvements", [])
        state["spending_insights"]["health_breakdown"] = llm_output.get("health_breakdown", {})

    except Exception as e:
        logger.warning(f"LLM recommendations failed: {e}")
        state["recommendations"] = [
            {
                "title": "Reduce impulse purchases",
                "description": f"You have {impulse.get('impulse_count', 0)} impulse purchases. "
                               "Consider waiting 24 hours before non-essential purchases.",
                "potential_savings": round(impulse.get("impulse_total", 0) * 0.5, 2),
                "priority": "high",
                "category": "Shopping",
                "action_type": "reduce",
            }
        ]
        state["savings_plan"] = {
            "monthly_target": round(total_income * 0.2, 2),
            "weekly_target": round(total_income * 0.2 / 4, 2),
            "daily_target": round(total_income * 0.2 / 30, 2),
            "emergency_fund_months": 6,
            "recommended_investments": ["SIP", "PPF"],
            "plan_summary": "Save 20% of income monthly toward an emergency fund.",
        }
        state["health_score"] = round(fallback_score, 1)

    logger.info(f"Recommendation Agent: score={state['health_score']:.1f}")
    return state
