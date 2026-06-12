from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    currency: str = "INR"


class UserCreate(UserBase):
    password: str
    monthly_income: Optional[float] = None
    savings_goal: Optional[float] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    currency: Optional[str] = None
    monthly_income: Optional[float] = None
    savings_goal: Optional[float] = None
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    id: str
    is_active: bool
    monthly_income: Optional[float] = None
    savings_goal: Optional[float] = None
    avatar_url: Optional[str] = None
    savings_streak: int = 0
    total_badges: int = 0
    health_score: float = 50.0
    xp_points: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
