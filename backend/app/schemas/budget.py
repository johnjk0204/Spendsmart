from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BudgetCreate(BaseModel):
    category: str
    limit_amount: float
    period: str = "monthly"
    month: Optional[int] = None
    year: Optional[int] = None
    alert_threshold: float = 80.0
    color: str = "#6366f1"
    icon: Optional[str] = None


class BudgetUpdate(BaseModel):
    limit_amount: Optional[float] = None
    alert_threshold: Optional[float] = None
    is_active: Optional[bool] = None
    color: Optional[str] = None


class BudgetResponse(BaseModel):
    id: str
    user_id: str
    category: str
    limit_amount: float
    spent_amount: float
    period: str
    month: Optional[int] = None
    year: Optional[int] = None
    alert_threshold: float
    is_active: bool
    color: str
    icon: Optional[str] = None
    created_at: datetime
    percentage_used: float = 0.0
    remaining: float = 0.0

    class Config:
        from_attributes = True


class InsightResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    body: str
    category: Optional[str] = None
    priority: str
    is_read: bool
    is_dismissed: bool
    data: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class HealthScoreResponse(BaseModel):
    score: float
    grade: str
    savings_score: float
    discipline_score: float
    debt_score: float
    subscription_score: float
    impulse_score: float
    summary: str
    improvements: list[str]


class BadgeResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    icon: Optional[str]
    badge_type: str
    earned_at: datetime

    class Config:
        from_attributes = True
