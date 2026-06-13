import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.api.deps import get_current_user
from app.agents.graph import run_expense_analysis
from app.config import settings
from loguru import logger

router = APIRouter()

ALLOWED_TYPES = {
    "application/pdf", "image/png", "image/jpeg", "image/jpg",
    "image/webp", "text/csv", "application/vnd.ms-excel",
    "application/octet-stream",
}


@router.post("/file")
async def upload_file(
    file: UploadFile = File(...),
    pdf_password: str = Form(default=""),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in [".pdf", ".png", ".jpg", ".jpeg", ".csv", ".webp"]:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    # Size check
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large (max {settings.MAX_FILE_SIZE_MB}MB)")

    # Save file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename or "file.bin")[1]
    file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}{ext}")

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    logger.info(f"File saved: {file_path} ({len(content)} bytes)")

    # Determine input type
    input_type = "file"
    if ext in [".csv"]:
        # For CSV, read as text
        try:
            csv_text = content.decode("utf-8", errors="ignore")
            input_type = "text"
            result = await run_expense_analysis(
                user_id=current_user.id,
                input_type=input_type,
                raw_input=csv_text,
            )
        except Exception:
            result = await run_expense_analysis(
                user_id=current_user.id,
                input_type="file",
                file_path=file_path,
            )
    else:
        try:
            result = await run_expense_analysis(
                user_id=current_user.id,
                input_type="file",
                file_path=file_path,
                pdf_password=pdf_password or None,
            )
        except ValueError as e:
            try:
                os.remove(file_path)
            except Exception:
                pass
            raise HTTPException(status_code=400, detail=str(e))

    # Persist extracted transactions to DB
    saved_count = 0
    for txn_data in result.get("categorized_transactions", []):
        try:
            date_val = txn_data.get("date")
            if isinstance(date_val, str):
                try:
                    date_obj = datetime.strptime(date_val, "%Y-%m-%d")
                except ValueError:
                    date_obj = datetime.now()
            else:
                date_obj = datetime.now()

            txn = Transaction(
                user_id=current_user.id,
                amount=float(txn_data.get("amount", 0)),
                merchant=str(txn_data.get("merchant", "Unknown"))[:200],
                description=txn_data.get("description"),
                category=txn_data.get("category", "Miscellaneous"),
                transaction_type=txn_data.get("transaction_type", "debit"),
                date=date_obj,
                ai_category=txn_data.get("category"),
                ai_confidence=float(txn_data.get("confidence", 0.8)),
                is_impulse=bool(txn_data.get("is_impulse", False)),
                is_suspicious=bool(txn_data.get("is_suspicious", False)),
                is_recurring=bool(txn_data.get("is_recurring", False)),
                recurring_interval=txn_data.get("recurring_interval"),
                sentiment_tag=txn_data.get("sentiment_tag"),
                source="upload",
                receipt_url=None,
            )
            db.add(txn)
            saved_count += 1
        except Exception as e:
            logger.warning(f"Failed to save transaction: {e}")

    await db.commit()
    logger.info(f"Saved {saved_count} transactions for user {current_user.id}")

    # Delete the file immediately after processing — bank statements must not be retained
    try:
        os.remove(file_path)
    except Exception as e:
        logger.warning(f"Could not delete uploaded file {file_path}: {e}")

    return {
        "message": f"Successfully processed file and extracted {saved_count} transactions",
        "file_id": file_id,
        "transactions_found": len(result.get("categorized_transactions", [])),
        "transactions_saved": saved_count,
        "insights": result.get("spending_insights", {}),
        "category_breakdown": result.get("category_breakdown", {}),
        "recommendations": result.get("recommendations", [])[:3],
        "health_score": result.get("health_score", 50),
        "errors": result.get("errors", []),
    }


@router.post("/analyze-text")
async def analyze_text(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Analyze pasted bank statement text."""
    raw_text = payload.get("text", "").strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="No text provided")

    result = await run_expense_analysis(
        user_id=current_user.id,
        input_type="text",
        raw_input=raw_text,
    )

    return {
        "transactions_found": len(result.get("categorized_transactions", [])),
        "insights": result.get("spending_insights", {}),
        "category_breakdown": result.get("category_breakdown", {}),
        "predictions": result.get("predictions", {}),
        "recommendations": result.get("recommendations", []),
        "health_score": result.get("health_score", 50),
    }
