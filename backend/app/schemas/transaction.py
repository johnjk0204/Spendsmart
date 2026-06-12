from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.transaction import ExpenseCategory, TransactionType


class TransactionCreate(BaseModel):
    amount: float
    merchant: str
    description: Optional[str] = None
    category: str = ExpenseCategory.MISCELLANEOUS
    transaction_type: str = TransactionType.DEBIT
    date: datetime
    notes: Optional[str] = None
    tags: Optional[str] = None


class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    merchant: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    transaction_type: Optional[str] = None
    date: Optional[datetime] = None
    notes: Optional[str] = None
    tags: Optional[str] = None


class TransactionResponse(BaseModel):
    id: str
    user_id: str
    amount: float
    merchant: str
    description: Optional[str] = None
    category: str
    transaction_type: str
    date: datetime
    ai_category: Optional[str] = None
    ai_confidence: float = 0.0
    is_impulse: bool = False
    is_suspicious: bool = False
    is_recurring: bool = False
    recurring_interval: Optional[str] = None
    sentiment_tag: Optional[str] = None
    source: str = "manual"
    receipt_url: Optional[str] = None
    tags: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionFilter(BaseModel):
    category: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    transaction_type: Optional[str] = None
    is_recurring: Optional[bool] = None
    search: Optional[str] = None


class TransactionStats(BaseModel):
    total_spent: float
    total_income: float
    net_savings: float
    transaction_count: int
    avg_transaction: float
    top_category: str
    impulse_count: int
    recurring_total: float


class CategoryBreakdown(BaseModel):
    category: str
    amount: float
    count: int
    percentage: float
    color: str


class SpendingTrend(BaseModel):
    date: str
    amount: float
    category: Optional[str] = None


class MonthlyComparison(BaseModel):
    month: str
    total: float
    food: float
    travel: float
    shopping: float
    utilities: float
    entertainment: float
    other: float
