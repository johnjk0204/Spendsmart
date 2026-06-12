import json
from langchain_core.messages import HumanMessage, SystemMessage
from app.agents.state import ExpenseAnalyzerState
from app.agents.llm_factory import get_llm
from loguru import logger


CATEGORIZATION_PROMPT = """You are an expert expense categorizer for an Indian personal finance app.

Classify each transaction into exactly ONE category from:
Food, Travel, Shopping, EMI, Utilities, Entertainment, Medical, Fuel, Investments, Subscriptions, Salary, Transfer, Miscellaneous

Also detect:
- is_impulse: true if this looks like an unplanned/emotional purchase
- is_recurring: true if this is likely a subscription or regular payment
- is_suspicious: true if the amount/merchant looks unusual
- sentiment_tag: "need" | "want" | "luxury"
- recurring_interval: "monthly" | "weekly" | "yearly" | null

Examples:
- "SWIGGY" → Food, want, is_impulse possibly
- "NETFLIX" → Subscriptions, want, is_recurring, monthly
- "UBER/OLA" → Travel, need
- "EMI HDFC" → EMI, need, is_recurring, monthly
- "AMAZON" → Shopping, want
- "APOLLO PHARMACY" → Medical, need
- "SALARY CREDIT" → Salary
- "ZERODHA" → Investments

Return JSON array with same length as input, each item having:
{
  "category": "Food",
  "is_impulse": false,
  "is_recurring": false,
  "is_suspicious": false,
  "sentiment_tag": "want",
  "recurring_interval": null,
  "confidence": 0.95
}

Return ONLY valid JSON array, no other text.
"""


# Rule-based fallback for common merchants
MERCHANT_RULES = {
    "swiggy": ("Food", "want", False, False),
    "zomato": ("Food", "want", False, False),
    "netflix": ("Subscriptions", "want", True, False),
    "spotify": ("Subscriptions", "want", True, False),
    "amazon prime": ("Subscriptions", "want", True, False),
    "hotstar": ("Subscriptions", "want", True, False),
    "uber": ("Travel", "need", False, False),
    "ola": ("Travel", "need", False, False),
    "rapido": ("Travel", "need", False, False),
    "irctc": ("Travel", "need", False, False),
    "amazon": ("Shopping", "want", False, False),
    "flipkart": ("Shopping", "want", False, False),
    "myntra": ("Shopping", "want", True, False),
    "emi": ("EMI", "need", True, False),
    "electricity": ("Utilities", "need", True, False),
    "airtel": ("Utilities", "need", True, False),
    "jio": ("Utilities", "need", True, False),
    "bsnl": ("Utilities", "need", True, False),
    "petrol": ("Fuel", "need", False, False),
    "fuel": ("Fuel", "need", False, False),
    "zerodha": ("Investments", "need", False, False),
    "groww": ("Investments", "need", False, False),
    "pharmacy": ("Medical", "need", False, False),
    "hospital": ("Medical", "need", False, False),
    "salary": ("Salary", "need", True, False),
}


def rule_based_categorize(merchant: str) -> dict:
    merchant_lower = merchant.lower()
    for key, (cat, sentiment, recurring, impulse) in MERCHANT_RULES.items():
        if key in merchant_lower:
            return {
                "category": cat,
                "is_impulse": impulse,
                "is_recurring": recurring,
                "is_suspicious": False,
                "sentiment_tag": sentiment,
                "recurring_interval": "monthly" if recurring else None,
                "confidence": 0.85,
            }
    return {
        "category": "Miscellaneous",
        "is_impulse": False,
        "is_recurring": False,
        "is_suspicious": False,
        "sentiment_tag": "need",
        "recurring_interval": None,
        "confidence": 0.5,
    }


def categorization_node(state: ExpenseAnalyzerState) -> ExpenseAnalyzerState:
    """Categorize all transactions using LLM + rule-based fallback."""
    logger.info(f"Categorization Agent: {len(state['raw_transactions'])} transactions")
    state["current_step"] = "categorization"

    raw_txns = state.get("raw_transactions", [])
    if not raw_txns:
        state["categorized_transactions"] = []
        return state

    # Apply rule-based first
    rule_results = [rule_based_categorize(t.get("merchant", "")) for t in raw_txns]

    # LLM refinement for ambiguous ones (confidence < 0.8)
    ambiguous_indices = [i for i, r in enumerate(rule_results) if r["confidence"] < 0.8]

    if ambiguous_indices and len(ambiguous_indices) <= 50:
        try:
            ambiguous_txns = [raw_txns[i] for i in ambiguous_indices]
            txn_summary = json.dumps(
                [{"merchant": t.get("merchant"), "amount": t.get("amount")} for t in ambiguous_txns],
                indent=2,
            )

            llm = get_llm(temperature=0.0)
            messages = [
                SystemMessage(content=CATEGORIZATION_PROMPT),
                HumanMessage(content=f"Categorize these transactions:\n{txn_summary}"),
            ]
            response = llm.invoke(messages)
            content = response.content.strip()

            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            llm_results = json.loads(content)
            if isinstance(llm_results, list) and len(llm_results) == len(ambiguous_indices):
                for idx, llm_result in zip(ambiguous_indices, llm_results):
                    rule_results[idx] = llm_result
        except Exception as e:
            logger.warning(f"LLM categorization failed, using rules only: {e}")

    # Merge results
    categorized = []
    for txn, cat_info in zip(raw_txns, rule_results):
        merged = {**txn, **cat_info}
        categorized.append(merged)

    state["categorized_transactions"] = categorized
    logger.info(f"Categorization complete: {len(categorized)} transactions")
    return state
