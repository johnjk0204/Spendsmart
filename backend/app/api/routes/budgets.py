from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse
from app.api.deps import get_current_user

router = APIRouter()


async def compute_spent(budget: Budget, user_id: str, db: AsyncSession) -> float:
    now = datetime.now()
    month = budget.month or now.month
    year = budget.year or now.year
    result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            and_(
                Transaction.user_id == user_id,
                Transaction.category == budget.category,
                Transaction.transaction_type == "debit",
                func.extract("month", Transaction.date) == month,
                func.extract("year", Transaction.date) == year,
            )
        )
    )
    return float(result.scalar() or 0.0)


@router.post("/", response_model=BudgetResponse, status_code=201)
async def create_budget(
    data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    budget = Budget(user_id=current_user.id, **data.model_dump())
    db.add(budget)
    await db.commit()
    await db.refresh(budget)

    spent = await compute_spent(budget, current_user.id, db)
    resp = BudgetResponse.model_validate(budget)
    resp.spent_amount = round(spent, 2)
    resp.percentage_used = round(spent / budget.limit_amount * 100, 1) if budget.limit_amount > 0 else 0
    resp.remaining = round(max(0, budget.limit_amount - spent), 2)
    return resp


@router.get("/", response_model=list[BudgetResponse])
async def list_budgets(
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    filters = [Budget.user_id == current_user.id]
    if active_only:
        filters.append(Budget.is_active == True)

    result = await db.execute(select(Budget).where(and_(*filters)))
    budgets = result.scalars().all()

    responses = []
    for budget in budgets:
        spent = await compute_spent(budget, current_user.id, db)
        resp = BudgetResponse.model_validate(budget)
        resp.spent_amount = round(spent, 2)
        resp.percentage_used = round(spent / budget.limit_amount * 100, 1) if budget.limit_amount > 0 else 0
        resp.remaining = round(max(0, budget.limit_amount - spent), 2)
        responses.append(resp)

    return responses


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: str,
    data: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(budget, field, value)
    await db.commit()
    await db.refresh(budget)

    spent = await compute_spent(budget, current_user.id, db)
    resp = BudgetResponse.model_validate(budget)
    resp.spent_amount = round(spent, 2)
    resp.percentage_used = round(spent / budget.limit_amount * 100, 1) if budget.limit_amount > 0 else 0
    resp.remaining = round(max(0, budget.limit_amount - spent), 2)
    return resp


@router.delete("/{budget_id}", status_code=204)
async def delete_budget(
    budget_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    await db.delete(budget)
    await db.commit()
