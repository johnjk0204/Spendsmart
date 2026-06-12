from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    currency = Column(String, default="INR")
    monthly_income = Column(Float, nullable=True)
    savings_goal = Column(Float, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Gamification
    savings_streak = Column(Integer, default=0)
    total_badges = Column(Integer, default=0)
    health_score = Column(Float, default=50.0)
    xp_points = Column(Integer, default=0)

    # Relationships
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    insights = relationship("Insight", back_populates="user", cascade="all, delete-orphan")
