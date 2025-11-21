"""Test Files Management Endpoints"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import User, Document


@pytest.mark.asyncio
class TestFilesEndpoints:
    
    async def test_upload_unauthorized(
        self, client: AsyncClient
    ):
        response = await client.post("/api/v1/files/upload", params={'category': 'academic'})
        assert response.status_code == 401
    
    async def test_get_library(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession, test_admin: User
    ):
        doc = Document(
            title="Test Document",
            document_type="academic",
            file_url="/uploads/test.pdf",
            file_size=1024,
            mime_type="application/pdf",
            uploaded_by=test_admin.id,
            user_id=test_admin.id,
            status="active"
        )
        db_session.add(doc)
        await db_session.commit()
        
        response = await client.get("/api/v1/files/library", params={'page': 1, 'page_size': 10}, headers=admin_token_headers)
        assert response.status_code == 200
        data = response.json()
        assert 'files' in data
    
    async def test_download_not_found(
        self, client: AsyncClient, admin_token_headers: dict
    ):
        response = await client.get("/api/v1/files/999999/download", headers=admin_token_headers)
        assert response.status_code in [403, 404]  # 403 if auth blocks, 404 if not found
    
    async def test_get_versions(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession, test_admin: User
    ):
        parent_doc = Document(
            title="Original", document_type="academic", file_url="/uploads/doc_v1.pdf",
            filename="doc_v1.pdf", file_size=1024, mime_type="application/pdf",
            uploaded_by=test_admin.id, user_id=test_admin.id, status="active", version=1
        )
        db_session.add(parent_doc)
        await db_session.commit()
        await db_session.refresh(parent_doc)
        
        version2 = Document(
            title="Original v2", document_type="academic", file_url="/uploads/doc_v2.pdf",
            filename="doc_v2.pdf", file_size=2048, mime_type="application/pdf",
            uploaded_by=test_admin.id, user_id=test_admin.id, status="active", version=2,
            parent_file_id=parent_doc.id
        )
        db_session.add(version2)
        await db_session.commit()
        
        response = await client.get(f"/api/v1/files/{parent_doc.id}/versions", headers=admin_token_headers)
        assert response.status_code == 200
        versions = response.json()
        assert isinstance(versions, list)
        assert len(versions) == 2
    
    async def test_get_info(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession, test_admin: User
    ):
        document = Document(
            title="Test Info", document_type="administrative", file_url="/uploads/test_info.pdf",
            filename="test_info.pdf", file_size=5120, mime_type="application/pdf",
            uploaded_by=test_admin.id, user_id=test_admin.id, status="active", version=1, download_count=10
        )
        db_session.add(document)
        await db_session.commit()
        await db_session.refresh(document)
        
        response = await client.get(f"/api/v1/files/{document.id}/info", headers=admin_token_headers)
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == document.id
    
    async def test_delete_not_found(
        self, client: AsyncClient, admin_token_headers: dict
    ):
        response = await client.delete("/api/v1/files/999999", headers=admin_token_headers)
        assert response.status_code in [403, 404]  # 403 if auth blocks, 404 if not found
    
    async def test_get_categories(
        self, client: AsyncClient, admin_token_headers: dict,
        db_session: AsyncSession, test_admin: User
    ):
        for category in ['academic', 'administrative']:
            doc = Document(
                title=f"{category} Doc", document_type=category, category=category,
                file_url=f"/uploads/{category}.pdf", filename=f"{category}.pdf",
                file_size=1024, mime_type="application/pdf",
                uploaded_by=test_admin.id, user_id=test_admin.id, status="active"
            )
            db_session.add(doc)
        await db_session.commit()
        
        response = await client.get("/api/v1/files/categories", headers=admin_token_headers)
        assert response.status_code == 200
        data = response.json()
        assert 'categories' in data

