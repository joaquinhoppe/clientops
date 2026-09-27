import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Float, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Client(Base):
    __tablename__ = "clients"

    client_id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    project_url = Column(String(512), nullable=False)

    # Health status
    is_online = Column(Boolean, default=True, nullable=False)
    last_checked = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Billing & Recurring Payment tracking
    total_due = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    billing_status = Column(String(32), default="paid", nullable=False)
    payment_due_day = Column(Integer, default=1, nullable=False)  # Day of the month (1-31)
    recurring_amount = Column(Float, default=0.0, nullable=False) # Monthly retainer/fee

    # Software
    current_version = Column(String(64), default="v1.0.0", nullable=False)
    last_update = Column(String(64), default="2026-09-20", nullable=False)

    releases = relationship("Release", back_populates="client", cascade="all, delete-orphan")
    notes = relationship("ClientNote", back_populates="client", cascade="all, delete-orphan", order_by="desc(ClientNote.id)")
    payments = relationship("Payment", back_populates="client", cascade="all, delete-orphan", order_by="desc(Payment.id)")

class Release(Base):
    __tablename__ = "releases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    client_id = Column(String(64), ForeignKey("clients.client_id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(String(64), nullable=False)
    release_date = Column(String(64), nullable=False)
    changelog_raw = Column(Text, default="[]", nullable=False)
    cost = Column(Float, default=0.0, nullable=False)  # Development cost / price for this release

    client = relationship("Client", back_populates="releases")

    @property
    def changelog(self) -> list[str]:
        try:
            return json.loads(self.changelog_raw)
        except Exception:
            return []

    @changelog.setter
    def changelog(self, items: list[str]):
        self.changelog_raw = json.dumps(items)

class ClientNote(Base):
    __tablename__ = "client_notes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    client_id = Column(String(64), ForeignKey("clients.client_id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), default="", nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    client = relationship("Client", back_populates="notes")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    client_id = Column(String(64), ForeignKey("clients.client_id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    due_date = Column(String(64), nullable=False)
    status = Column(String(32), default="unpaid", nullable=False) # "paid", "unpaid", "overdue"
    paid_at = Column(String(64), nullable=True)
    notes = Column(String(512), default="", nullable=False)

    client = relationship("Client", back_populates="payments")
