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

    # Billing
    total_due = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    billing_status = Column(String(32), default="paid", nullable=False)

    # Software
    current_version = Column(String(64), default="v1.0.0", nullable=False)
    last_update = Column(String(64), default="2026-09-20", nullable=False)

    releases = relationship("Release", back_populates="client", cascade="all, delete-orphan")

class Release(Base):
    __tablename__ = "releases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    client_id = Column(String(64), ForeignKey("clients.client_id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(String(64), nullable=False)
    release_date = Column(String(64), nullable=False)
    changelog_raw = Column(Text, default="[]", nullable=False)

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
