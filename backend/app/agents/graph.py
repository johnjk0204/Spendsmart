from langgraph.graph import StateGraph, END
from app.agents.state import ExpenseAnalyzerState
from app.agents.ocr_agent import ocr_node
from app.agents.categorization_agent import categorization_node
from app.agents.analysis_agent import analysis_node
from app.agents.prediction_agent import prediction_node
from app.agents.recommendation_agent import recommendation_node
from app.agents.chat_agent import chat_node
from loguru import logger


def should_run_ocr(state: ExpenseAnalyzerState) -> str:
    """Route: skip OCR for manual entries that already have transactions."""
    if state.get("input_type") == "transactions_only":
        return "categorize"
    return "ocr"


def should_run_chat(state: ExpenseAnalyzerState) -> str:
    """Route: only run chat node if there's a user query."""
    if state.get("user_query"):
        return "chat"
    return END


def build_expense_analyzer_graph() -> StateGraph:
    """
    LangGraph workflow:

    [input] → OCR → Categorize → Analyze → Predict → Recommend → [output]
                                                                       ↓
                                                                    [Chat?] → END
    """
    graph = StateGraph(ExpenseAnalyzerState)

    # Add nodes
    graph.add_node("ocr", ocr_node)
    graph.add_node("categorize", categorization_node)
    graph.add_node("analyze", analysis_node)
    graph.add_node("predict", prediction_node)
    graph.add_node("recommend", recommendation_node)
    graph.add_node("chat", chat_node)

    # Entry point with conditional routing
    graph.set_conditional_entry_point(
        should_run_ocr,
        {
            "ocr": "ocr",
            "categorize": "categorize",
        },
    )

    # Linear pipeline
    graph.add_edge("ocr", "categorize")
    graph.add_edge("categorize", "analyze")
    graph.add_edge("analyze", "predict")
    graph.add_edge("predict", "recommend")

    # Conditional exit: run chat if query present
    graph.add_conditional_edges(
        "recommend",
        should_run_chat,
        {"chat": "chat", END: END},
    )
    graph.add_edge("chat", END)

    return graph.compile()


# Compile once at module load
expense_analyzer_graph = build_expense_analyzer_graph()


async def run_expense_analysis(
    user_id: str,
    input_type: str,
    raw_input: str = "",
    file_path: str | None = None,
    existing_transactions: list | None = None,
    user_query: str = "",
    chat_history: list | None = None,
) -> dict:
    """Run the full expense analysis pipeline."""
    logger.info(f"Running expense analysis for user={user_id}, type={input_type}")

    initial_state: ExpenseAnalyzerState = {
        "user_id": user_id,
        "input_type": input_type,
        "raw_input": raw_input,
        "file_path": file_path,
        "extracted_text": "",
        "raw_transactions": existing_transactions or [],
        "categorized_transactions": [],
        "spending_insights": {},
        "category_breakdown": {},
        "impulse_analysis": {},
        "subscription_list": [],
        "predictions": {},
        "forecast_data": [],
        "recommendations": [],
        "savings_plan": {},
        "health_score": 50.0,
        "chat_history": chat_history or [],
        "user_query": user_query,
        "chat_response": "",
        "errors": [],
        "current_step": "init",
    }

    final_state = await expense_analyzer_graph.ainvoke(initial_state)
    return dict(final_state)
