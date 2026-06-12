from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.budget import Insight, Badge
from app.schemas.budget import InsightResponse, HealthScoreResponse, BadgeResponse
from app.api.deps import get_current_user
from app.agents.graph import run_expense_analysis
from app.models.transaction import Transaction

router = APIRouter()


@router.get("/", response_model=list[InsightResponse])
async def list_insights(
    limit: int = Query(20, le=50),
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    filters = [Insight.user_id == current_user.id, Insight.is_dismissed == False]
    if unread_only:
        filters.append(Insight.is_read == False)

    result = await db.execute(
        select(Insight).where(and_(*filters))
        .order_by(desc(Insight.created_at))
        .limit(limit)
    )
    return [InsightResponse.model_validate(i) for i in result.scalars().all()]


@router.post("/{insight_id}/read")
async def mark_read(
    insight_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Insight).where(Insight.id == insight_id, Insight.user_id == current_user.id)
    )
    insight = result.scalar_one_or_none()
    if insight:
        insight.is_read = True
        await db.commit()
    return {"status": "ok"}


@router.post("/{insight_id}/dismiss")
async def dismiss_insight(
    insight_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Insight).where(Insight.id == insight_id, Insight.user_id == current_user.id)
    )
    insight = result.scalar_one_or_none()
    if insight:
        insight.is_dismissed = True
        await db.commit()
    return {"status": "ok"}


@router.get("/health-score", response_model=HealthScoreResponse)
async def get_health_score(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    filters = [Transaction.user_id == current_user.id]
    if month and year:
        from sqlalchemy import func
        filters.append(func.extract("month", Transaction.date) == month)
        filters.append(func.extract("year", Transaction.date) == year)

    from sqlalchemy import and_
    result = await db.execute(select(Transaction).where(and_(*filters)))
    transactions = result.scalars().all()

    if not transactions:
        return HealthScoreResponse(
            score=50.0,
            grade="C",
            savings_score=12.5,
            discipline_score=12.5,
            debt_score=12.5,
            subscription_score=7.5,
            impulse_score=5.0,
            summary="Add transactions to see your real health score.",
            improvements=["Upload a bank statement", "Add your income", "Set budget goals"],
        )

    total_debit = sum(t.amount for t in transactions if t.transaction_type == "debit")
    total_credit = sum(t.amount for t in transactions if t.transaction_type == "credit")
    impulse_count = sum(1 for t in transactions if t.is_impulse)
    recurring_total = sum(t.amount for t in transactions if t.is_recurring and t.transaction_type == "debit")

    savings_rate = ((total_credit - total_debit) / total_credit * 100) if total_credit > 0 else 0
    savings_score = min(25.0, savings_rate * 25 / 30)
    discipline_score = max(0.0, 25.0 - impulse_count * 3)
    sub_pct = (recurring_total / total_debit * 100) if total_debit > 0 else 0
    subscription_score = max(0.0, 15.0 - sub_pct * 0.5)
    impulse_score = max(0.0, 10.0 - impulse_count * 2)
    debt_score = 25.0
    total_score = savings_score + discipline_score + debt_score + subscription_score + impulse_score

    grade = "A" if total_score >= 80 else "B" if total_score >= 65 else "C" if total_score >= 50 else "D"

    improvements = []
    if savings_score < 15:
        improvements.append("Increase your savings rate to at least 20% of income")
    if discipline_score < 15:
        improvements.append("Reduce impulse purchases — wait 24h before non-essential buys")
    if subscription_score < 8:
        improvements.append("Review and cancel unused subscriptions")
    if not improvements:
        improvements.append("Great job! Keep maintaining your spending discipline")

    return HealthScoreResponse(
        score=round(total_score, 1),
        grade=grade,
        savings_score=round(savings_score, 1),
        discipline_score=round(discipline_score, 1),
        debt_score=round(debt_score, 1),
        subscription_score=round(subscription_score, 1),
        impulse_score=round(impulse_score, 1),
        summary=f"Your financial health is {grade}-grade with a score of {total_score:.0f}/100.",
        improvements=improvements,
    )


@router.post("/generate")
async def generate_insights(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger fresh AI insight generation from existing transactions."""
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == current_user.id)
        .order_by(desc(Transaction.date))
        .limit(100)
    )
    transactions = result.scalars().all()

    if not transactions:
        return {"message": "No transactions found. Upload a bank statement first."}

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
    )

    # Save new insights to DB
    ai_insights = analysis.get("spending_insights", {}).get("ai_insights", [])
    for ins_data in ai_insights[:5]:
        insight = Insight(
            user_id=current_user.id,
            type=ins_data.get("type", "info"),
            title=ins_data.get("title", ""),
            body=ins_data.get("body", ""),
            category=ins_data.get("category"),
            priority=ins_data.get("priority", "medium"),
        )
        db.add(insight)

    await db.commit()
    return {
        "insights_generated": len(ai_insights),
        "health_score": analysis.get("health_score", 50),
        "recommendations": analysis.get("recommendations", [])[:3],
    }


@router.get("/badges", response_model=list[BadgeResponse])
async def get_badges(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Badge).where(Badge.user_id == current_user.id)
        .order_by(desc(Badge.earned_at))
    )
    return [BadgeResponse.model_validate(b) for b in result.scalars().all()]
