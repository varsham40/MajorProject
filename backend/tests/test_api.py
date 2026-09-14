import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.db.seed import seed_database
from backend.app.services.canonical_service import calculate_record_sha256
from backend.app.services.token_service import generate_random_token_code

@pytest_asyncio.fixture(autouse=True)
async def prepare_db():
    from backend.app.core.database import engine
    await seed_database()
    await engine.dispose()

@pytest.mark.asyncio
async def test_root_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert "Predict -> Explain" in response.json()["flow"]

@pytest.mark.asyncio
async def test_canonical_hashing():
    record_dict_1 = {"b": 2, "a": 1, "c": [1, 2, 3]}
    record_dict_2 = {"a": 1, "c": [1, 2, 3], "b": 2}
    hash1 = calculate_record_sha256(record_dict_1)
    hash2 = calculate_record_sha256(record_dict_2)
    assert hash1 == hash2
    assert len(hash1) == 64

@pytest.mark.asyncio
async def test_token_code_generator():
    code = generate_random_token_code()
    assert code.startswith("PAT-")
    assert len(code) == 13

@pytest.mark.asyncio
async def test_admin_login():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/login", json={
            "email": "admin@healthsecure.com",
            "password": "Admin@123"
        })
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "ADMIN"
    assert "access_token" in data
