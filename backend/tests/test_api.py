import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import settings

@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "1.0.0"}

@pytest.mark.asyncio
async def test_get_clients_unauthorized():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/clients")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_clients_authorized():
    transport = ASGITransport(app=app)
    headers = {"X-API-Key": settings.API_KEY}
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/clients", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    first = data[0]
    assert "client_id" in first
    assert "status" in first
    assert "billing" in first
    assert "software" in first

@pytest.mark.asyncio
async def test_toggle_client_status():
    transport = ASGITransport(app=app)
    headers = {"X-API-Key": settings.API_KEY}
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Get clients first
        res = await ac.get("/api/v1/clients", headers=headers)
        clients = res.json()
        target = clients[0]
        cid = target["client_id"]
        original_status = target["status"]["is_online"]

        # Toggle status
        toggle_res = await ac.post(f"/api/v1/clients/{cid}/toggle-status", headers=headers)
        assert toggle_res.status_code == 200
        new_status = toggle_res.json()["is_online"]
        assert new_status != original_status

@pytest.mark.asyncio
async def test_get_client_releases():
    transport = ASGITransport(app=app)
    headers = {"X-API-Key": settings.API_KEY}
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/clients", headers=headers)
        clients = res.json()
        cid = clients[0]["client_id"]

        rel_res = await ac.get(f"/api/v1/clients/{cid}/releases", headers=headers)
        assert rel_res.status_code == 200
        releases = rel_res.json()
        assert isinstance(releases, list)
        if len(releases) > 0:
            first_rel = releases[0]
            assert "version" in first_rel
            assert "release_date" in first_rel
            assert "changelog" in first_rel

@pytest.mark.asyncio
async def test_create_update_delete_client():
    transport = ASGITransport(app=app)
    headers = {"X-API-Key": settings.API_KEY}
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Create client
        new_client_payload = {
            "name": "Quantum AI Systems",
            "project_url": "https://quantum-ai.example.com",
            "is_online": True,
            "total_due": 350.0,
            "currency": "EUR",
            "billing_status": "pending",
            "current_version": "v1.0.0",
            "last_update": "2026-09-26"
        }
        create_res = await ac.post("/api/v1/clients", headers=headers, json=new_client_payload)
        assert create_res.status_code == 201
        created = create_res.json()
        cid = created["client_id"]
        assert created["name"] == "Quantum AI Systems"
        assert created["billing"]["currency"] == "EUR"

        # 2. Update client
        update_payload = {
            "total_due": 0.0,
            "billing_status": "paid",
            "current_version": "v1.1.0"
        }
        update_res = await ac.put(f"/api/v1/clients/{cid}", headers=headers, json=update_payload)
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["billing"]["total_due"] == 0.0
        assert updated["billing"]["status"] == "paid"
        assert updated["software"]["current_version"] == "v1.1.0"

        # 3. Add release to this client and verify version sync
        release_payload = {
            "version": "v2.0.0",
            "release_date": "2026-10-01",
            "changelog": ["Complete AI engine overhaul", "Reduced latency by 40%"]
        }
        rel_res = await ac.post(f"/api/v1/clients/{cid}/releases", headers=headers, json=release_payload)
        assert rel_res.status_code == 201
        rel_data = rel_res.json()
        assert rel_data["version"] == "v2.0.0"
        rel_id = rel_data["id"]

        # Check client reflects new version
        client_res = await ac.get(f"/api/v1/clients/{cid}", headers=headers)
        assert client_res.json()["software"]["current_version"] == "v2.0.0"

        # Delete release
        del_rel_res = await ac.delete(f"/api/v1/clients/{cid}/releases/{rel_id}", headers=headers)
        assert del_rel_res.status_code == 204

        # 4. Delete client
        delete_res = await ac.delete(f"/api/v1/clients/{cid}", headers=headers)
        assert delete_res.status_code == 204

        # Verify not found
        get_res = await ac.get(f"/api/v1/clients/{cid}", headers=headers)
        assert get_res.status_code == 404


