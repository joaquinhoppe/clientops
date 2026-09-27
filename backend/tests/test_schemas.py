import pytest
from pydantic import ValidationError
from app.schemas import ClientSchema, ReleaseSchema, ClientStatus, ClientBilling, ClientSoftware

def test_client_schema_valid():
    raw_data = {
        "client_id": "c1f7b0f2-4e20-4a81-8b38-89c564c72d01",
        "name": "Commercial Name",
        "project_url": "https://client-site.com",
        "status": {
            "is_online": True,
            "last_checked": "2026-09-26T10:00:00Z"
        },
        "billing": {
            "total_due": 150.00,
            "currency": "USD",
            "status": "overdue"
        },
        "software": {
            "current_version": "v2.4.1",
            "last_update": "2026-09-20"
        }
    }
    client = ClientSchema.model_validate(raw_data)
    assert client.client_id == "c1f7b0f2-4e20-4a81-8b38-89c564c72d01"
    assert client.name == "Commercial Name"
    assert client.status.is_online is True
    assert client.billing.total_due == 150.00
    assert client.billing.status == "overdue"
    assert client.software.current_version == "v2.4.1"

def test_client_schema_missing_required():
    with pytest.raises(ValidationError):
        ClientSchema.model_validate({"name": "Incomplete Client"})

def test_release_schema_valid():
    raw_release = {
        "version": "v2.4.1",
        "release_date": "2026-09-20",
        "changelog": [
            "Fixed checkout cart calculation bug",
            "Added Stripe webhook verification"
        ]
    }
    rel = ReleaseSchema.model_validate(raw_release)
    assert rel.version == "v2.4.1"
    assert len(rel.changelog) == 2
