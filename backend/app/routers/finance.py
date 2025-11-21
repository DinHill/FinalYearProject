"""
Finance Router - Invoice and Payment Management

Handles financial operations including:
- Invoice generation and management
- Payment processing with idempotency
- Financial summaries for students and semesters
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_

from app.core.database import get_db
from app.core.rbac import require_roles, require_student, get_user_campus_access, check_campus_access
from app.core.idempotency import IdempotencyManager
from fastapi.responses import JSONResponse
from app.core.exceptions import NotFoundError, BusinessLogicError
from app.models.user import User, Campus
from app.models.finance import Invoice, InvoiceLine, Payment, FeeStructure
from app.models.academic import Enrollment, Semester
from app.schemas.base import PaginatedResponse, SuccessResponse
from app.schemas.finance import (
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceResponse,
    InvoiceDetailResponse,
    PaymentCreate,
    PaymentResponse,
    StudentFinancialSummary,
    SemesterFinancialSummary,
)

router = APIRouter(prefix="/finance", tags=["Finance"])


@router.post("/invoices", response_model=InvoiceResponse, status_code=201)
async def create_invoice(
    invoice_data: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "finance_admin"))
):
    """
    Create a new invoice for a student.
    
    Access: admin, finance_admin
    
    Process:
    1. Verify student exists
    2. Verify semester exists
    3. Create invoice with line items
    4. Calculate total amount
    """
    # Verify student exists
    student_query = await db.execute(
        select(User).where(
            and_(
                User.id == invoice_data.student_id,
                User.role == "student",
                User.status == "active"
            )
        )
    )
    student = student_query.scalar_one_or_none()
    if not student:
        raise NotFoundError("Student", invoice_data.student_id)
    
    # Verify semester exists - look up by code
    semester_query = await db.execute(
        select(Semester).where(Semester.code == invoice_data.semester_code.upper())
    )
    semester = semester_query.scalar_one_or_none()
    if not semester:
        raise NotFoundError("Semester", invoice_data.semester_code)
    
    # Calculate total amount from line items
    total_amount = sum(line.amount for line in invoice_data.lines)
    
    # Create invoice
    invoice = Invoice(
        student_id=invoice_data.student_id,
        semester_id=semester.id,
        invoice_number=invoice_data.invoice_number,
        issued_date=invoice_data.issue_date,  # Changed from issue_date to issued_date
        due_date=invoice_data.due_date,
        total_amount=total_amount,
        status=invoice_data.status or "pending",
        notes=invoice_data.notes,
    )
    db.add(invoice)
    await db.flush()  # Get invoice ID
    
    # Create invoice lines
    for line_data in invoice_data.lines:
        line = InvoiceLine(
            invoice_id=invoice.id,
            description=line_data.description,
            amount=line_data.amount,
            qty=line_data.quantity,
            unit_price=line_data.unit_price,
        )
        db.add(line)
    
    await db.commit()
    await db.refresh(invoice)
    
    return invoice


@router.get("/invoices", response_model=PaginatedResponse[InvoiceResponse])
async def list_invoices(
    student_id: Optional[UUID] = Query(None, description="Filter by student ID"),
    semester_code: Optional[str] = Query(None, description="Filter by semester code (e.g., F2024, S2025)"),
    status: Optional[str] = Query(None, description="Filter by status"),
    campus_code: Optional[str] = Query(None, description="Filter by campus code (H, D, C, S)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "finance_admin", "student"))
):
    """
    List invoices with filters (campus-filtered).
    
    Access:
    - Admins can see invoices within their campus scope
    - Students can only see their own invoices
    """
    # Build query - need to join with User to filter by campus
    query = select(Invoice).join(User, Invoice.student_id == User.id)
    
    # Students can only see their own invoices
    if "student" in current_user.get("roles", []):
        query = query.where(Invoice.student_id == current_user["db_user_id"])
    else:
        # Admin - apply campus filtering
        user_campus_access = await get_user_campus_access({"uid": current_user["uid"], "roles": current_user.get("roles", [])}, db)
        
        if campus_code:
            # Specific campus requested - look up campus by code
            campus_result = await db.execute(select(Campus).where(Campus.code == campus_code.upper()))
            campus = campus_query.scalar_one_or_none()
            if not campus:
                raise NotFoundError("Campus", campus_code)
            
            # Verify access
            if user_campus_access is not None:
                await check_campus_access({"uid": current_user["uid"], "roles": current_user.get("roles", [])}, campus.id, db, raise_error=True)
            query = query.where(User.campus_id == campus.id)
        else:
            # No specific campus - filter by user's campus access
            if user_campus_access is not None:  # Campus-scoped admin
                if user_campus_access:
                    query = query.where(User.campus_id.in_(user_campus_access))
                else:
                    # No campus assignments - return empty
                    return PaginatedResponse(
                        items=[],
                        total=0,
                        page=page,
                        per_page=page_size,  # Fixed: use per_page instead of page_size
                        pages=0
                    )
        
        if student_id:
            query = query.where(Invoice.student_id == student_id)
    
    if semester_code:
        # Look up semester by code
        semester_result = await db.execute(select(Semester).where(Semester.code == semester_code.upper()))
        semester = semester_query.scalar_one_or_none()
        if not semester:
            raise NotFoundError("Semester", semester_code)
        query = query.where(Invoice.semester_id == semester.id)
    
    if status:
        query = query.where(Invoice.status == status)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(Invoice.issued_date.desc())  # Changed from issue_date to issued_date
    
    result = await db.execute(query)
    invoices = result.scalars().all()
    
    return PaginatedResponse(
        items=invoices,
        total=total,
        page=page,
        per_page=page_size,  # Fixed: use per_page instead of page_size
        pages=(total + page_size - 1) // page_size
    )


@router.get("/invoices/{invoice_id}", response_model=InvoiceDetailResponse)
async def get_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "finance_admin", "student"))
):
    """
    Get invoice details including line items.
    
    Access:
    - Admins can see any invoice
    - Students can only see their own invoices
    """
    query = select(Invoice).where(Invoice.id == invoice_id)
    
    # Students can only see their own invoices
    if "student" in current_user.get("roles", []):
        query = query.where(Invoice.student_id == UUID(current_user["db_user_id"]))
    
    result = await db.execute(query)
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise NotFoundError("Invoice", invoice_id)
    
    # Get line items
    lines_query = await db.execute(
        select(InvoiceLine).where(InvoiceLine.invoice_id == invoice_id)
    )
    lines = lines_query.scalars().all()
    
    # Get payments
    payments_query = await db.execute(
        select(Payment).where(Payment.invoice_id == invoice_id)
    )
    payments = payments_query.scalars().all()
    
    # Build response with balance computed
    invoice_dict = invoice.__dict__.copy()
    invoice_dict['balance'] = invoice.balance  # Add computed property
    
    return InvoiceDetailResponse(
        **invoice_dict,
        lines=lines,
        payments=payments
    )


@router.put("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: int,
    invoice_data: InvoiceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "finance_admin"))
):
    """
    Update an invoice.
    
    Access: admin, finance_admin
    
    Can update:
    - Due date
    - Status
    - Notes
    """
    # Get invoice
    query = select(Invoice).where(Invoice.id == invoice_id)
    result = await db.execute(query)
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise NotFoundError("Invoice", invoice_id)
    
    # Update fields
    if invoice_data.due_date is not None:
        invoice.due_date = invoice_data.due_date
    
    if invoice_data.status is not None:
        invoice.status = invoice_data.status
    
    if invoice_data.notes is not None:
        invoice.notes = invoice_data.notes
    
    await db.commit()
    await db.refresh(invoice)
    
    return invoice


@router.delete("/invoices/{invoice_id}", response_model=SuccessResponse)
async def delete_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "finance_admin"))
):
    """
    Delete an invoice (soft delete by setting status to cancelled).
    
    Access: admin, finance_admin
    
    Note: Cannot delete invoices with payments. Use cancel status instead.
    """
    # Get invoice
    query = select(Invoice).where(Invoice.id == invoice_id)
    result = await db.execute(query)
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise NotFoundError("Invoice", invoice_id)
    
    # Check if invoice has payments
    if invoice.paid_amount > 0:
        raise BusinessLogicError("Cannot delete invoice with payments. Use cancel status instead.")
    
    # Soft delete by setting status to cancelled
    invoice.status = "cancelled"
    
    await db.commit()
    
    return SuccessResponse(message=f"Invoice {invoice.invoice_number} cancelled successfully")


@router.post("/payments", response_model=PaymentResponse, status_code=201)
async def create_payment(
    payment_data: PaymentCreate,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "finance_admin", "student"))
):
    """
    Record a payment for an invoice.
    
    Access:
    - Admins can record any payment
    - Students can only pay their own invoices
    
    Features:
    - Idempotency key support (prevents duplicate payments)
    - Automatic invoice status update
    - Payment validation
    """
    # Check for cached result via IdempotencyManager
    if idempotency_key:
        cached = await IdempotencyManager.get_cached_response(idempotency_key, db)
        if cached:
            response_data, status_code = cached
            return JSONResponse(content=response_data, status_code=status_code)
    
    # Verify invoice exists
    invoice_query = await db.execute(
        select(Invoice).where(Invoice.id == payment_data.invoice_id)
    )
    invoice = invoice_query.scalar_one_or_none()
    if not invoice:
        raise NotFoundError("Invoice", payment_data.invoice_id)
    
    # Students can only pay their own invoices
    if "student" in current_user.get("roles", []) and invoice.student_id != current_user["db_user_id"]:
        raise HTTPException(status_code=403, detail="You can only pay your own invoices")
    
    # Validate payment amount
    if payment_data.amount <= 0:
        raise BusinessLogicError("Payment amount must be positive")
    
    # Check if payment exceeds remaining balance
    remaining_balance = invoice.balance
    if payment_data.amount > remaining_balance:
        raise BusinessLogicError(
            f"Payment amount (${payment_data.amount}) exceeds remaining balance (${remaining_balance})"
        )
    
    # Create payment
    payment = Payment(
        invoice_id=payment_data.invoice_id,
        amount=payment_data.amount,
        payment_date=payment_data.payment_date or datetime.utcnow(),  # Changed from paid_at to payment_date
        payment_method=payment_data.payment_method,
        transaction_id=payment_data.transaction_id,
        status=payment_data.status or "completed",
        notes=payment_data.notes,
    )
    db.add(payment)
    
    # Update invoice paid_amount and status
    invoice.paid_amount = (invoice.paid_amount or Decimal('0')) + payment_data.amount
    new_balance = invoice.balance  # Recalculate balance after updating paid_amount
    
    if new_balance == 0:
        invoice.status = "paid"
    elif invoice.paid_amount > 0:
        invoice.status = "partial"
    
    await db.commit()
    await db.refresh(payment)

    # Prepare response payload to store with idempotency key
    response_payload = {
        "id": payment.id,
        "invoice_id": payment.invoice_id,
        "amount": float(payment.amount),
        "payment_method": str(payment.payment_method),
        "paid_at": payment.payment_date.isoformat() if payment.payment_date else None,  # Changed from paid_at to payment_date
        "status": str(payment.status) if hasattr(payment, 'status') else "completed",
    }

    # Store idempotency result so repeated requests return same response
    if idempotency_key:
        try:
            await IdempotencyManager.store_key(
                idempotency_key,
                endpoint="/finance/payments",
                request_data=payment_data.dict(),
                response_data=response_payload,
                status_code=201,
                db=db,
            )
        except Exception:
            # Do not block response on idempotency store failure
            pass

    return JSONResponse(content=response_payload, status_code=201)


@router.get("/payments", response_model=PaginatedResponse[PaymentResponse])
async def list_payments(
    invoice_id: Optional[int] = Query(None, description="Filter by invoice ID"),
    student_id: Optional[UUID] = Query(None, description="Filter by student ID"),
    payment_method: Optional[str] = Query(None, description="Filter by payment method"),
    campus_code: Optional[str] = Query(None, description="Filter by campus code (H, D, C, S)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "finance_admin", "student"))
):
    """
    List payments with filters (campus-filtered).
    
    Access:
    - Admins can see payments within their campus scope
    - Students can only see their own payments
    """
    # Build base query with join to get student_id and campus
    query = select(Payment).join(Invoice).join(User, Invoice.student_id == User.id)
    
    # Students can only see their own payments
    if "student" in current_user.get("roles", []):
        query = query.where(Invoice.student_id == UUID(current_user["db_user_id"]))
    else:
        # Admin - apply campus filtering
        user_campus_access = await get_user_campus_access({"uid": current_user["uid"], "roles": current_user.get("roles", [])}, db)
        
        if campus_code:
            # Specific campus requested - look up campus by code
            campus_result = await db.execute(select(Campus).where(Campus.code == campus_code.upper()))
            campus = campus_result.scalar_one_or_none()
            if not campus:
                raise NotFoundError("Campus", campus_code)
            
            # Verify access
            if user_campus_access is not None:
                await check_campus_access({"uid": current_user["uid"], "roles": current_user.get("roles", [])}, campus.id, db, raise_error=True)
            query = query.where(User.campus_id == campus.id)
        else:
            # No specific campus - filter by user's campus access
            if user_campus_access is not None:  # Campus-scoped admin
                if user_campus_access:
                    query = query.where(User.campus_id.in_(user_campus_access))
                else:
                    # No campus assignments - return empty
                    return PaginatedResponse(
                        items=[],
                        total=0,
                        page=page,
                        per_page=page_size,  # Fixed: use per_page instead of page_size
                        pages=0
                    )
        
        if student_id:
            query = query.where(Invoice.student_id == student_id)
    
    if invoice_id:
        query = query.where(Payment.invoice_id == invoice_id)
    
    if payment_method:
        query = query.where(Payment.payment_method == payment_method)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(Payment.payment_date.desc())
    
    result = await db.execute(query)
    payments = result.scalars().all()
    
    return PaginatedResponse(
        items=payments,
        total=total,
        page=page,
        per_page=page_size,  # Fixed: use per_page instead of page_size
        pages=(total + page_size - 1) // page_size
    )


@router.get("/students/my/summary", response_model=StudentFinancialSummary)
async def get_my_financial_summary(
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_student())
):
    """
    Get financial summary for current student.
    
    Access: student
    """
    student_id = int(current_user["db_user_id"])
    return await get_student_financial_summary(student_id, db, current_user)


@router.get("/students/{student_id}/summary", response_model=StudentFinancialSummary)
async def get_student_financial_summary(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "finance_admin", "student"))
):
    """
    Get financial summary for a student.
    
    Access:
    - Admins can see any student's summary
    - Students can only see their own summary
    
    Returns:
    - Total invoiced amount
    - Total paid amount
    - Outstanding balance
    - Invoice breakdown by status
    """
    # Students can only see their own summary
    if "student" in current_user.get("roles", []) and int(current_user["db_user_id"]) != student_id:
        raise HTTPException(status_code=403, detail="You can only view your own financial summary")
    
    # Verify student exists
    student_query = await db.execute(
        select(User).where(
            and_(
                User.id == student_id,
                User.role == "student"
            )
        )
    )
    student = student_query.scalar_one_or_none()
    if not student:
        raise NotFoundError("Student", student_id)
    
    # Get all invoices for student
    invoices_query = await db.execute(
        select(Invoice).where(Invoice.student_id == student_id)
    )
    invoices = invoices_query.scalars().all()
    
    # Calculate totals
    total_invoiced = sum(inv.total_amount for inv in invoices)
    total_paid = sum(inv.paid_amount for inv in invoices)
    outstanding_balance = sum(inv.balance for inv in invoices)
    
    # Count by status
    status_counts = {}
    for inv in invoices:
        status_counts[inv.status] = status_counts.get(inv.status, 0) + 1
    
    return StudentFinancialSummary(
        student_id=student_id,
        student_name=student.full_name,
        total_invoiced=total_invoiced,
        total_paid=total_paid,
        outstanding_balance=outstanding_balance,
        invoice_count=len(invoices),
        status_breakdown=status_counts,
    )


@router.get("/semesters/{semester_id}/summary", response_model=SemesterFinancialSummary)
async def get_semester_financial_summary(
    semester_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_roles("super_admin", "finance_admin"))
):
    """
    Get financial summary for a semester.
    
    Access: admin, finance_admin
    
    Returns:
    - Total invoiced for semester
    - Total collected
    - Outstanding balance
    - Collection rate
    - Student count
    """
    # Verify semester exists
    semester_query = await db.execute(
        select(Semester).where(Semester.id == semester_id)
    )
    semester = semester_query.scalar_one_or_none()
    if not semester:
        raise NotFoundError("Semester", semester_id)
    
    # Get all invoices for semester
    invoices_query = await db.execute(
        select(Invoice).where(Invoice.semester_id == semester_id)
    )
    invoices = invoices_query.scalars().all()
    
    # Calculate totals
    total_invoiced = sum(inv.total_amount for inv in invoices)
    total_collected = sum(inv.paid_amount for inv in invoices)
    outstanding_balance = sum(inv.balance for inv in invoices)
    
    # Get unique student count
    unique_students = len(set(inv.student_id for inv in invoices))
    
    # Calculate collection rate
    collection_rate = (total_collected / total_invoiced * 100) if total_invoiced > 0 else 0
    
    return SemesterFinancialSummary(
        semester_id=semester_id,
        semester_name=semester.name,
        total_invoiced=total_invoiced,
        total_collected=total_collected,
        outstanding_balance=outstanding_balance,
        collection_rate=collection_rate,
        student_count=unique_students,
        invoice_count=len(invoices),
    )
