from sqlalchemy import Column, String, Float, DateTime, Boolean, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    category = Column(String, nullable=False)
    limit_amount = Column(Float, nullable=False)
    spent_amount = Column(Float, default=0.0)
    period = Column(String, default="monthly")  # monthly, weekly, yearly
    month = Column(Integer, nullable=True)
    year = Column(Integer, nullable=True)
    alert_threshold = Column(Float, default=80.0)  # percentage
    is_active = Column(Boolean, default=True)
    color = Column(String, default="#6366f1")
    icon = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="budgets")


class Insight(Base):
    __tablename__ = "insights"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String, nullable=False)  # warning, suggestion, achievement, prediction
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    category = Column(String, nullable=True)
    priority = Column(String, default="medium")  # high, medium, low
    is_read = Column(Boolean, default=False)
    is_dismissed = Column(Boolean, default=False)
    data = Column(Text, nullable=True)  # JSON string for chart data
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="insights")


class Badge(Base):
    __tablename__ = "badges"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    badge_type = Column(String, nullable=False)  # streak, savings, milestone
