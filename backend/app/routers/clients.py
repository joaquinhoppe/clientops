import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.auth import verify_api_key
from app.models import Client
from app.schemas import (
    ClientSchema,
    ClientStatus,
    ClientBilling,
    ClientSoftware,
    ClientCreateSchema,
    ClientUpdateSchema,
    ToggleStatusResponse,
)

router = APIRouter(prefix="/api/v1/clients", tags=["clients"], dependencies=[Depends(verify_api_key)])

def serialize_client(c: Client) -> ClientSchema:
    return ClientSchema(
        client_id=c.client_id,
        name=c.name,
        project_url=c.project_url,
        status=ClientStatus(
            is_online=c.is_online,
            last_checked=c.last_checked.isoformat() if hasattr(c.last_checked, "isoformat") else str(c.last_checked)
        ),
        billing=ClientBilling(
            total_due=c.total_due,
            currency=c.currency,
            status=c.billing_status
        ),
        software=ClientSoftware(
            current_version=c.current_version,
            last_update=c.last_update
        )
    )

@router.get("", response_model=list[ClientSchema])
async def get_all_clients(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Client).order_by(Client.name))
    clients = result.scalars().all()
    return [serialize_client(c) for c in clients]

@router.post("", response_model=ClientSchema, status_code=status.HTTP_201_CREATED)
async def create_client(payload: ClientCreateSchema, db: AsyncSession = Depends(get_db)):
    now_utc = datetime.now(timezone.utc)
    client_id = str(uuid.uuid4())
    last_update = payload.last_update or now_utc.strftime("%Y-%m-%d")

    client = Client(
        client_id=client_id,
        name=payload.name.strip(),
        project_url=payload.project_url.strip(),
        is_online=payload.is_online,
        last_checked=now_utc,
        total_due=float(payload.total_due),
        currency=payload.currency.upper(),
        billing_status=payload.billing_status.lower(),
        current_version=payload.current_version.strip(),
        last_update=last_update
    )
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return serialize_client(client)

@router.get("/{client_id}", response_model=ClientSchema)
async def get_client_by_id(client_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Client).where(Client.client_id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return serialize_client(client)

@router.put("/{client_id}", response_model=ClientSchema)
async def update_client(client_id: str, payload: ClientUpdateSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Client).where(Client.client_id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if payload.name is not None:
        client.name = payload.name.strip()
    if payload.project_url is not None:
        client.project_url = payload.project_url.strip()
    if payload.is_online is not None:
        client.is_online = payload.is_online
    if payload.total_due is not None:
        client.total_due = float(payload.total_due)
    if payload.currency is not None:
        client.currency = payload.currency.upper()
    if payload.billing_status is not None:
        client.billing_status = payload.billing_status.lower()
    if payload.current_version is not None:
        client.current_version = payload.current_version.strip()
    if payload.last_update is not None:
        client.last_update = payload.last_update

    client.last_checked = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(client)
    return serialize_client(client)

@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(client_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Client).where(Client.client_id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    await db.delete(client)
    await db.commit()
    return None

@router.post("/{client_id}/toggle-status", response_model=ToggleStatusResponse)
async def toggle_client_status(client_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Client).where(Client.client_id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    client.is_online = not client.is_online
    client.last_checked = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(client)

    return ToggleStatusResponse(
        client_id=client.client_id,
        is_online=client.is_online,
        message=f"Client status switched to {'online' if client.is_online else 'offline'}"
    )
