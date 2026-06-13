from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.database import get_db
from app.models.user import User
from app.models.upload_record import UploadRecord
from app.api.deps import get_current_user

router = APIRouter()


@router.get("")
async def list_uploads(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UploadRecord)
        .where(UploadRecord.user_id == current_user.id)
        .order_by(UploadRecord.uploaded_at.desc())
    )
    records = result.scalars().all()
    return [
        {
            "id": r.id,
            "filename": r.original_filename,
            "file_size_kb": r.file_size_kb,
            "transactions_count": r.transactions_count,
            "health_score": r.health_score,
            "uploaded_at": r.uploaded_at.isoformat() if r.uploaded_at else None,
        }
        for r in records
    ]


@router.delete("/{upload_id}")
async def delete_upload(
    upload_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UploadRecord).where(
            UploadRecord.id == upload_id,
            UploadRecord.user_id == current_user.id,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Upload not found")

    await db.delete(record)
    await db.commit()
    return {"message": f"Deleted upload and {record.transactions_count} transactions"}
