"""
Email service for sending notifications
"""
import logging
from typing import Optional
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from app.core.settings import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via SendGrid"""
    
    @staticmethod
    def send_password_reset_email(to_email: str, reset_token: str, username: str) -> bool:
        """
        Send password reset email with Firebase reset link
        
        Args:
            to_email: Recipient email address
            reset_token: Firebase password reset link (full URL from Firebase)
            username: User's username
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            if not settings.SENDGRID_API_KEY:
                logger.warning("SendGrid API key not configured - simulating email send")
                logger.info(f"📧 [SIMULATED] Password reset email to: {to_email}")
                logger.info(f"   Username: {username}")
                logger.info(f"\n   ⚠️  Click this link to reset password (Firebase):")
                logger.info(f"   {reset_token}")
                logger.info(f"\n   💡 This link expires in 1 hour")
                return True
            
            # Use the Firebase reset link directly (it's already a complete URL)
            reset_link = reset_token
            
            # Email content
            subject = "Password Reset Request - Academic Portal"
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .button {{ display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }}
                    .warning {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Hello <strong>{username}</strong>,</p>
                        
                        <p>We received a request to reset your password for your Academic Portal account.</p>
                        
                        <p>Click the button below to reset your password:</p>
                        
                        <div style="text-align: center;">
                            <a href="{reset_link}" class="button">Reset Password</a>
                        </div>
                        
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #2563eb;">{reset_link}</p>
                        
                        <div class="warning">
                            <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
                        </div>
                        
                        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                        
                        <p>Best regards,<br>
                        <strong>Academic Portal Team</strong><br>
                        University of Greenwich Vietnam</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message, please do not reply to this email.</p>
                        <p>&copy; 2024 University of Greenwich Vietnam. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            message = Mail(
                from_email=Email(settings.SENDGRID_FROM_EMAIL, settings.SENDGRID_FROM_NAME),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            response = sg.send(message)
            
            logger.info(f"Password reset email sent to {to_email} - Status: {response.status_code}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send password reset email: {str(e)}", exc_info=True)
            return False
    
    @staticmethod
    def send_password_changed_notification(to_email: str, username: str) -> bool:
        """
        Send notification when password is successfully changed
        
        Args:
            to_email: Recipient email address
            username: User's username
            
        Returns:
            bool: True if email sent successfully
        """
        try:
            if not settings.SENDGRID_API_KEY:
                logger.info(f"📧 [SIMULATED] Password changed notification to: {to_email}")
                return True
            
            subject = "Password Successfully Changed - Academic Portal"
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }}
                    .alert {{ background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Password Changed</h1>
                    </div>
                    <div class="content">
                        <p>Hello <strong>{username}</strong>,</p>
                        
                        <p>Your Academic Portal password has been successfully changed.</p>
                        
                        <p>If you made this change, you can safely ignore this email.</p>
                        
                        <div class="alert">
                            <strong>⚠️ Didn't change your password?</strong><br>
                            If you didn't make this change, please contact our support team immediately at support@greenwich.edu.vn
                        </div>
                        
                        <p>Best regards,<br>
                        <strong>Academic Portal Team</strong><br>
                        University of Greenwich Vietnam</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated security notification.</p>
                        <p>&copy; 2024 University of Greenwich Vietnam. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            message = Mail(
                from_email=Email(settings.SENDGRID_FROM_EMAIL, settings.SENDGRID_FROM_NAME),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            response = sg.send(message)
            
            logger.info(f"Password changed notification sent to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send password changed notification: {str(e)}")
            return False
