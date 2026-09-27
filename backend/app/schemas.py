from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class ClientStatus(BaseModel):
    is_online: bool
    last_checked: datetime | str

class ClientBilling(BaseModel):
    total_due: float
    currency: str = "USD"
    status: str  # "paid", "overdue", "pending"
    payment_due_day: int = 1
    recurring_amount: float = 0.0

class ClientSoftware(BaseModel):
    current_version: str
    last_update: str

class ClientSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    client_id: str
    name: str
    project_url: str
    status: ClientStatus
    billing: ClientBilling
    software: ClientSoftware

class ClientCreateSchema(BaseModel):
    name: str
    project_url: str
    is_online: bool = True
    total_due: float = 0.0
    currency: str = "USD"
    billing_status: str = "paid"
    payment_due_day: int = 1
    recurring_amount: float = 0.0
    current_version: str = "v1.0.0"
    last_update: str | None = None

class ClientUpdateSchema(BaseModel):
    name: str | None = None
    project_url: str | None = None
    is_online: bool | None = None
    total_due: float | None = None
    currency: str | None = None
    billing_status: str | None = None
    payment_due_day: int | None = None
    recurring_amount: float | None = None
    current_version: str | None = None
    last_update: str | None = None

class ReleaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None = None
    version: str
    release_date: str
    changelog: list[str] = Field(default_factory=list)
    cost: float = 0.0

class ReleaseCreateSchema(BaseModel):
    version: str
    release_date: str | None = None
    changelog: list[str] = Field(default_factory=list)
    cost: float = 0.0

class ClientNoteSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: str
    title: str = ""
    content: str
    created_at: datetime | str

class ClientNoteCreateSchema(BaseModel):
    title: str = ""
    content: str

class PaymentSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: str
    amount: float
    currency: str = "USD"
    due_date: str
    status: str
    paid_at: str | None = None
    notes: str = ""

class PaymentCreateSchema(BaseModel):
    amount: float
    currency: str = "USD"
    due_date: str
    status: str = "unpaid"
    paid_at: str | None = None
    notes: str = ""

class PaymentUpdateSchema(BaseModel):
    amount: float | None = None
    status: str | None = None
    paid_at: str | None = None
    notes: str | None = None

class ToggleStatusResponse(BaseModel):
    client_id: str
    is_online: bool
    message: str
