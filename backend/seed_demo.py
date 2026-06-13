"""Run once to create the demo user in the database."""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.config import settings
from app.models.user import User
from app.utils.auth import hash_password

engine = create_async_engine(settings.DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def seed():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "demo@spendsmart.ai"))
        if result.scalar_one_or_none():
            print("Demo user already exists.")
            return

        user = User(
            email="demo@spendsmart.ai",
            full_name="Demo User",
            hashed_password=hash_password("demo1234"),
            monthly_income=60000.0,
            currency="INR",
        )
        db.add(user)
        await db.commit()
        print("Demo user created: demo@spendsmart.ai / demo1234")


asyncio.run(seed())
