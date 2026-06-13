from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base


class UploadRecord(Base):
    __tablename__ = "upload_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    original_filename = Column(String, nullable=False)
    file_size_kb = Column(Integer, default=0)
    transactions_count = Column(Integer, default=0)
    health_score = Column(Float, default=0.0)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="upload_records")
    transactions = relationship(
        "Transaction",
        back_populates="upload_record",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
