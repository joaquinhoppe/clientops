from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class ClientStatus(BaseModel):
    is_online: bool
    last_checked: datetime | str

class ClientBilling(BaseModel):
    total_due: float
    currency: str = "USD"
    status: str  # "paid", "overdue", "pending"

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

class ReleaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    version: str
    release_date: str
    changelog: list[str] = Field(default_factory=list)

class ToggleStatusResponse(BaseModel):
    client_id: str
    is_online: bool
    message: str
