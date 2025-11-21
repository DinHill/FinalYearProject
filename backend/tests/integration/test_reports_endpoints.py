import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.integration
@pytest.mark.reports
class TestReportsEndpoints:
    
    async def test_get_available_reports_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/v1/reports/available")
        assert response.status_code == 401
    
    async def test_get_available_reports(self, client: AsyncClient, admin_token_headers: dict):
        response = await client.get("/api/v1/reports/available", headers=admin_token_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        assert any(key in data for key in ["transcript", "grade_card"])
    
    async def test_generate_transcript_unauthorized(self, client: AsyncClient):
        response = await client.post("/api/v1/reports/transcript", json={"student_id": 1})
        assert response.status_code == 401
    
    async def test_generate_transcript_not_found(self, client: AsyncClient, admin_token_headers: dict):
        response = await client.post("/api/v1/reports/transcript", headers=admin_token_headers, json={"student_id": 999999})
        assert response.status_code == 404
    
    async def test_generate_transcript(self, client: AsyncClient, admin_token_headers: dict, db_session: AsyncSession, test_student):
        response = await client.post("/api/v1/reports/transcript", headers=admin_token_headers, json={"student_id": test_student.id, "include_in_progress": False})
        assert response.status_code == 200
        assert len(response.content) > 0
    
    async def test_generate_grade_card_unauthorized(self, client: AsyncClient):
        response = await client.post("/api/v1/reports/grade-card", json={"student_id": 1})
        assert response.status_code == 401
    
    async def test_generate_grade_card_not_found(self, client: AsyncClient, admin_token_headers: dict):
        response = await client.post("/api/v1/reports/grade-card", headers=admin_token_headers, json={"student_id": 999999})
        assert response.status_code == 404
    
    async def test_generate_grade_card(self, client: AsyncClient, admin_token_headers: dict, db_session: AsyncSession, test_student):
        response = await client.post("/api/v1/reports/grade-card", headers=admin_token_headers, json={"student_id": test_student.id, "semester_id": None})
        assert response.status_code == 200
        assert len(response.content) > 0
