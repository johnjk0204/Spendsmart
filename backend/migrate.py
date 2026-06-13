"""
One-time schema migration:
  1. Create upload_records table (if it doesn't exist)
  2. Add upload_id column to transactions (if it doesn't exist)

Run from the backend directory:
    python migrate.py
"""
import asyncio
import os
from pathlib import Path

# Load .env so we have DATABASE_URL
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = os.environ.get("DATABASE_URL", "")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not found in environment or .env file")


async def run():
    print(f"Connecting to: {DATABASE_URL[:50]}...")
    engine = create_async_engine(DATABASE_URL, echo=False)

    async with engine.begin() as conn:
        # ── 1. Create upload_records table ──────────────────────────
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS upload_records (
                id          VARCHAR PRIMARY KEY,
                user_id     VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                original_filename VARCHAR NOT NULL,
                file_size_kb      INTEGER DEFAULT 0,
                transactions_count INTEGER DEFAULT 0,
                health_score      FLOAT DEFAULT 0.0,
                uploaded_at TIMESTAMPTZ DEFAULT now()
            )
        """))
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_upload_records_user_id
            ON upload_records(user_id)
        """))
        print("[OK] upload_records table ready")

        # ── 2. Add upload_id column to transactions ──────────────────
        await conn.execute(text("""
            ALTER TABLE transactions
            ADD COLUMN IF NOT EXISTS upload_id VARCHAR
                REFERENCES upload_records(id) ON DELETE CASCADE
        """))
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_transactions_upload_id
            ON transactions(upload_id)
        """))
        print("[OK] transactions.upload_id column ready")

    await engine.dispose()
    print("\nMigration complete -- transactions tab should work now.")


asyncio.run(run())
