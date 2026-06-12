# SpendSmart AI — Daily Expense Analyzer

> AI-powered personal finance tracker with LangGraph multi-agent intelligence, OCR receipt scanning, predictive analytics, and a beautiful Next.js dashboard.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 15)                  │
│  Dashboard │ Transactions │ Insights │ Budgets │ Chat     │
│  Recharts  │ Framer Motion│ Shadcn UI│ Tailwind │         │
└─────────────────────────┬───────────────────────────────┘
                          │ REST API (axios)
┌─────────────────────────▼───────────────────────────────┐
│                    BACKEND (FastAPI)                      │
│  /api/auth │ /api/transactions │ /api/upload │ /api/chat │
│  /api/budgets │ /api/insights                            │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│              LANGGRAPH AI PIPELINE                        │
│                                                           │
│  [Input] → OCR Agent → Categorization Agent →            │
│           Analysis Agent → Prediction Agent →            │
│           Recommendation Agent → [Output]                 │
│                                                           │
│                ↕ Chat Agent (RAG-based)                   │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│             INFRASTRUCTURE                                │
│   PostgreSQL (data) │ FAISS (vectors) │ Redis (cache)     │
│   Tesseract OCR │ pdfplumber │ JWT Auth                   │
└─────────────────────────────────────────────────────────┘
```

## LangGraph Agent Workflow

```
                    ┌─────────────┐
                    │   INPUT     │
                    │ PDF/IMG/CSV │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  OCR AGENT  │  Tesseract + LLM
                    │  Extracts   │  transaction text
                    └──────┬──────┘
                           │
               ┌───────────▼──────────┐
               │ CATEGORIZATION AGENT │  Rule-based + LLM
               │  Food/Travel/EMI...  │  13 categories
               └───────────┬──────────┘
                           │
                  ┌─────────▼─────────┐
                  │  ANALYSIS AGENT   │  Spending patterns
                  │  Insights + Stats │  Impulse detection
                  └─────────┬─────────┘
                            │
                 ┌──────────▼──────────┐
                 │  PREDICTION AGENT   │  30-day forecast
                 │  Risk assessment    │  Balance prediction
                 └──────────┬──────────┘
                            │
              ┌─────────────▼─────────────┐
              │  RECOMMENDATION AGENT     │  Savings plan
              │  Health Score (0-100)     │  Action items
              └─────────────┬─────────────┘
                            │
                   ┌────────▼────────┐
                   │   CHAT AGENT    │  (optional)
                   │  FinBot Q&A     │  RAG context
                   └─────────────────┘
```

## Project Structure

```
daily-expense-analyzer/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry
│   │   ├── config.py                # Settings via pydantic-settings
│   │   ├── database.py              # Async SQLAlchemy + PostgreSQL
│   │   ├── models/
│   │   │   ├── user.py              # User model (auth + gamification)
│   │   │   ├── transaction.py       # Transaction model (13 categories)
│   │   │   └── budget.py            # Budget, Insight, Badge models
│   │   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── api/routes/
│   │   │   ├── auth.py              # Register, Login, Me
│   │   │   ├── transactions.py      # CRUD + stats + trends
│   │   │   ├── budgets.py           # Budget CRUD + spending compute
│   │   │   ├── insights.py          # AI insights + health score
│   │   │   ├── upload.py            # File upload + text analysis
│   │   │   └── chat.py              # FinBot AI chat
│   │   ├── agents/
│   │   │   ├── graph.py             # LangGraph StateGraph definition
│   │   │   ├── state.py             # ExpenseAnalyzerState TypedDict
│   │   │   ├── ocr_agent.py         # OCR + LLM transaction extraction
│   │   │   ├── categorization_agent.py  # 13-category classifier
│   │   │   ├── analysis_agent.py    # Spending patterns + AI insights
│   │   │   ├── prediction_agent.py  # 30-day forecast + risk scoring
│   │   │   ├── recommendation_agent.py  # Savings plan + health score
│   │   │   └── chat_agent.py        # Conversational FinBot
│   │   └── utils/
│   │       ├── auth.py              # JWT + bcrypt helpers
│   │       └── ocr.py               # Tesseract + pdfplumber extraction
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                 # Landing page (premium design)
│   │   ├── dashboard/page.tsx       # Main dashboard
│   │   ├── transactions/page.tsx    # Transaction list + filters
│   │   ├── insights/page.tsx        # AI insights + health score
│   │   ├── budgets/page.tsx         # Budget tracker
│   │   ├── chat/page.tsx            # FinBot chat interface
│   │   ├── upload/page.tsx          # File upload + text paste
│   │   └── auth/                    # Login + Register
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx          # Animated collapsible sidebar
│   │   │   ├── Header.tsx           # Top bar with dark mode toggle
│   │   │   └── ThemeProvider.tsx
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx         # KPI cards with trend indicators
│   │   │   ├── HealthScoreWidget.tsx # Radial gauge for health score
│   │   │   ├── InsightCards.tsx     # Dismissable AI insight cards
│   │   │   ├── RecentTransactions.tsx
│   │   │   └── BudgetProgressList.tsx
│   │   └── charts/
│   │       ├── SpendingChart.tsx    # Area chart (30-day trend)
│   │       ├── CategoryPieChart.tsx # Donut chart with legend
│   │       └── MonthlyBarChart.tsx  # Stacked bar (6-month)
│   ├── lib/
│   │   ├── api.ts                   # Axios client + all API calls
│   │   ├── store.ts                 # Zustand auth + UI state
│   │   └── utils.ts                 # formatCurrency, colors, etc.
│   ├── package.json
│   └── Dockerfile
│
└── docker-compose.yml               # Full stack with postgres + redis
```

## Database Schema

```sql
-- users
id, email, full_name, hashed_password, currency,
monthly_income, savings_goal, health_score,
savings_streak, xp_points, total_badges, created_at

