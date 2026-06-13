from sqlalchemy import Column, String, Float, DateTime, Boolean, ForeignKey, Text, Enum, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.database import Base


class ExpenseCategory(str, enum.Enum):
    FOOD = "Food"
    TRAVEL = "Travel"
    SHOPPING = "Shopping"
    EMI = "EMI"
    UTILITIES = "Utilities"
    ENTERTAINMENT = "Entertainment"
    MEDICAL = "Medical"
    FUEL = "Fuel"
    INVESTMENTS = "Investments"
    SUBSCRIPTIONS = "Subscriptions"
    SALARY = "Salary"
    TRANSFER = "Transfer"
    MISCELLANEOUS = "Miscellaneous"


class TransactionType(str, enum.Enum):
    DEBIT = "debit"
    CREDIT = "credit"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    # Core fields
    amount = Column(Float, nullable=False)
    merchant = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, default=ExpenseCategory.MISCELLANEOUS)
    transaction_type = Column(String, default=TransactionType.DEBIT)
    date = Column(DateTime(timezone=True), nullable=False)

    # AI-enriched
    ai_category = Column(String, nullable=True)
    ai_confidence = Column(Float, default=0.0)
    is_impulse = Column(Boolean, default=False)
    is_suspicious = Column(Boolean, default=False)
    is_recurring = Column(Boolean, default=False)
    recurring_interval = Column(String, nullable=True)  # monthly, weekly, etc.
    sentiment_tag = Column(String, nullable=True)  # need, want, luxury

    # Source
    source = Column(String, default="manual")  # manual, csv, pdf, ocr
    upload_id = Column(String, ForeignKey("upload_records.id", ondelete="CASCADE"), nullable=True, index=True)
    raw_text = Column(Text, nullable=True)
    receipt_url = Column(String, nullable=True)

    # Metadata
    tags = Column(Text, nullable=True)  # comma-separated tags
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="transactions")
    upload_record = relationship("UploadRecord", back_populates="transactions")
