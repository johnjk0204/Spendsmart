from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import (
    TransactionCreate, TransactionUpdate, TransactionResponse,
    TransactionStats, CategoryBreakdown, SpendingTrend, MonthlyComparison,
)
from app.api.deps import get_current_user

router = APIRouter()

CATEGORY_COLORS = {
    "Food": "#f97316", "Travel": "#3b82f6", "Shopping": "#ec4899",
    "EMI": "#ef4444", "Utilities": "#6b7280", "Entertainment": "#8b5cf6",
    "Medical": "#10b981", "Fuel": "#f59e0b", "Investments": "#22c55e",
    "Subscriptions": "#06b6d4", "Salary": "#4ade80", "Transfer": "#94a3b8",
    "Miscellaneous": "#a78bfa",
}


@router.post("/", response_model=TransactionResponse, status_code=201)
async def create_transaction(
    data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    txn = Transaction(user_id=current_user.id, **data.model_dump())
    db.add(txn)
    await db.commit()
    await db.refresh(txn)
    return TransactionResponse.model_validate(txn)


@router.get("/", response_model=list[TransactionResponse])
async def list_transactions(
    category: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    transaction_type: Optional[str] = None,
    is_recurring: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    filters = [Transaction.user_id == current_user.id]

    if category:
        filters.append(Transaction.category == category)
    if start_date:
        filters.append(Transaction.date >= start_date)
    if end_date:
        filters.append(Transaction.date <= end_date)
    if min_amount is not None:
        filters.append(Transaction.amount >= min_amount)
    if max_amount is not None:
        filters.append(Transaction.amount <= max_amount)
    if transaction_type:
        filters.append(Transaction.transaction_type == transaction_type)
    if is_recurring is not None:
        filters.append(Transaction.is_recurring == is_recurring)
    if search:
        filters.append(Transaction.merchant.ilike(f"%{search}%"))

    result = await db.execute(
        select(Transaction).where(and_(*filters))
        .order_by(desc(Transaction.date))
        .limit(limit)
        .offset(offset)
    )
    return [TransactionResponse.model_validate(t) for t in result.scalars().all()]


@router.get("/stats", response_model=TransactionStats)
async def get_stats(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    filters = [Transaction.user_id == current_user.id]
    if month and year:
        filters.append(func.extract("month", Transaction.date) == month)
        filters.append(func.extract("year", Transaction.date) == year)

    result = await db.execute(select(Transaction).where(and_(*filters)))
    transactions = result.scalars().all()

    total_spent = sum(t.amount for t in transactions if t.transaction_type == "debit")
    total_income = sum(t.amount for t in transactions if t.transaction_type == "credit")
    impulse_count = sum(1 for t in transactions if t.is_impulse)
    recurring_total = sum(t.amount for t in transactions if t.is_recurring and t.transaction_type == "debit")

    from collections import Counter
    cat_totals = {}
    for t in transactions:
        if t.transaction_type == "debit":
            cat_totals[t.category] = cat_totals.get(t.category, 0) + t.amount
    top_category = max(cat_totals, key=cat_totals.get) if cat_totals else "Miscellaneous"

    return TransactionStats(
        total_spent=round(total_spent, 2),
        total_income=round(total_income, 2),
        net_savings=round(total_income - total_spent, 2),
        transaction_count=len(transactions),
        avg_transaction=round(total_spent / len(transactions), 2) if transactions else 0,
        top_category=top_category,
        impulse_count=impulse_count,
        recurring_total=round(recurring_total, 2),
    )


@router.get("/categories", response_model=list[CategoryBreakdown])
async def get_category_breakdown(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    filters = [
        Transaction.user_id == current_user.id,
        Transaction.transaction_type == "debit",
    ]
    if month and year:
        filters.append(func.extract("month", Transaction.date) == month)
        filters.append(func.extract("year", Transaction.date) == year)

    result = await db.execute(select(Transaction).where(and_(*filters)))
    transactions = result.scalars().all()

    cat_data: dict[str, dict] = {}
    total = sum(t.amount for t in transactions)

    for t in transactions:
        if t.category not in cat_data:
            cat_data[t.category] = {"amount": 0, "count": 0}
        cat_data[t.category]["amount"] += t.amount
        cat_data[t.category]["count"] += 1

    return [
        CategoryBreakdown(
            category=cat,
            amount=round(data["amount"], 2),
            count=data["count"],
            percentage=round(data["amount"] / total * 100, 1) if total > 0 else 0,
            color=CATEGORY_COLORS.get(cat, "#94a3b8"),
        )
        for cat, data in sorted(cat_data.items(), key=lambda x: x[1]["amount"], reverse=True)
    ]


@router.get("/trends", response_model=list[SpendingTrend])
async def get_spending_trends(
    days: int = Query(30, ge=7, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from datetime import timedelta
    start = datetime.now() - timedelta(days=days)
    result = await db.execute(
        select(Transaction).where(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.date >= start,
                Transaction.transaction_type == "debit",
            )
        ).order_by(Transaction.date)
    )
    transactions = result.scalars().all()

    daily: dict[str, float] = {}
    for t in transactions:
        key = t.date.strftime("%Y-%m-%d")
        daily[key] = daily.get(key, 0) + t.amount

    return [SpendingTrend(date=date, amount=round(amount, 2)) for date, amount in sorted(daily.items())]


@router.get("/monthly-comparison", response_model=list[MonthlyComparison])
async def get_monthly_comparison(
    months: int = Query(6, ge=2, le=12),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from datetime import timedelta
    from collections import defaultdict
    start = datetime.now() - timedelta(days=months * 31)
    result = await db.execute(
        select(Transaction).where(
            and_(
                Transaction.user_id == current_user.id,
                Transaction.date >= start,
                Transaction.transaction_type == "debit",
            )
        )
    )
    transactions = result.scalars().all()

    monthly: dict[str, dict] = defaultdict(lambda: defaultdict(float))
    for t in transactions:
        month_key = t.date.strftime("%b %Y")
        monthly[month_key]["total"] += t.amount
        cat_lower = t.category.lower()
        if cat_lower in ["food", "travel", "shopping", "utilities", "entertainment"]:
            monthly[month_key][cat_lower] += t.amount
        else:
            monthly[month_key]["other"] += t.amount

    return [
        MonthlyComparison(
            month=month,
            total=round(data.get("total", 0), 2),
            food=round(data.get("food", 0), 2),
            travel=round(data.get("travel", 0), 2),
            shopping=round(data.get("shopping", 0), 2),
            utilities=round(data.get("utilities", 0), 2),
            entertainment=round(data.get("entertainment", 0), 2),
            other=round(data.get("other", 0), 2),
        )
        for month, data in sorted(monthly.items())
    ]


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id,
        )
    )
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return TransactionResponse.model_validate(txn)


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id,
        )
    )
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(txn, field, value)
    await db.commit()
    await db.refresh(txn)
    return TransactionResponse.model_validate(txn)


@router.delete("/{transaction_id}", status_code=204)
async def delete_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id,
        )
    )
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    await db.delete(txn)
    await db.commit()
