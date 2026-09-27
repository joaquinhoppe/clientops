from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.auth import verify_api_key
from app.models import Release, Client
from app.schemas import ReleaseSchema

router = APIRouter(prefix="/api/v1/clients", tags=["releases"], dependencies=[Depends(verify_api_key)])

@router.get("/{client_id}/releases", response_model=list[ReleaseSchema])
async def get_client_releases(client_id: str, db: AsyncSession = Depends(get_db)):
    # Check client exists
    client_res = await db.execute(select(Client).where(Client.client_id == client_id))
    if not client_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Client not found")

    result = await db.execute(select(Release).where(Release.client_id == client_id).order_by(Release.id.desc()))
    releases = result.scalars().all()
    return [
        ReleaseSchema(
            version=r.version,
            release_date=r.release_date,
            changelog=r.changelog
        )
        for r in releases
    ]
