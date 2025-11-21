"""
Test Finance Endpoints
/api/v1/finance/*
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, datetime, timedelta
from decimal import Decimal

from app.models.user import User
from app.models.finance import Invoice, Payment, InvoiceLine, FeeStructure
from app.models.academic import Semester


@pytest.mark.integration
@pytest.mark.finance
class TestFinanceInvoicesEndpoints:
    """Test finance invoices endpoints."""
    
    async def test_create_invoice_admin(
        self,
        client: AsyncClient,
        test_admin: User,
        test_student: User,
        test_semester: Semester,
        admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test admin creating an invoice"""
        invoice_data = {
            "student_id": test_student.id,
            "semester_id": test_semester.id,
            "invoice_number": "INV202401001",
            "issue_date": date.today().isoformat(),
            "due_date": (date.today() + timedelta(days=30)).isoformat(),
            "status": "pending",
            "notes": "Tuition fee for Spring 2024",
            "lines": [
                {
                    "description": "Tuition Fee",
                    "qty": 1,
                    "unit_price": 5000000,
                    "amount": 5000000
                },
                {
                    "description": "Lab Fee",
                    "qty": 1,
                    "unit_price": 500000,
                    "amount": 500000
                }
            ]
        }
        
        response = await client.post(
            "/api/v1/finance/invoices",
            json=invoice_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["invoice_number"] == "INV202401001"
        assert data["student_id"] == test_student.id
        assert Decimal(str(data["total_amount"])) == Decimal("5500000")
        assert data["status"] == "pending"
    
    async def test_list_invoices_admin(
        self,
        client: AsyncClient,
        test_admin: User,
        test_student: User,
        test_semester: Semester,
        admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test admin listing invoices"""
        # Create test invoice
        invoice = Invoice(
            student_id=test_student.id,
            semester_id=test_semester.id,
            invoice_number="INV202401002",
            issued_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            total_amount=Decimal("3000000"),
            paid_amount=Decimal("0"),
            status="pending"
        )
        db_session.add(invoice)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/finance/invoices",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 1
    
    async def test_get_invoice_detail_admin(
        self,
        client: AsyncClient,
        test_admin: User,
        test_student: User,
        test_semester: Semester,
        admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test admin getting invoice details"""
        # Create test invoice with lines
        invoice = Invoice(
            student_id=test_student.id,
            semester_id=test_semester.id,
            invoice_number="INV202401003",
            issued_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            total_amount=Decimal("2000000"),
            paid_amount=Decimal("0"),
            status="pending"
        )
        db_session.add(invoice)
        await db_session.flush()
        
        # Add invoice line
        line = InvoiceLine(
            invoice_id=invoice.id,
            description="Tuition Fee",
            qty=1,
            unit_price=Decimal("2000000"),
            amount=Decimal("2000000")
        )
        db_session.add(line)
        await db_session.commit()
        
        response = await client.get(
            f"/api/v1/finance/invoices/{invoice.id}",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["invoice_number"] == "INV202401003"
        assert "lines" in data
        assert len(data["lines"]) == 1
    
    async def test_update_invoice_admin(
        self,
        client: AsyncClient,
        test_admin: User,
        test_student: User,
        test_semester: Semester,
        admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test admin updating invoice"""
        # Create test invoice
        invoice = Invoice(
            student_id=test_student.id,
            semester_id=test_semester.id,
            invoice_number="INV202401004",
            issued_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            total_amount=Decimal("1000000"),
            paid_amount=Decimal("0"),
            status="pending"
        )
        db_session.add(invoice)
        await db_session.commit()
        
        update_data = {
            "status": "cancelled",
            "notes": "Cancelled by admin"
        }
        
        response = await client.put(
            f"/api/v1/finance/invoices/{invoice.id}",
            json=update_data,
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "cancelled"
        assert data["notes"] == "Cancelled by admin"
    
    async def test_delete_invoice_admin(
        self,
        client: AsyncClient,
        test_admin: User,
        test_student: User,
        test_semester: Semester,
        admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test admin deleting invoice"""
        # Create test invoice
        invoice = Invoice(
            student_id=test_student.id,
            semester_id=test_semester.id,
            invoice_number="INV202401005",
            issued_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            total_amount=Decimal("500000"),
            paid_amount=Decimal("0"),
            status="pending"
        )
        db_session.add(invoice)
        await db_session.commit()
        
        response = await client.delete(
            f"/api/v1/finance/invoices/{invoice.id}",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200


@pytest.mark.integration
@pytest.mark.finance
class TestFinancePaymentsEndpoints:
    """Test finance payments endpoints."""
    
    async def test_create_payment_admin(
        self,
        client: AsyncClient,
        test_admin: User,
        test_student: User,
        test_semester: Semester,
        admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test admin recording a payment"""
        # Create invoice first
        invoice = Invoice(
            student_id=test_student.id,
            semester_id=test_semester.id,
            invoice_number="INV202401006",
            issued_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            total_amount=Decimal("3000000"),
            paid_amount=Decimal("0"),
            status="pending"
        )
        db_session.add(invoice)
        await db_session.commit()
        
        payment_data = {
            "invoice_id": invoice.id,
            "amount": 3000000,
            "payment_method": "bank_transfer",
            "transaction_id": "TXN123456789",
            "payment_date": date.today().isoformat(),
            "status": "completed",
            "notes": "Full payment received"
        }
        
        response = await client.post(
            "/api/v1/finance/payments",
            json=payment_data,
            headers=admin_token_headers
        )
        
        if response.status_code != 201:
            print(f"Payment creation error: {response.json()}")
        
        assert response.status_code == 201
        data = response.json()
        assert data["invoice_id"] == invoice.id
        assert Decimal(str(data["amount"])) == Decimal("3000000")
        assert data["payment_method"] == "bank_transfer"
        assert data["status"] == "completed"
    
    async def test_list_payments_admin(
        self,
        client: AsyncClient,
        test_admin: User,
        test_student: User,
        test_semester: Semester,
        admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test admin listing payments"""
        # Create invoice and payment
        invoice = Invoice(
            student_id=test_student.id,
            semester_id=test_semester.id,
            invoice_number="INV202401007",
            issued_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            total_amount=Decimal("1000000"),
            paid_amount=Decimal("1000000"),
            status="paid"
        )
        db_session.add(invoice)
        await db_session.flush()
        
        payment = Payment(
            invoice_id=invoice.id,
            amount=Decimal("1000000"),
            payment_method="cash",
            transaction_id="TXN987654321",
            payment_date=datetime.now(),
            status="completed"
        )
        db_session.add(payment)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/finance/payments",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 1


@pytest.mark.integration
@pytest.mark.finance
class TestFinanceSummaryEndpoints:
    """Test finance summary endpoints."""
    
    async def test_get_student_summary_admin(
        self,
        client: AsyncClient,
        test_admin: User,
        test_student: User,
        test_semester: Semester,
        admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test admin getting student financial summary"""
        # Create invoice for student
        invoice = Invoice(
            student_id=test_student.id,
            semester_id=test_semester.id,
            invoice_number="INV202401008",
            issued_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            total_amount=Decimal("5000000"),
            paid_amount=Decimal("2000000"),
            status="partial"
        )
        db_session.add(invoice)
        await db_session.commit()
        
        response = await client.get(
            f"/api/v1/finance/students/{test_student.id}/summary",
            headers=admin_token_headers
        )
        
        if response.status_code != 200:
            print(f"Student summary error: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert "student_id" in data
        assert "total_invoiced" in data
        assert "total_paid" in data
        assert "outstanding_balance" in data
    
    async def test_get_my_summary_student(
        self,
        client: AsyncClient,
        test_student: User,
        test_semester: Semester,
        student_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test student getting their own financial summary"""
        # Create invoice for student
        invoice = Invoice(
            student_id=test_student.id,
            semester_id=test_semester.id,
            invoice_number="INV202401009",
            issued_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            total_amount=Decimal("4000000"),
            paid_amount=Decimal("1000000"),
            status="partial"
        )
        db_session.add(invoice)
        await db_session.commit()
        
        response = await client.get(
            "/api/v1/finance/students/my/summary",
            headers=student_token_headers
        )
        
        if response.status_code != 200:
            print(f"My summary error: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert "student_id" in data
        assert data["student_id"] == test_student.id
    
    async def test_get_semester_summary_admin(
        self,
        client: AsyncClient,
        test_admin: User,
        test_student: User,
        test_semester: Semester,
        admin_token_headers: dict,
        db_session: AsyncSession
    ):
        """Test admin getting semester financial summary"""
        # Create invoices for semester
        invoice = Invoice(
            student_id=test_student.id,
            semester_id=test_semester.id,
            invoice_number="INV202401010",
            issued_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            total_amount=Decimal("6000000"),
            paid_amount=Decimal("3000000"),
            status="partial"
        )
        db_session.add(invoice)
        await db_session.commit()
        
        response = await client.get(
            f"/api/v1/finance/semesters/{test_semester.id}/summary",
            headers=admin_token_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "semester_id" in data
        assert "total_invoiced" in data
        assert "total_collected" in data
        assert "outstanding_balance" in data
