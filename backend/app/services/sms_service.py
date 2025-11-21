"""
SMS Service
Handles SMS notifications via Twilio or similar gateway
"""
from typing import List, Optional, Dict
from datetime import datetime
import os
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException


class SMSTemplate:
    """SMS message templates (160 char limit for standard SMS)"""
    
    TEMPLATES = {
        'grade_published': "Hi {student_name}, your grade for {course_code} is now available: {grade_letter}. Check portal for details.",
        
        'attendance_alert': "Alert: {student_name} has {absent_count} absences in {course_code}. Attendance rate: {attendance_rate}%.",
        
        'enrollment_confirmed': "Enrollment confirmed! {course_code} - {course_name}, {section_name}. Schedule: {schedule}.",
        
        'class_reminder': "Reminder: {course_code} class today at {time} in {room}. Don't be late!",
        
        'assignment_due': "Assignment due soon! {course_code}: '{assignment_name}' due on {due_date}.",
        
        'announcement': "New announcement: {title}. Check portal for full details.",
        
        'payment_reminder': "Payment reminder: {amount} due on {due_date} for {description}.",
        
        'schedule_change': "Schedule change: {course_code} class moved to {new_time} in {new_room}.",
        
        'emergency_alert': "EMERGENCY: {message}. Check portal or contact admin immediately.",
        
        'password_reset': "Password reset code: {code}. Valid for {expiry_minutes} minutes. Do not share this code.",
        
        'exam_reminder': "Exam reminder: {course_code} exam on {exam_date} at {exam_time} in {room}.",
        
        'grade_below_threshold': "Academic alert: Your GPA ({gpa}) is below required threshold. Please contact your advisor."
    }
    
    @classmethod
    def render(cls, template_name: str, context: Dict) -> str:
        """Render SMS template with context"""
        if template_name not in cls.TEMPLATES:
            raise ValueError(f"SMS template '{template_name}' not found")
        
        template = cls.TEMPLATES[template_name]
        message = template.format(**context)
        
        # Ensure message fits in standard SMS (160 chars)
        if len(message) > 160:
            message = message[:157] + '...'
        
        return message


