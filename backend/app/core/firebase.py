"""
Firebase Admin SDK initialization and utilities
"""
import firebase_admin
from firebase_admin import credentials, auth, firestore
from app.core.settings import settings
import json
import os
from typing import Optional, Dict, Any


def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Try to use credentials file if it exists
        creds_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None)
        if creds_path:
            # Make path absolute if it's relative
            if not os.path.isabs(creds_path):
                # Get the base directory (backend/)
                base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                creds_path = os.path.join(base_dir, creds_path)
            
            if os.path.exists(creds_path):
                print(f"✅ Loading Firebase credentials from: {creds_path}")
                cred = credentials.Certificate(creds_path)
            else:
                print(f"⚠️  Firebase credentials file not found at: {creds_path}")
                creds_path = None
        
        if not creds_path:
            # Fall back to environment variables (old method)
            print("⚠️  Firebase credentials file not found, trying environment variables...")
            
            # Skip Firebase initialization if using dummy credentials
            if not hasattr(settings, 'FIREBASE_PRIVATE_KEY_ID') or settings.FIREBASE_PRIVATE_KEY_ID == "dummy-key-id":
                print("⚠️  Firebase: Using dummy credentials, Firebase features disabled")
                return False
            
            # Create credentials from environment variables
            cred_dict = {
                "type": "service_account",
                "project_id": settings.FIREBASE_PROJECT_ID,
                "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
                "private_key": settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n'),
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "client_id": settings.FIREBASE_CLIENT_ID,
                "auth_uri": settings.FIREBASE_AUTH_URI,
                "token_uri": settings.FIREBASE_TOKEN_URI,
                "auth_provider_x509_cert_url": settings.FIREBASE_AUTH_PROVIDER_CERT_URL,
                "client_x509_cert_url": settings.FIREBASE_CLIENT_CERT_URL,
            }
            
            cred = credentials.Certificate(cred_dict)
        
        # Initialize app if not already initialized
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin SDK initialized successfully")
        
        return True
    except Exception as e:
        print(f"❌ Failed to initialize Firebase: {e}")
        print("⚠️  Continuing without Firebase - authentication will not work")
        return False


def get_firestore_client():
    """Get Firestore client"""
    return firestore.client()


class FirebaseService:
    """Firebase service for authentication and user management"""
    
    @staticmethod
    def create_custom_token(uid: str, additional_claims: Optional[Dict[str, Any]] = None) -> str:
        """
        Create a Firebase custom token
        
        Args:
            uid: User ID (firebase_uid)
            additional_claims: Custom claims to add to token (role, campus, major, etc.)
        
        Returns:
            Custom token string
        """
        try:
            token = auth.create_custom_token(uid, additional_claims)
            return token.decode('utf-8') if isinstance(token, bytes) else token
        except Exception as e:
            raise Exception(f"Failed to create custom token: {e}")
    
    @staticmethod
    def verify_id_token(token: str, check_revoked: bool = True) -> Dict[str, Any]:
        """
        Verify Firebase ID token
        
        Args:
            token: Firebase ID token
            check_revoked: Whether to check if token has been revoked
        
        Returns:
            Decoded token with user info and claims
        """
        try:
            decoded_token = auth.verify_id_token(token, check_revoked=check_revoked)
            return decoded_token
        except auth.InvalidIdTokenError:
            raise Exception("Invalid ID token")
        except auth.ExpiredIdTokenError:
            raise Exception("Token has expired")
        except auth.RevokedIdTokenError:
            raise Exception("Token has been revoked")
        except auth.CertificateFetchError:
            raise Exception("Failed to fetch public key certificates")
        except Exception as e:
            raise Exception(f"Token verification failed: {e}")
    
    @staticmethod
    def set_custom_user_claims(uid: str, claims: Dict[str, Any]) -> None:
        """
        Set custom claims for a user
        
        Args:
            uid: User ID (firebase_uid)
            claims: Dictionary of custom claims
        """
        try:
            auth.set_custom_user_claims(uid, claims)
        except Exception as e:
            raise Exception(f"Failed to set custom claims: {e}")
    
    @staticmethod
    def revoke_refresh_tokens(uid: str) -> None:
        """
        Revoke all refresh tokens for a user
        Forces user to re-authenticate
        
        Args:
            uid: User ID (firebase_uid)
        """
        try:
            auth.revoke_refresh_tokens(uid)
        except Exception as e:
            raise Exception(f"Failed to revoke tokens: {e}")
    
    @staticmethod
    def get_user(uid: str) -> auth.UserRecord:
        """
        Get user by UID
        
        Args:
            uid: User ID (firebase_uid)
        
        Returns:
            UserRecord
        """
        try:
            return auth.get_user(uid)
        except auth.UserNotFoundError:
            raise Exception(f"User {uid} not found")
        except Exception as e:
            raise Exception(f"Failed to get user: {e}")
    
    @staticmethod
    def get_user_by_email(email: str) -> auth.UserRecord:
        """
        Get user by email
        
        Args:
            email: User email
        
        Returns:
            UserRecord
        """
        try:
            return auth.get_user_by_email(email)
        except auth.UserNotFoundError:
            raise Exception(f"User with email {email} not found")
        except Exception as e:
            raise Exception(f"Failed to get user: {e}")
    
    @staticmethod
    def create_user(email: str, password: str, display_name: Optional[str] = None) -> auth.UserRecord:
        """
        Create a new Firebase user
        
        Args:
            email: User email
            password: User password
            display_name: Display name (optional)
        
        Returns:
            UserRecord
        """
        try:
            user = auth.create_user(
                email=email,
                password=password,
                display_name=display_name,
                email_verified=False
            )
            return user
        except Exception as e:
            raise Exception(f"Failed to create user: {e}")
    
    @staticmethod
    def update_user(uid: str, **kwargs) -> auth.UserRecord:
        """
        Update Firebase user
        
        Args:
            uid: User ID (firebase_uid)
            **kwargs: Fields to update (email, password, display_name, etc.)
        
        Returns:
            Updated UserRecord
        """
        try:
            return auth.update_user(uid, **kwargs)
        except Exception as e:
            raise Exception(f"Failed to update user: {e}")
    
    @staticmethod
    def delete_user(uid: str) -> None:
        """
        Delete Firebase user
        
        Args:
            uid: User ID (firebase_uid)
        """
        try:
            auth.delete_user(uid)
        except Exception as e:
            raise Exception(f"Failed to delete user: {e}")
    
    @staticmethod
    def disable_user(uid: str) -> None:
        """
        Disable user account
        
        Args:
            uid: User ID (firebase_uid)
        """
        try:
            auth.update_user(uid, disabled=True)
        except Exception as e:
            raise Exception(f"Failed to disable user: {e}")
    
    @staticmethod
    def enable_user(uid: str) -> None:
        """
        Enable user account
        
        Args:
            uid: User ID (firebase_uid)
        """
        try:
            auth.update_user(uid, disabled=False)
        except Exception as e:
            raise Exception(f"Failed to enable user: {e}")
