import json
from langchain_core.messages import HumanMessage, SystemMessage
from app.agents.state import ExpenseAnalyzerState
from app.agents.llm_factory import get_llm
from app.utils.ocr import extract_file_text, parse_transactions_from_text
from loguru import logger


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


def ocr_node(state: ExpenseAnalyzerState) -> ExpenseAnalyzerState:
    """Extract and parse transactions from raw input."""
    logger.info(f"OCR Agent: processing input type={state['input_type']}")
    state["current_step"] = "ocr"

    try:
        if state["input_type"] == "file" and state.get("file_path"):
            raw_text = extract_file_text(state["file_path"], "", password=state.get("pdf_password"))
        elif state["input_type"] in ("manual", "text"):
            raw_text = state.get("raw_input", "")
        else:
            raw_text = state.get("raw_input", "")

        state["extracted_text"] = raw_text

        if not raw_text.strip():
            state["raw_transactions"] = []
            return state

        # First pass: heuristic parsing
        heuristic_txns = parse_transactions_from_text(raw_text)

        # Second pass: LLM refinement
        llm = get_llm(temperature=0.0)
        messages = [
            SystemMessage(content=OCR_SYSTEM_PROMPT),
            HumanMessage(content=f"Parse transactions from this text:\n\n{raw_text[:4000]}"),
        ]

        response = llm.invoke(messages)
        content = response.content.strip()

        # Extract JSON from response
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        try:
            llm_transactions = json.loads(content)
            if isinstance(llm_transactions, list) and llm_transactions:
                state["raw_transactions"] = llm_transactions
            else:
                state["raw_transactions"] = heuristic_txns
        except json.JSONDecodeError:
            logger.warning("LLM returned invalid JSON, using heuristic parsing")
            state["raw_transactions"] = heuristic_txns

    except ValueError:
        raise
    except Exception as e:
        logger.error(f"OCR Agent error: {e}")
        state["errors"].append(f"OCR error: {str(e)}")
        state["raw_transactions"] = []

    logger.info(f"OCR Agent: extracted {len(state['raw_transactions'])} transactions")
    return state
