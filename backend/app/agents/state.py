from typing import TypedDict, Optional, Annotated
import operator


class ExpenseAnalyzerState(TypedDict):
    # Input
    user_id: str
    input_type: str              # "file" | "manual" | "text"
    raw_input: str               # raw text from OCR or manual entry
    file_path: Optional[str]
    pdf_password: Optional[str]

    # OCR output
    extracted_text: str
    raw_transactions: list       # parsed but uncategorized

    # Categorized transactions
    categorized_transactions: list

    # Analysis results
    spending_insights: dict
    category_breakdown: dict
    impulse_analysis: dict
    subscription_list: list

    # Predictions
    predictions: dict
    forecast_data: list

    # Recommendations
    recommendations: list
    savings_plan: dict
    health_score: float

    # Chat
    chat_history: Annotated[list, operator.add]
    user_query: str
    chat_response: str

    # Errors
    errors: Annotated[list, operator.add]
    current_step: str