-- transactions  
id, user_id, amount, merchant, description, category,
transaction_type (debit/credit), date,
ai_category, ai_confidence, is_impulse, is_suspicious,
is_recurring, recurring_interval, sentiment_tag (need/want/luxury),
source (manual/csv/pdf/ocr), receipt_url, tags, notes

-- budgets
id, user_id, category, limit_amount, spent_amount,
period, month, year, alert_threshold, is_active, color

-- insights
id, user_id, type (warning/suggestion/achievement/info),
title, body, category, priority, is_read, is_dismissed

-- badges
id, user_id, name, description, icon, badge_type, earned_at
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| GET | /api/transactions | List with filters |
| POST | /api/transactions | Add manually |
| GET | /api/transactions/stats | Monthly stats |
| GET | /api/transactions/categories | Category breakdown |
| GET | /api/transactions/trends | 30-day daily trend |
| GET | /api/transactions/monthly-comparison | 6-month comparison |
| POST | /api/upload/file | Upload PDF/CSV/image |
| POST | /api/upload/analyze-text | Analyze pasted text |
| GET | /api/insights | List AI insights |
| POST | /api/insights/generate | Trigger AI analysis |
| GET | /api/insights/health-score | Financial health score |
| GET | /api/budgets | List budgets with spent% |
| POST | /api/budgets | Create budget |
| POST | /api/chat | Chat with FinBot |

## AI Capabilities

### OCR Pipeline
1. File uploaded → saved to disk
2. Tesseract OCR extracts raw text (images/PDFs)
3. Heuristic parser finds amount/merchant/date patterns
4. LLM (GPT-4o-mini/Claude) refines extraction into structured JSON

### Categorization
- Rule-based lookup for 50+ known merchants (instant, no API call)
- LLM fallback for ambiguous merchants (batched for efficiency)
- Detects: impulse purchases, recurring subscriptions, suspicious amounts
- Tags sentiment: need / want / luxury

### Financial Health Score (0-100)
| Component | Max Points | Criteria |
|-----------|-----------|---------|
| Savings Rate | 25 | 30% savings = full score |
| Spending Discipline | 25 | Less impulse = higher score |
| Debt Management | 25 | Fixed baseline (future: EMI/debt ratio) |
| Subscription Load | 15 | <10% of spend on subscriptions |
| Impulse Control | 10 | <3 impulse buys/month |

## Setup & Running

### Quick Start (Docker)
```bash
# 1. Clone and configure
cd daily-expense-analyzer
cp backend/.env.example backend/.env
# Edit backend/.env with your OpenAI or Anthropic API key

# 2. Start everything
docker-compose up -d

# 3. Open in browser
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Create .env from .env.example
# Start PostgreSQL locally

uvicorn app.main:app --reload
# → http://localhost:8000/docs
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
# → http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL async URL |
| SECRET_KEY | Yes | JWT signing key (32+ chars) |
| OPENAI_API_KEY | Yes* | OpenAI key (or use Anthropic) |
| ANTHROPIC_API_KEY | Yes* | Anthropic key (alternative) |
| LLM_PROVIDER | No | `openai` or `anthropic` |
| LLM_MODEL | No | `gpt-4o-mini` default |
| REDIS_URL | No | For future caching |

*At least one LLM provider required.

## Key Design Decisions

1. **LangGraph StateGraph** — Stateful multi-agent pipeline with conditional routing (skip OCR for existing transactions)
2. **Hybrid categorization** — Rule-based first (fast, free), LLM only for ambiguous cases
3. **Async FastAPI** — Full async/await with async SQLAlchemy for high concurrency
4. **Zustand** — Lightweight state management (vs Redux overhead)
5. **Recharts** — Responsive, themeable charts that work with dark mode

## Production Checklist

- [ ] Change `SECRET_KEY` to a random 64-char string
- [ ] Set `DEBUG=false` in backend `.env`
- [ ] Use a managed PostgreSQL (RDS/Supabase/Neon)
- [ ] Configure proper CORS origins
- [ ] Add rate limiting (slowapi)
- [ ] Set up SSL/TLS (nginx reverse proxy)
- [ ] Configure log aggregation (Sentry/Datadog)
- [ ] Enable Redis for session caching
- [ ] Set up automated backups for PostgreSQL
