from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from app.config import settings
from app.database import create_tables
from app.api.routes import auth, transactions, budgets, insights, upload, chat, uploads_history
from loguru import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Daily Expense Analyzer API...")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs("./data", exist_ok=True)
    try:
        await create_tables()
        logger.info("Database tables ready")
    except Exception as e:
        logger.warning(f"DB init warning (may be normal in dev): {e}")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered Daily Expense Analyzer with LangGraph agents",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NOTE: /uploads is NOT mounted as a public static route — bank statements must not be publicly accessible

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(budgets.router, prefix="/api/budgets", tags=["Budgets"])
app.include_router(insights.router, prefix="/api/insights", tags=["Insights"])
app.include_router(upload.router, prefix="/api/upload", tags=["File Upload"])
app.include_router(uploads_history.router, prefix="/api/uploads", tags=["Upload History"])
app.include_router(chat.router, prefix="/api/chat", tags=["AI Chat"])


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/")
async def root():
    return {
        "message": "Daily Expense Analyzer API",
        "docs": "/docs",
        "version": settings.APP_VERSION,
    }
