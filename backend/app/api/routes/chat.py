from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.api.deps import get_current_user
from app.agents.graph import run_expense_analysis

router = APIRouter()


@router.post("/")
async def chat(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Chat with AI about spending. Provide context from recent transactions."""
    user_query = payload.get("message", "").strip()
    chat_history = payload.get("history", [])

    if not user_query:
        return {"response": "Please ask me something about your finances!"}

    # Fetch recent transactions for context
    result = await db.execute(
        select(Transaction)
        .where(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.transaction_type == "debit",
            )
        )
        .order_by(desc(Transaction.date))
        .limit(50)
    )
    transactions = result.scalars().all()

    txn_list = [
        {
            "merchant": t.merchant,
            "amount": t.amount,
            "category": t.category,
            "transaction_type": t.transaction_type,
            "is_impulse": t.is_impulse,
            "is_recurring": t.is_recurring,
        }
        for t in transactions
    ]

    analysis = await run_expense_analysis(
        user_id=current_user.id,
        input_type="transactions_only",
        existing_transactions=txn_list,
        user_query=user_query,
        chat_history=chat_history,
    )

    return {
        "response": analysis.get("chat_response", "I couldn't process that. Please try again."),
        "context_used": len(txn_list),
    }


@router.post("/quick-insights")
async def quick_insights(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return pre-computed quick insight bullets for the chat sidebar."""
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == current_user.id)
        .order_by(desc(Transaction.date))
        .limit(30)
    )
    transactions = result.scalars().all()

    total = sum(t.amount for t in transactions if t.transaction_type == "debit")
    impulse = sum(t.amount for t in transactions if t.is_impulse)
    recurring = sum(t.amount for t in transactions if t.is_recurring)

    from collections import defaultdict
    cats = defaultdict(float)
    for t in transactions:
        if t.transaction_type == "debit":
            cats[t.category] += t.amount
    top = max(cats, key=cats.get) if cats else "—"

    suggestions = [
        f"Total this month: ₹{total:,.0f}",
        f"Top category: {top} (₹{cats.get(top, 0):,.0f})",
        f"Impulse spending: ₹{impulse:,.0f}",
        f"Recurring expenses: ₹{recurring:,.0f}/month",
    ]
    return {"suggestions": suggestions}
