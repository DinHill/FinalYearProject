"""
PDF Generation Service

Handles PDF document generation:
- Student transcripts
- Certificates
- Invoice PDFs
"""

from io import BytesIO
from datetime import datetime
from typing import List, Dict, Optional
from decimal import Decimal

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
    Image,
    PageBreak
)
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
import qrcode


class PDFService:
    """Service for generating PDF documents"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a365d'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#2d3748'),
            spaceAfter=12,
            alignment=TA_CENTER,
        ))
        
        # Header style
        self.styles.add(ParagraphStyle(
            name='CustomHeader',
            parent=self.styles['Heading3'],
            fontSize=12,
            textColor=colors.HexColor('#2d3748'),
            spaceAfter=6,
            fontName='Helvetica-Bold'
        ))
    
    def generate_transcript(
        self,
        student_data: Dict,
        semester_grades: List[Dict],
        gpa_data: Dict,
        output_path: Optional[str] = None
    ) -> BytesIO:
        """
        Generate student transcript PDF.
        
        Args:
            student_data: {
                'student_id': str,
                'full_name': str,
                'major': str,
                'campus': str,
                'enrollment_year': int
            }
            semester_grades: List of {
                'semester': str,
                'courses': List of {
                    'code': str,
                    'name': str,
                    'credits': int,
                    'grade': str,
                    'grade_points': float
                }
            }
            gpa_data: {
                'cumulative_gpa': float,
                'total_credits': int,
                'credits_earned': int,
                'academic_standing': str
            }
            output_path: Optional file path to save PDF
        
        Returns:
            BytesIO buffer with PDF content
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72,
        )
        
        # Container for PDF elements
        story = []
        
        # Header
        story.append(Paragraph("GREENWICH UNIVERSITY VIETNAM", self.styles['CustomTitle']))
        story.append(Paragraph("OFFICIAL ACADEMIC TRANSCRIPT", self.styles['CustomSubtitle']))
        story.append(Spacer(1, 0.3 * inch))
        
        # Student Information
        student_info = [
            ["Student ID:", student_data['student_id']],
            ["Full Name:", student_data['full_name']],
            ["Major:", student_data['major']],
            ["Campus:", student_data['campus']],
            ["Enrollment Year:", str(student_data['enrollment_year'])],
        ]
        
        student_table = Table(student_info, colWidths=[2 * inch, 4 * inch])
        student_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#2d3748')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(student_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # Course Grades by Semester
        for semester_data in semester_grades:
            story.append(Paragraph(f"<b>{semester_data['semester']}</b>", self.styles['CustomHeader']))
            story.append(Spacer(1, 0.1 * inch))
            
            # Course table
            course_data = [['Course Code', 'Course Name', 'Credits', 'Grade', 'Grade Points']]
            
            for course in semester_data['courses']:
                course_data.append([
                    course['code'],
                    course['name'][:40],  # Truncate long names
                    str(course['credits']),
                    course['grade'],
                    f"{course['grade_points']:.2f}"
                ])
            
            course_table = Table(
                course_data,
                colWidths=[1.2 * inch, 2.5 * inch, 0.8 * inch, 0.7 * inch, 1 * inch]
            )
            
            course_table.setStyle(TableStyle([
                # Header row
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4a5568')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                
                # Data rows
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
                ('ALIGN', (0, 1), (1, -1), 'LEFT'),
                
                # Grid
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')]),
            ]))
            
            story.append(course_table)
            story.append(Spacer(1, 0.2 * inch))
        
        # GPA Summary
        story.append(Spacer(1, 0.2 * inch))
        story.append(Paragraph("<b>Academic Summary</b>", self.styles['CustomHeader']))
        story.append(Spacer(1, 0.1 * inch))
        
        gpa_info = [
            ["Cumulative GPA:", f"{gpa_data['cumulative_gpa']:.2f}"],
            ["Total Credits Attempted:", str(gpa_data['total_credits'])],
            ["Credits Earned:", str(gpa_data['credits_earned'])],
            ["Academic Standing:", gpa_data['academic_standing']],
        ]
        
        gpa_table = Table(gpa_info, colWidths=[2.5 * inch, 2 * inch])
        gpa_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(gpa_table)
        story.append(Spacer(1, 0.4 * inch))
        
        # Generate QR code for verification
        qr_data = f"TRANSCRIPT-{student_data['student_id']}-{datetime.utcnow().strftime('%Y%m%d')}"
        qr = qrcode.QRCode(version=1, box_size=3, border=1)
        qr.add_data(qr_data)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        
        # Save QR to buffer
        qr_buffer = BytesIO()
        qr_img.save(qr_buffer, format='PNG')
        qr_buffer.seek(0)
        
        # Add QR code
        story.append(Spacer(1, 0.2 * inch))
        story.append(Paragraph("Verification QR Code", self.styles['Normal']))
        story.append(Spacer(1, 0.1 * inch))
        qr_image = Image(qr_buffer, width=1.5*inch, height=1.5*inch)
        story.append(qr_image)
        
        # Footer
        story.append(Spacer(1, 0.3 * inch))
        issue_date = datetime.utcnow().strftime("%B %d, %Y")
        story.append(Paragraph(
            f"<i>Issued on {issue_date}</i>",
            self.styles['Normal']
        ))
        story.append(Paragraph(
            "<i>This is an official document from Greenwich University Vietnam.</i>",
            self.styles['Normal']
        ))
        
        # Build PDF
        doc.build(story)
        
        # Save to file if path provided
        if output_path:
            with open(output_path, 'wb') as f:
                f.write(buffer.getvalue())
        
        buffer.seek(0)
        return buffer
    
    def generate_certificate(
        self,
        student_data: Dict,
        certificate_type: str,
        issue_date: datetime,
        output_path: Optional[str] = None
    ) -> BytesIO:
        """
        Generate certificate PDF (completion, enrollment verification, etc.).
        
        Args:
            student_data: Student information
            certificate_type: Type of certificate
            issue_date: Certificate issue date
            output_path: Optional file path
        
        Returns:
            BytesIO buffer with PDF content
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        
        story = []
        
        # Header
        story.append(Spacer(1, 0.5 * inch))
        story.append(Paragraph("GREENWICH UNIVERSITY VIETNAM", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.3 * inch))
        
        # Certificate title
        cert_title = certificate_type.upper().replace('_', ' ')
        story.append(Paragraph(cert_title, self.styles['CustomSubtitle']))
        story.append(Spacer(1, 0.5 * inch))
        
        # Certificate body
        body_text = f"""
        <para alignment="center">
        This is to certify that<br/><br/>
        <b><font size="16">{student_data['full_name']}</font></b><br/><br/>
        Student ID: {student_data['student_id']}<br/>
        Major: {student_data['major']}<br/>
        Campus: {student_data['campus']}<br/><br/>
        </para>
        """
        
        story.append(Paragraph(body_text, self.styles['Normal']))
        story.append(Spacer(1, 0.5 * inch))
        
        # Signature section
        story.append(Spacer(1, 1 * inch))
        
        sig_data = [
            ["_____________________", "_____________________"],
            ["Registrar", "Campus Director"],
        ]
        
        sig_table = Table(sig_data, colWidths=[3 * inch, 3 * inch])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ]))
        
        story.append(sig_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # Issue date
        issue_str = issue_date.strftime("%B %d, %Y")
        story.append(Paragraph(
            f"<para alignment='center'><i>Issued on {issue_str}</i></para>",
            self.styles['Normal']
        ))
        
        # Build PDF
        doc.build(story)
        
        if output_path:
            with open(output_path, 'wb') as f:
                f.write(buffer.getvalue())
        
        buffer.seek(0)
        return buffer
    
    def generate_invoice_pdf(
        self,
        invoice_data: Dict,
        lines: List[Dict],
        student_data: Dict,
        output_path: Optional[str] = None
    ) -> BytesIO:
        """
        Generate invoice PDF.
        
        Args:
            invoice_data: Invoice information
            lines: Invoice line items
            student_data: Student information
            output_path: Optional file path
        
        Returns:
            BytesIO buffer with PDF content
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        
        story = []
        
        # Header
        story.append(Paragraph("GREENWICH UNIVERSITY VIETNAM", self.styles['CustomTitle']))
        story.append(Paragraph("TUITION INVOICE", self.styles['CustomSubtitle']))
        story.append(Spacer(1, 0.3 * inch))
        
        # Invoice info
        info_data = [
            ["Invoice Number:", invoice_data['invoice_number']],
            ["Issue Date:", invoice_data['issue_date'].strftime("%B %d, %Y")],
            ["Due Date:", invoice_data['due_date'].strftime("%B %d, %Y")],
            ["", ""],
            ["Student ID:", student_data['student_id']],
            ["Student Name:", student_data['full_name']],
            ["Major:", student_data['major']],
        ]
        
        info_table = Table(info_data, colWidths=[2 * inch, 3.5 * inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(info_table)
        story.append(Spacer(1, 0.4 * inch))
        
        # Line items
        story.append(Paragraph("<b>Invoice Details</b>", self.styles['CustomHeader']))
        story.append(Spacer(1, 0.1 * inch))
        
        line_data = [['Description', 'Quantity', 'Unit Price', 'Amount']]
        
        for line in lines:
            line_data.append([
                line['description'],
                str(line['quantity']),
                f"${line['unit_price']:,.2f}",
                f"${line['amount']:,.2f}"
            ])
        
        # Add totals
        line_data.append(['', '', 'Total:', f"${invoice_data['total_amount']:,.2f}"])
        line_data.append(['', '', 'Paid:', f"${invoice_data['paid_amount']:,.2f}"])
        line_data.append(['', '', 'Balance Due:', f"${invoice_data['balance']:,.2f}"])
        
        line_table = Table(line_data, colWidths=[3 * inch, 1 * inch, 1.5 * inch, 1.5 * inch])
        line_table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4a5568')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (1, 0), (-1, 0), 'CENTER'),
            
            # Data rows
            ('ALIGN', (1, 1), (-1, -4), 'CENTER'),
            ('ALIGN', (0, 1), (0, -4), 'LEFT'),
            ('GRID', (0, 0), (-1, -4), 0.5, colors.grey),
            
            # Totals
            ('FONTNAME', (2, -3), (2, -1), 'Helvetica-Bold'),
            ('ALIGN', (2, -3), (-1, -1), 'RIGHT'),
            ('LINEABOVE', (2, -3), (-1, -3), 1, colors.black),
            ('LINEABOVE', (2, -1), (-1, -1), 2, colors.black),
        ]))
        
        story.append(line_table)
        story.append(Spacer(1, 0.5 * inch))
        
        # Payment info
        story.append(Paragraph("<b>Payment Information</b>", self.styles['CustomHeader']))
        story.append(Paragraph(
            "Please make payment to the Finance Office or via bank transfer.",
            self.styles['Normal']
        ))
        
        # Build PDF
        doc.build(story)
        
        if output_path:
            with open(output_path, 'wb') as f:
                f.write(buffer.getvalue())
        
        buffer.seek(0)
        return buffer


# Singleton instance
pdf_service = PDFService()
