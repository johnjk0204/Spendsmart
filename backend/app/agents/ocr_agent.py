import json
from langchain_core.messages import HumanMessage, SystemMessage
from app.agents.state import ExpenseAnalyzerState
from app.agents.llm_factory import get_llm
from app.utils.ocr import extract_file_text, parse_transactions_from_text
from loguru import logger

CHUNK_SIZE = 6000   # characters per LLM call
CHUNK_OVERLAP = 200 # overlap to avoid splitting mid-transaction

OCR_SYSTEM_PROMPT = """You are an expert financial document parser.
Given raw text extracted from a bank statement, receipt, or financial screenshot,
extract all transactions in structured JSON format.

Output a JSON array of transactions:
[
  {
    "merchant": "Merchant Name",
    "amount": 250.00,
    "date": "2024-01-15",
    "transaction_type": "debit",
    "description": "Optional description"
  }
]

Rules:
- Amount should always be a positive float
- transaction_type: "debit" for expenses, "credit" for income/refunds
- If date is unclear, use today's date
- Clean merchant names (remove transaction IDs, codes)
- Return ONLY valid JSON, no other text
"""


def _split_chunks(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks so no transaction is cut off at a boundary."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks


def _parse_chunk(llm, chunk: str) -> list:
    """Send one chunk to the LLM and return parsed transactions."""
    messages = [
        SystemMessage(content=OCR_SYSTEM_PROMPT),
        HumanMessage(content=f"Parse all transactions from this bank statement text:\n\n{chunk}"),
    ]
    try:
        response = llm.invoke(messages)
        content = response.content.strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        parsed = json.loads(content)
        return parsed if isinstance(parsed, list) else []
    except Exception as e:
        logger.warning(f"Chunk parse failed: {e}")
        return []


def _deduplicate(transactions: list) -> list:
    """Remove duplicate transactions by (date, amount, merchant)."""
    seen = set()
    unique = []
    for txn in transactions:
        key = (
            str(txn.get("date", "")).strip(),
            str(txn.get("amount", "")).strip(),
            str(txn.get("merchant", "")).strip().lower()[:30],
        )
        if key not in seen:
            seen.add(key)
            unique.append(txn)
    return unique


def ocr_node(state: ExpenseAnalyzerState) -> ExpenseAnalyzerState:
    """Extract and parse transactions from raw input — handles multi-page PDFs via chunking."""
    logger.info(f"OCR Agent: processing input type={state['input_type']}")
    state["current_step"] = "ocr"

    try:
        if state["input_type"] == "file" and state.get("file_path"):
            raw_text = extract_file_text(state["file_path"], "", password=state.get("pdf_password"))
        else:
            raw_text = state.get("raw_input", "")

        state["extracted_text"] = raw_text

        if not raw_text.strip():
            state["raw_transactions"] = []
            return state

        logger.info(f"OCR Agent: extracted {len(raw_text)} characters from document")

        # Heuristic pass over full text
        heuristic_txns = parse_transactions_from_text(raw_text)

        # LLM pass — chunk the full text so ALL pages are processed
        llm = get_llm(temperature=0.0)
        chunks = _split_chunks(raw_text)
        logger.info(f"OCR Agent: processing {len(chunks)} chunk(s) with LLM")

        all_llm_txns = []
        for i, chunk in enumerate(chunks):
            logger.info(f"OCR Agent: chunk {i+1}/{len(chunks)} ({len(chunk)} chars)")
            txns = _parse_chunk(llm, chunk)
            all_llm_txns.extend(txns)

        if all_llm_txns:
            deduped = _deduplicate(all_llm_txns)
            logger.info(f"OCR Agent: {len(all_llm_txns)} raw → {len(deduped)} after dedup")
            state["raw_transactions"] = deduped
        else:
            logger.warning("LLM returned no transactions, falling back to heuristic")
            state["raw_transactions"] = heuristic_txns

    except ValueError:
        raise
    except Exception as e:
        logger.error(f"OCR Agent error: {e}")
        state["errors"].append(f"OCR error: {str(e)}")
        state["raw_transactions"] = []

    logger.info(f"OCR Agent: final transaction count = {len(state['raw_transactions'])}")
    return state
