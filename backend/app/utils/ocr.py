import re
import os
import tempfile
from pathlib import Path
from typing import Optional
from PIL import Image
import pytesseract
import pdfplumber
from loguru import logger


def extract_text_from_image(image_path: str) -> str:
    try:
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img, config="--psm 6 --oem 3")
        return text.strip()
    except Exception as e:
        logger.error(f"OCR error on image {image_path}: {e}")
        return ""


def _pdfplumber_extract(pdf_path: str) -> str:
    """Extract text and tables from a (decrypted) PDF using pdfplumber."""
    text_parts = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if row:
                            text_parts.append(" | ".join(str(c) for c in row if c))
    except Exception as e:
        logger.error(f"pdfplumber extraction error {pdf_path}: {e}")
    return "\n".join(text_parts)


def extract_text_from_pdf(pdf_path: str, password: str = None) -> str:
    # If password provided, use pikepdf to decrypt to a temp file first
    if password:
        try:
            import pikepdf
            tmp_path = None
            try:
                with pikepdf.open(pdf_path, password=password) as pdf_obj:
                    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                        tmp_path = tmp.name
                    pdf_obj.save(tmp_path)
                logger.info(f"pikepdf decrypted PDF to {tmp_path}")
                return _pdfplumber_extract(tmp_path)
            finally:
                if tmp_path and os.path.exists(tmp_path):
                    os.unlink(tmp_path)
        except Exception as e:
            logger.error(f"pikepdf decrypt failed for {pdf_path}: {e}")
            raise ValueError(f"Could not decrypt PDF — check the password. ({e})")

    # No password — try direct extraction
    text = _pdfplumber_extract(pdf_path)
    if not text.strip():
        logger.warning(f"No text extracted from {pdf_path} — may be password-protected or image-based")
    return text


def parse_transactions_from_text(raw_text: str) -> list[dict]:
    """Heuristic parser for bank statement text."""
    transactions = []
    amount_pattern = r"(?:₹|Rs\.?|INR\s?)[\s]?([\d,]+(?:\.\d{2})?)"
    date_pattern = r"(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{2}\s+\w{3}\s+\d{4})"

    lines = raw_text.split("\n")
    for line in lines:
        line = line.strip()
        if not line or len(line) < 10:
            continue

        amount_match = re.search(amount_pattern, line)
        date_match = re.search(date_pattern, line)

        if amount_match:
            amount_str = amount_match.group(1).replace(",", "")
            try:
                amount = float(amount_str)
            except ValueError:
                continue

            merchant = re.sub(amount_pattern, "", line)
            merchant = re.sub(date_pattern, "", merchant).strip()
            merchant = re.sub(r"\s+", " ", merchant)[:100]

            transactions.append({
                "amount": amount,
                "merchant": merchant if merchant else "Unknown",
                "date_str": date_match.group(0) if date_match else None,
                "raw_line": line,
            })

    return transactions


def extract_file_text(file_path: str, file_type: str, password: str = None) -> str:
    """Route to appropriate extractor based on file type."""
    ext = Path(file_path).suffix.lower()

    if ext == ".pdf":
        return extract_text_from_pdf(file_path, password=password)
    elif ext in [".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"]:
        return extract_text_from_image(file_path)
    else:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception:
            return ""
