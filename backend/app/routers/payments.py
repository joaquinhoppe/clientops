from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.auth import verify_api_key
from app.models import Payment, Client
from app.schemas import PaymentSchema, PaymentCreateSchema, PaymentUpdateSchema

router = APIRouter(prefix="/api/v1/clients", tags=["payments"], dependencies=[Depends(verify_api_key)])

@router.get("/{client_id}/payments", response_model=list[PaymentSchema])
async def get_client_payments(client_id: str, db: AsyncSession = Depends(get_db)):
    client_res = await db.execute(select(Client).where(Client.client_id == client_id))
    if not client_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Client not found")

    result = await db.execute(select(Payment).where(Payment.client_id == client_id).order_by(Payment.id.desc()))
    payments = result.scalars().all()
    return [
        PaymentSchema(
            id=p.id,
            client_id=p.client_id,
            amount=p.amount,
            currency=p.currency,
            due_date=p.due_date,
            status=p.status,
            paid_at=p.paid_at,
            notes=p.notes
        )
        for p in payments
    ]

@router.post("/{client_id}/payments", response_model=PaymentSchema, status_code=status.HTTP_201_CREATED)
async def create_client_payment(client_id: str, payload: PaymentCreateSchema, db: AsyncSession = Depends(get_db)):
    client_res = await db.execute(select(Client).where(Client.client_id == client_id))
    client = client_res.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    payment = Payment(
        client_id=client_id,
        amount=float(payload.amount),
        currency=payload.currency.upper(),
        due_date=payload.due_date,
        status=payload.status.lower(),
        paid_at=payload.paid_at,
        notes=payload.notes.strip()
    )
    db.add(payment)

    # If marked paid, update client's billing status accordingly
    if payload.status.lower() == "paid":
        client.billing_status = "paid"
        client.total_due = max(0.0, client.total_due - float(payload.amount))
    elif payload.status.lower() == "unpaid":
        client.billing_status = "overdue"
        client.total_due += float(payload.amount)

    await db.commit()
    await db.refresh(payment)

    return PaymentSchema(
        id=payment.id,
        client_id=payment.client_id,
        amount=payment.amount,
        currency=payment.currency,
        due_date=payment.due_date,
        status=payment.status,
        paid_at=payment.paid_at,
        notes=payment.notes
    )

@router.put("/{client_id}/payments/{payment_id}", response_model=PaymentSchema)
async def update_client_payment(client_id: str, payment_id: int, payload: PaymentUpdateSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Payment).where(Payment.client_id == client_id, Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    client_res = await db.execute(select(Client).where(Client.client_id == client_id))
    client = client_res.scalar_one_or_none()

    if payload.amount is not None:
        payment.amount = float(payload.amount)
    if payload.status is not None:
        old_status = payment.status
        new_status = payload.status.lower()
        payment.status = new_status
        if new_status == "paid":
            payment.paid_at = payload.paid_at or datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
            if client:
                client.billing_status = "paid"
                client.total_due = 0.0
        elif new_status in ("unpaid", "overdue"):
            payment.paid_at = None
            if client:
                client.billing_status = "overdue"
                client.total_due = payment.amount
    if payload.paid_at is not None:
        payment.paid_at = payload.paid_at
    if payload.notes is not None:
        payment.notes = payload.notes.strip()

    await db.commit()
    await db.refresh(payment)

    return PaymentSchema(
        id=payment.id,
        client_id=payment.client_id,
        amount=payment.amount,
        currency=payment.currency,
        due_date=payment.due_date,
        status=payment.status,
        paid_at=payment.paid_at,
        notes=payment.notes
    )

@router.delete("/{client_id}/payments/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client_payment(client_id: str, payment_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Payment).where(Payment.client_id == client_id, Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    await db.delete(payment)
    await db.commit()
    return None
