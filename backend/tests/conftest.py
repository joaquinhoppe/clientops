import pytest
import pytest_asyncio
from app.database import engine, Base, AsyncSessionLocal
from app.seed import seed_database

@pytest_asyncio.fixture(autouse=True)
async def init_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        await seed_database(session)

    yield

    # Clean up
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
