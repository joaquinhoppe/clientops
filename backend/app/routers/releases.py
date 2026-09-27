import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.auth import verify_api_key
from app.models import Release, Client
from app.schemas import ReleaseSchema, ReleaseCreateSchema

router = APIRouter(prefix="/api/v1/clients", tags=["releases"], dependencies=[Depends(verify_api_key)])

@router.get("/{client_id}/releases", response_model=list[ReleaseSchema])
async def get_client_releases(client_id: str, db: AsyncSession = Depends(get_db)):
    client_res = await db.execute(select(Client).where(Client.client_id == client_id))
    if not client_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Client not found")

    result = await db.execute(select(Release).where(Release.client_id == client_id).order_by(Release.id.desc()))
    releases = result.scalars().all()
    return [
        ReleaseSchema(
            id=r.id,
            version=r.version,
            release_date=r.release_date,
            changelog=r.changelog
        )
        for r in releases
    ]

@router.post("/{client_id}/releases", response_model=ReleaseSchema, status_code=status.HTTP_201_CREATED)
async def create_client_release(client_id: str, payload: ReleaseCreateSchema, db: AsyncSession = Depends(get_db)):
    client_res = await db.execute(select(Client).where(Client.client_id == client_id))
    client = client_res.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    release_date = payload.release_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    release = Release(
        client_id=client_id,
        version=payload.version.strip(),
        release_date=release_date,
        changelog_raw=json.dumps(payload.changelog)
    )
    db.add(release)

    # Automatically synchronize client current version and last update
    client.current_version = payload.version.strip()
    client.last_update = release_date

    await db.commit()
    await db.refresh(release)

    return ReleaseSchema(
        id=release.id,
        version=release.version,
        release_date=release.release_date,
        changelog=release.changelog
    )

@router.delete("/{client_id}/releases/{release_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client_release(client_id: str, release_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Release).where(Release.client_id == client_id, Release.id == release_id))
    release = result.scalar_one_or_none()
    if not release:
        raise HTTPException(status_code=404, detail="Release not found")

    await db.delete(release)
    await db.commit()
    return None
