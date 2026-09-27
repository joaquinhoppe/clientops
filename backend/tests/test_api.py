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

