from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.auth import verify_api_key
from app.models import ClientNote, Client
from app.schemas import ClientNoteSchema, ClientNoteCreateSchema

router = APIRouter(prefix="/api/v1/clients", tags=["notes"], dependencies=[Depends(verify_api_key)])

@router.get("/{client_id}/notes", response_model=list[ClientNoteSchema])
async def get_client_notes(client_id: str, db: AsyncSession = Depends(get_db)):
    client_res = await db.execute(select(Client).where(Client.client_id == client_id))
    if not client_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Client not found")

    result = await db.execute(select(ClientNote).where(ClientNote.client_id == client_id).order_by(ClientNote.id.desc()))
    notes = result.scalars().all()
    return [
        ClientNoteSchema(
            id=n.id,
            client_id=n.client_id,
            title=n.title,
            content=n.content,
            created_at=n.created_at.isoformat() if hasattr(n.created_at, "isoformat") else str(n.created_at)
        )
        for n in notes
    ]

@router.post("/{client_id}/notes", response_model=ClientNoteSchema, status_code=status.HTTP_201_CREATED)
async def create_client_note(client_id: str, payload: ClientNoteCreateSchema, db: AsyncSession = Depends(get_db)):
    client_res = await db.execute(select(Client).where(Client.client_id == client_id))
    if not client_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Client not found")

    note = ClientNote(
        client_id=client_id,
        title=payload.title.strip(),
        content=payload.content.strip(),
        created_at=datetime.now(timezone.utc)
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)

    return ClientNoteSchema(
        id=note.id,
        client_id=note.client_id,
        title=note.title,
        content=note.content,
        created_at=note.created_at.isoformat() if hasattr(note.created_at, "isoformat") else str(note.created_at)
    )

@router.delete("/{client_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client_note(client_id: str, note_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ClientNote).where(ClientNote.client_id == client_id, ClientNote.id == note_id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    await db.delete(note)
    await db.commit()
    return None
