from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, AsyncSessionLocal
from app.seed import seed_database
from app.routers import health, clients, releases, notes, payments

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed data
    async with AsyncSessionLocal() as session:
        await seed_database(session)

    yield

app = FastAPI(
    title="ClientOps Backend API",
    version="1.0.0",
    description="RESTful API for ClientOps Web Clients Monitoring Dashboard",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(clients.router)
app.include_router(releases.router)
app.include_router(notes.router)
app.include_router(payments.router)
