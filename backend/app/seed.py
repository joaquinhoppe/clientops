import json
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Client, Release

SAMPLE_CLIENTS = [
    {
        "client_id": "c1f7b0f2-4e20-4a81-8b38-89c564c72d01",
        "name": "Acme Commerce",
        "project_url": "https://acme-shop.example.com",
        "is_online": True,
        "total_due": 250.00,
        "currency": "USD",
        "billing_status": "overdue",
        "current_version": "v2.4.1",
        "last_update": "2026-09-20",
        "releases": [
            {
                "version": "v2.4.1",
                "release_date": "2026-09-20",
                "changelog": [
                    "Patched Stripe webhook signature verification",
                    "Fixed shopping cart quantity recalculation glitch",
                    "Optimized database indexing on product catalog"
                ]
            },
            {
                "version": "v2.4.0",
                "release_date": "2026-09-01",
                "changelog": [
                    "Integrated multi-currency support",
                    "Redesigned checkout summary page"
                ]
            }
        ]
    },
    {
        "client_id": "d2e8c1a3-5f31-4b92-9c49-90d675d83e02",
        "name": "FinTech Hub",
        "project_url": "https://fintech-core.example.com",
        "is_online": True,
        "total_due": 0.00,
        "currency": "USD",
        "billing_status": "paid",
        "current_version": "v3.1.0",
        "last_update": "2026-09-25",
        "releases": [
            {
                "version": "v3.1.0",
                "release_date": "2026-09-25",
                "changelog": [
                    "Added real-time foreign exchange rate streaming",
                    "Security audit remediation for session tokens"
                ]
            }
        ]
    },
    {
        "client_id": "e3f9d2b4-6042-4ca3-ad5a-01e786e94f03",
        "name": "RetailCloud Systems",
        "project_url": "https://retail-pos.example.com",
        "is_online": False,
        "total_due": 1200.00,
        "currency": "USD",
        "billing_status": "overdue",
        "current_version": "v1.9.4",
        "last_update": "2026-08-15",
        "releases": [
            {
                "version": "v1.9.4",
                "release_date": "2026-08-15",
                "changelog": [
                    "Offline barcode scanning cache update",
                    "Fixed receipt printer serial driver compatibility"
                ]
            }
        ]
    },
    {
        "client_id": "f4a0e3c5-7153-4db4-be6b-12f897f05a04",
        "name": "HealthPulse Telehealth",
        "project_url": "https://healthpulse.example.com",
        "is_online": True,
        "total_due": 0.00,
        "currency": "USD",
        "billing_status": "paid",
        "current_version": "v2.0.2",
        "last_update": "2026-09-22",
        "releases": [
            {
                "version": "v2.0.2",
                "release_date": "2026-09-22",
                "changelog": [
                    "HIPAA compliance audit logs exporter",
                    "WebRTC latency optimization for video consultations"
                ]
            }
        ]
    },
    {
        "client_id": "a5b1f4d6-8264-4ec5-cf7c-23a908a16b05",
        "name": "Nova Logistics",
        "project_url": "https://novalogistics.example.com",
        "is_online": True,
        "total_due": 450.00,
        "currency": "USD",
        "billing_status": "pending",
        "current_version": "v1.5.0",
        "last_update": "2026-09-18",
        "releases": [
            {
                "version": "v1.5.0",
                "release_date": "2026-09-18",
                "changelog": [
                    "GPS vehicle fleet tracker integration",
                    "Automated route dispatch algorithm update"
                ]
            }
        ]
    }
]

async def seed_database(db: AsyncSession):
    # Check if clients already exist
    existing = await db.execute(select(Client))
    if existing.scalars().first():
        return

    for item in SAMPLE_CLIENTS:
        client = Client(
            client_id=item["client_id"],
            name=item["name"],
            project_url=item["project_url"],
            is_online=item["is_online"],
            last_checked=datetime.now(timezone.utc),
            total_due=item["total_due"],
            currency=item["currency"],
            billing_status=item["billing_status"],
            current_version=item["current_version"],
            last_update=item["last_update"]
        )
        db.add(client)
        await db.flush()

        for rel in item.get("releases", []):
            release = Release(
                client_id=client.client_id,
                version=rel["version"],
                release_date=rel["release_date"],
                changelog_raw=json.dumps(rel["changelog"])
            )
            db.add(release)

    await db.commit()
