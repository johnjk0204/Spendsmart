import json
from collections import defaultdict
from datetime import datetime
from langchain_core.messages import HumanMessage, SystemMessage
from app.agents.state import ExpenseAnalyzerState
from app.agents.llm_factory import get_llm
from loguru import logger


CATEGORY_COLORS = {
    "Food": "#f97316",
    "Travel": "#3b82f6",
    "Shopping": "#ec4899",
    "EMI": "#ef4444",
    "Utilities": "#6b7280",
    "Entertainment": "#8b5cf6",
    "Medical": "#10b981",
    "Fuel": "#f59e0b",
    "Investments": "#22c55e",
    "Subscriptions": "#06b6d4",
    "Salary": "#4ade80",
    "Transfer": "#94a3b8",
    "Miscellaneous": "#a78bfa",
}

ANALYSIS_PROMPT = """You are a personal finance analyst. Based on the spending summary below,
generate 3-5 smart, specific, actionable insights in this JSON format:

[
  {
    "type": "warning|suggestion|achievement|info",
    "title": "Short title",
    "body": "Detailed insight text (1-2 sentences, specific numbers)",
    "category": "Food|Travel|Shopping|...",
    "priority": "high|medium|low"
  }
]

Make insights conversational, specific, and helpful. Include:
- Percentage comparisons where relevant
- Concrete savings suggestions
- Positive reinforcement for good behavior
Return ONLY valid JSON array.
"""


def analysis_node(state: ExpenseAnalyzerState) -> ExpenseAnalyzerState:
    """Analyze spending patterns and generate insights."""
    logger.info("Analysis Agent: computing spending patterns")
    state["current_step"] = "analysis"

    transactions = state.get("categorized_transactions", [])
    if not transactions:
        state["spending_insights"] = {}
        state["category_breakdown"] = {}
        state["impulse_analysis"] = {}
        state["subscription_list"] = []
        return state

    # Category breakdown
    category_totals = defaultdict(float)
    category_counts = defaultdict(int)
    total_debit = 0.0
    total_credit = 0.0
    impulse_total = 0.0
    impulse_count = 0
    subscriptions = []

    for txn in transactions:
        amount = float(txn.get("amount", 0))
        txn_type = txn.get("transaction_type", "debit")
        category = txn.get("category", "Miscellaneous")

        if txn_type == "credit":
            total_credit += amount
        else:
            total_debit += amount
            category_totals[category] += amount
            category_counts[category] += 1

        if txn.get("is_impulse"):
            impulse_total += amount
            impulse_count += 1

        if txn.get("is_recurring"):
            subscriptions.append({
                "merchant": txn.get("merchant"),
                "amount": amount,
                "interval": txn.get("recurring_interval", "monthly"),
                "category": category,
            })

    # Build category breakdown
    category_breakdown = {}
    for cat, total in category_totals.items():
        category_breakdown[cat] = {
            "amount": round(total, 2),
            "count": category_counts[cat],
            "percentage": round((total / total_debit * 100) if total_debit > 0 else 0, 1),
            "color": CATEGORY_COLORS.get(cat, "#94a3b8"),
        }

    # Top categories
    sorted_cats = sorted(category_breakdown.items(), key=lambda x: x[1]["amount"], reverse=True)
    top_category = sorted_cats[0][0] if sorted_cats else "Miscellaneous"

    spending_summary = {
        "total_spent": round(total_debit, 2),
        "total_income": round(total_credit, 2),
        "net_savings": round(total_credit - total_debit, 2),
        "transaction_count": len(transactions),
        "avg_transaction": round(total_debit / len(transactions), 2) if transactions else 0,
        "top_category": top_category,
        "top_category_amount": round(category_totals.get(top_category, 0), 2),
    }

    impulse_analysis = {
        "impulse_count": impulse_count,
        "impulse_total": round(impulse_total, 2),
        "impulse_percentage": round((impulse_total / total_debit * 100) if total_debit > 0 else 0, 1),
    }

    # LLM insights
    ai_insights = []
    try:
        summary_for_llm = {
            "total_spent": spending_summary["total_spent"],
            "category_breakdown": {k: v["amount"] for k, v in category_breakdown.items()},
            "top_category": top_category,
            "impulse_spending": impulse_analysis["impulse_total"],
            "subscription_count": len(set(s["merchant"] for s in subscriptions)),
            "transaction_count": len(transactions),
        }

        llm = get_llm(temperature=0.3)
        messages = [
            SystemMessage(content=ANALYSIS_PROMPT),
            HumanMessage(content=f"Spending data:\n{json.dumps(summary_for_llm, indent=2)}"),
        ]
        response = llm.invoke(messages)
        content = response.content.strip()

        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        ai_insights = json.loads(content)
    except Exception as e:
        logger.warning(f"LLM insight generation failed: {e}")
        ai_insights = [
            {
                "type": "info",
                "title": f"Total spent: ₹{spending_summary['total_spent']:,.0f}",
                "body": f"Most spending in {top_category} category.",
                "category": top_category,
                "priority": "medium",
            }
        ]

    state["spending_insights"] = {
        **spending_summary,
        "ai_insights": ai_insights,
        "impulse": impulse_analysis,
    }
    state["category_breakdown"] = category_breakdown
    state["impulse_analysis"] = impulse_analysis
    state["subscription_list"] = subscriptions

    logger.info("Analysis Agent: complete")
    return state
