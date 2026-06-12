import json
from datetime import datetime, timedelta
from langchain_core.messages import HumanMessage, SystemMessage
from app.agents.state import ExpenseAnalyzerState
from app.agents.llm_factory import get_llm
from loguru import logger


PREDICTION_PROMPT = """You are a financial forecasting AI. Based on current spending patterns,
predict the next 30 days of expenses.

Generate a forecast in this JSON format:
{
  "end_of_month_balance": <float>,
  "predicted_monthly_total": <float>,
  "high_risk_days": ["Monday", "Weekend"],
  "category_forecast": {
    "Food": <float>,
    "Travel": <float>,
    ...
  },
  "savings_projection": <float>,
  "risk_level": "low|medium|high",
  "risk_reasons": ["reason1", "reason2"],
  "daily_forecast": [
    {"day": 1, "predicted_amount": <float>},
    ...30 days
  ]
}

Return ONLY valid JSON.
"""


def prediction_node(state: ExpenseAnalyzerState) -> ExpenseAnalyzerState:
    """Generate spending predictions and forecasts."""
    logger.info("Prediction Agent: generating forecasts")
    state["current_step"] = "prediction"

    insights = state.get("spending_insights", {})
    category_breakdown = state.get("category_breakdown", {})

    if not insights:
        state["predictions"] = {}
        state["forecast_data"] = []
        return state

    total_spent = insights.get("total_spent", 0)
    total_income = insights.get("total_income", 0)
    txn_count = insights.get("transaction_count", 1)

    daily_avg = total_spent / 30 if total_spent > 0 else 0

    # Simple trend-based forecast
    forecast_data = []
    for day in range(1, 31):
        # Add variance: weekends ~20% higher
        day_of_week = (datetime.now() + timedelta(days=day)).weekday()
        multiplier = 1.2 if day_of_week >= 5 else 0.9
        forecast_data.append({
            "day": day,
            "date": (datetime.now() + timedelta(days=day)).strftime("%Y-%m-%d"),
            "predicted_amount": round(daily_avg * multiplier, 2),
        })

    # LLM enhanced prediction
    try:
        summary = {
            "total_spent": total_spent,
            "total_income": total_income,
            "daily_average": round(daily_avg, 2),
            "category_breakdown": {k: v["amount"] for k, v in category_breakdown.items()},
            "transaction_count": txn_count,
        }

        llm = get_llm(temperature=0.1)
        messages = [
            SystemMessage(content=PREDICTION_PROMPT),
            HumanMessage(content=f"Current month data:\n{json.dumps(summary, indent=2)}"),
        ]
        response = llm.invoke(messages)
        content = response.content.strip()

        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        llm_prediction = json.loads(content)

        state["predictions"] = {
            "end_of_month_balance": llm_prediction.get("end_of_month_balance", total_income - total_spent),
            "predicted_monthly_total": llm_prediction.get("predicted_monthly_total", total_spent),
            "high_risk_days": llm_prediction.get("high_risk_days", ["Weekend"]),
            "category_forecast": llm_prediction.get("category_forecast", {}),
            "savings_projection": llm_prediction.get("savings_projection", total_income - total_spent),
            "risk_level": llm_prediction.get("risk_level", "medium"),
            "risk_reasons": llm_prediction.get("risk_reasons", []),
            "daily_avg": round(daily_avg, 2),
        }

        if "daily_forecast" in llm_prediction:
            forecast_data = llm_prediction["daily_forecast"]

    except Exception as e:
        logger.warning(f"LLM prediction failed, using simple model: {e}")
        state["predictions"] = {
            "end_of_month_balance": round(total_income - total_spent, 2),
            "predicted_monthly_total": round(total_spent, 2),
            "high_risk_days": ["Weekend"],
            "category_forecast": {k: v["amount"] for k, v in category_breakdown.items()},
            "savings_projection": round(total_income - total_spent, 2),
            "risk_level": "medium",
            "risk_reasons": ["High spending detected"],
            "daily_avg": round(daily_avg, 2),
        }

    state["forecast_data"] = forecast_data
    logger.info("Prediction Agent: complete")
    return state
