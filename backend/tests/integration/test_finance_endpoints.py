"""Integration tests for finance endpoints."""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime


@pytest.mark.integration
@pytest.mark.finance
class TestFinanceEndpoints:
    """Test finance API endpoints."""
    
    def test_create_invoice(
        self,
        client: TestClient,
        test_student,
        test_semester,
        admin_token,
        mock_firebase_auth
    ):
        """Test creating an invoice."""
        response = client.post(
            "/api/v1/finance/invoices",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "student_id": str(test_student.id),
                "semester_id": test_semester.id,
                "invoice_number": "INV202401999",
                "issue_date": "2024-01-01",
                "due_date": "2024-01-31",
                "lines": [
                    {
                        "description": "Tuition Fee",
                        "quantity": 1,
                        "unit_price": 5000.00,
                        "amount": 5000.00
                    }
                ]
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["invoice_number"] == "INV202401999"
        assert data["total_amount"] == 5000.00
        assert data["status"] == "pending"
    
    def test_get_invoices(
        self,
        client: TestClient,
        test_invoice,
        admin_token,
        mock_firebase_auth
    ):
        """Test listing invoices."""
        response = client.get(
            "/api/v1/finance/invoices",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) >= 1
    
    def test_create_payment_success(
        self,
        client: TestClient,
        test_invoice,
        admin_token,
        mock_firebase_auth
    ):
        """Test creating a payment."""
        response = client.post(
            "/api/v1/finance/payments",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "X-Idempotency-Key": "test-payment-001"
            },
            json={
                "invoice_id": test_invoice.id,
                "amount": 2000.00,
                "payment_method": "bank_transfer",
                "transaction_reference": "TXN123456"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["amount"] == 2000.00
        assert data["invoice_id"] == test_invoice.id
    
    def test_create_payment_idempotency(
        self,
        client: TestClient,
        test_invoice,
        admin_token,
        mock_firebase_auth
    ):
        """Test payment idempotency - same key returns same payment."""
        idempotency_key = "test-payment-002"
        
        # First payment
        response1 = client.post(
            "/api/v1/finance/payments",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "X-Idempotency-Key": idempotency_key
            },
            json={
                "invoice_id": test_invoice.id,
                "amount": 1000.00,
                "payment_method": "cash",
                "transaction_reference": "TXN001"
            }
        )
        
        assert response1.status_code == 201
        payment1_id = response1.json()["id"]
        
        # Second payment with same key
        response2 = client.post(
            "/api/v1/finance/payments",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "X-Idempotency-Key": idempotency_key
            },
            json={
                "invoice_id": test_invoice.id,
                "amount": 2000.00,  # Different amount
                "payment_method": "bank_transfer",
                "transaction_reference": "TXN002"
            }
        )
        
        assert response2.status_code == 200
        payment2_id = response2.json()["id"]
        
        # Should return the same payment
        assert payment1_id == payment2_id
        assert response2.json()["amount"] == 1000.00  # Original amount
    
    def test_create_payment_exceeds_balance(
        self,
        client: TestClient,
        test_invoice,
        admin_token,
        mock_firebase_auth
    ):
        """Test payment that exceeds remaining balance."""
        response = client.post(
            "/api/v1/finance/payments",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "X-Idempotency-Key": "test-payment-003"
            },
            json={
                "invoice_id": test_invoice.id,
                "amount": 10000.00,  # More than invoice total
                "payment_method": "bank_transfer"
            }
        )
        
        assert response.status_code == 400
        assert "exceeds" in response.json()["detail"].lower()
    
    def test_get_student_financial_summary(
        self,
        client: TestClient,
        test_student,
        test_invoice,
        admin_token,
        mock_firebase_auth
    ):
        """Test getting student financial summary."""
        response = client.get(
            f"/api/v1/finance/students/{test_student.id}/summary",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total_invoiced" in data
        assert "total_paid" in data
        assert "outstanding_balance" in data
        assert data["student_id"] == str(test_student.id)
    
    def test_get_my_financial_summary(
        self,
        client: TestClient,
        test_student,
        test_invoice,
        student_token,
        mock_firebase_auth
    ):
        """Test student getting own financial summary."""
        response = client.get(
            "/api/v1/finance/students/my/summary",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total_invoiced" in data
        assert data["total_invoiced"] == 5500.00


@pytest.mark.integration
@pytest.mark.finance
class TestPaymentWorkflow:
    """Test complete payment workflow scenarios."""
    
    async def test_partial_payment_workflow(
        self,
        client: TestClient,
        test_invoice,
        admin_token,
        mock_firebase_auth,
        db_session
    ):
        """Test partial payment workflow with status updates."""
        # Initial status should be pending
        assert test_invoice.status == "pending"
        
        # Make partial payment
        response = client.post(
            "/api/v1/finance/payments",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "X-Idempotency-Key": "partial-payment-001"
            },
            json={
                "invoice_id": test_invoice.id,
                "amount": 2000.00,
                "payment_method": "bank_transfer"
            }
        )
        
        assert response.status_code == 201
        
        # Check invoice status updated to partial
        await db_session.refresh(test_invoice)
        assert test_invoice.status == "partial"
        assert test_invoice.amount_paid == 2000.00
        
        # Make second payment to complete
        response2 = client.post(
            "/api/v1/finance/payments",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "X-Idempotency-Key": "partial-payment-002"
            },
            json={
                "invoice_id": test_invoice.id,
                "amount": 3500.00,
                "payment_method": "bank_transfer"
            }
        )
        
        assert response2.status_code == 201
        
        # Check invoice status updated to paid
        await db_session.refresh(test_invoice)
        assert test_invoice.status == "paid"
        assert test_invoice.amount_paid == 5500.00