class SMSService:
    """SMS service using Twilio"""
    
    def __init__(self):
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID', '')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN', '')
        self.from_number = os.getenv('TWILIO_FROM_NUMBER', '')
        self.enabled = os.getenv('SMS_ENABLED', 'false').lower() == 'true'
        
        # Initialize Twilio client if credentials available
        self.client = None
        if self.account_sid and self.auth_token:
            try:
                self.client = Client(self.account_sid, self.auth_token)
            except Exception as e:
                print(f"[SMS ERROR] Failed to initialize Twilio client: {e}")
    
    def _normalize_phone(self, phone: str) -> str:
        """Normalize phone number to E.164 format (+country_code + number)"""
        # Remove common separators
        phone = phone.replace('-', '').replace('(', '').replace(')', '').replace(' ', '')
        
        # Add + if missing
        if not phone.startswith('+'):
            # Assume US number if no country code
            if len(phone) == 10:
                phone = f'+1{phone}'
            else:
                phone = f'+{phone}'
        
        return phone
    
    def send_sms(
        self,
        to_phone: str,
        message: str,
        priority: str = 'normal'
    ) -> Dict:
        """
        Send single SMS
        Returns: {'success': bool, 'message_sid': str, 'error': str}
        """
        if not self.enabled:
            print(f"[SMS DISABLED] Would send to {to_phone}: {message}")
            return {
                'success': False,
                'message_sid': None,
                'error': 'SMS service is disabled'
            }
        
        if not self.client:
            print("[SMS ERROR] Twilio client not initialized")
            return {
                'success': False,
                'message_sid': None,
                'error': 'SMS service not configured'
            }
        
        try:
            # Normalize phone number
            normalized_phone = self._normalize_phone(to_phone)
            
            # Send SMS via Twilio
            message_obj = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=normalized_phone
            )
            
            print(f"[SMS SENT] To: {normalized_phone}, SID: {message_obj.sid}")
            
            return {
                'success': True,
                'message_sid': message_obj.sid,
                'error': None
            }
            
        except TwilioRestException as e:
            print(f"[SMS ERROR] Twilio error: {e.msg}")
            return {
                'success': False,
                'message_sid': None,
                'error': f"Twilio error: {e.msg}"
            }
        except Exception as e:
            print(f"[SMS ERROR] Unexpected error: {str(e)}")
            return {
                'success': False,
                'message_sid': None,
                'error': str(e)
            }
    
    def send_template_sms(
        self,
        to_phone: str,
        template_name: str,
        context: Dict,
        priority: str = 'normal'
    ) -> Dict:
        """Send SMS using a pre-defined template"""
        try:
            message = SMSTemplate.render(template_name, context)
            return self.send_sms(to_phone, message, priority)
        except Exception as e:
            print(f"[SMS ERROR] Template error: {str(e)}")
            return {
                'success': False,
                'message_sid': None,
                'error': f"Template error: {str(e)}"
            }
    
    def send_bulk_sms(
        self,
        recipients: List[Dict],
        message: str,
        delay_seconds: float = 0.5
    ) -> Dict:
        """
        Send bulk SMS messages
        recipients: [{'phone': '+1234567890', 'message': 'custom or None'}]
        Returns: {'sent': count, 'failed': count, 'results': [...]}
        """
        import time
        
        results = {
            'sent': 0,
            'failed': 0,
            'results': []
        }
        
        for recipient in recipients:
            # Use custom message if provided, otherwise use default
            msg = recipient.get('message', message)
            
            # Send SMS
            result = self.send_sms(recipient['phone'], msg)
            
            results['results'].append({
                'phone': recipient['phone'],
                'success': result['success'],
                'message_sid': result['message_sid'],
                'error': result['error']
            })
            
            if result['success']:
                results['sent'] += 1
            else:
                results['failed'] += 1
            
            # Rate limiting delay
            if delay_seconds > 0:
                time.sleep(delay_seconds)
        
        return results
    
    def send_bulk_template_sms(
        self,
        recipients: List[Dict],
        template_name: str,
        base_context: Dict = {},
        delay_seconds: float = 0.5
    ) -> Dict:
        """
        Send bulk SMS using template
        recipients: [{'phone': '+1234567890', 'context': {...}}]
        """
        import time
        
        results = {
            'sent': 0,
            'failed': 0,
            'results': []
        }
        
        for recipient in recipients:
            # Merge base context with recipient context
            context = {**base_context, **recipient.get('context', {})}
            
            # Send templated SMS
            result = self.send_template_sms(
                recipient['phone'],
                template_name,
                context
            )
            
            results['results'].append({
                'phone': recipient['phone'],
                'success': result['success'],
                'message_sid': result['message_sid'],
                'error': result['error']
            })
            
            if result['success']:
                results['sent'] += 1
            else:
                results['failed'] += 1
            
            # Rate limiting
            if delay_seconds > 0:
                time.sleep(delay_seconds)
        
        return results
    
    def get_available_templates(self) -> List[str]:
        """Get list of available SMS templates"""
        return list(SMSTemplate.TEMPLATES.keys())
    
    def get_message_status(self, message_sid: str) -> Optional[Dict]:
        """
        Get status of sent SMS message
        Returns message details from Twilio
        """
        if not self.client:
            return None
        
        try:
            message = self.client.messages(message_sid).fetch()
            return {
                'sid': message.sid,
                'status': message.status,
                'to': message.to,
                'from': message.from_,
                'date_sent': message.date_sent.isoformat() if message.date_sent else None,
                'error_code': message.error_code,
                'error_message': message.error_message
            }
        except Exception as e:
            print(f"[SMS ERROR] Failed to fetch message status: {e}")
            return None


# Global SMS service instance
sms_service = SMSService()
