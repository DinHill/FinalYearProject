import firebase_admin
from firebase_admin import credentials, auth, firestore
from typing import Optional, Dict, Any
import logging
import json
import os
from app.core.config import settings

logger = logging.getLogger(__name__)

class FirebaseService:
    def __init__(self):
        self.app = None
        self.db = None
        self._initialize_firebase()

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Initialize Firebase if not already done
            if not firebase_admin._apps:
                # Use service account key from environment or file
                if settings.FIREBASE_SERVICE_ACCOUNT_KEY:
                    # Load from environment variable (JSON string)
                    service_account_info = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_KEY)
                    cred = credentials.Certificate(service_account_info)
                elif settings.FIREBASE_SERVICE_ACCOUNT_PATH:
                    # Load from file path
                    cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
                else:
                    raise ValueError("Firebase service account credentials not configured")
                
                self.app = firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin SDK initialized successfully")
            else:
                self.app = firebase_admin.get_app()
            
            # Initialize Firestore
            self.db = firestore.client()
            
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {str(e)}")
            raise

    def verify_token(self, id_token: str) -> Optional[Dict[str, Any]]:
        """Verify Firebase ID token and return decoded token"""
        try:
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except auth.InvalidIdTokenError as e:
            logger.warning(f"Invalid ID token: {str(e)}")
            return None
        except auth.ExpiredIdTokenError as e:
            logger.warning(f"Expired ID token: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error verifying token: {str(e)}")
            return None

    def get_user_by_uid(self, uid: str) -> Optional[auth.UserRecord]:
        """Get Firebase user by UID"""
        try:
            user_record = auth.get_user(uid)
            return user_record
        except auth.UserNotFoundError:
            logger.warning(f"Firebase user not found: {uid}")
            return None
        except Exception as e:
            logger.error(f"Error getting Firebase user {uid}: {str(e)}")
            return None

    def create_custom_token(self, uid: str, additional_claims: Optional[Dict] = None) -> str:
        """Create custom token for user"""
        try:
            custom_token = auth.create_custom_token(uid, additional_claims)
            return custom_token.decode('utf-8')
        except Exception as e:
            logger.error(f"Error creating custom token for {uid}: {str(e)}")
            raise

    def set_custom_claims(self, uid: str, custom_claims: Dict[str, Any]) -> bool:
        """Set custom claims for user"""
        try:
            auth.set_custom_user_claims(uid, custom_claims)
            logger.info(f"Set custom claims for user {uid}: {custom_claims}")
            return True
        except Exception as e:
            logger.error(f"Error setting custom claims for {uid}: {str(e)}")
            return False

    def disable_user(self, uid: str) -> bool:
        """Disable Firebase user"""
        try:
            auth.update_user(uid, disabled=True)
            logger.info(f"Disabled Firebase user: {uid}")
            return True
        except Exception as e:
            logger.error(f"Error disabling user {uid}: {str(e)}")
            return False

    def enable_user(self, uid: str) -> bool:
        """Enable Firebase user"""
        try:
            auth.update_user(uid, disabled=False)
            logger.info(f"Enabled Firebase user: {uid}")
            return True
        except Exception as e:
            logger.error(f"Error enabling user {uid}: {str(e)}")
            return False

    # Firestore operations for real-time features
    def create_user_profile(self, uid: str, profile_data: Dict[str, Any]) -> bool:
        """Create user profile in Firestore"""
        try:
            doc_ref = self.db.collection('users').document(uid)
            doc_ref.set(profile_data)
            logger.info(f"Created Firestore profile for user: {uid}")
            return True
        except Exception as e:
            logger.error(f"Error creating Firestore profile for {uid}: {str(e)}")
            return False

    def update_user_profile(self, uid: str, profile_data: Dict[str, Any]) -> bool:
        """Update user profile in Firestore"""
        try:
            doc_ref = self.db.collection('users').document(uid)
            doc_ref.update(profile_data)
            logger.info(f"Updated Firestore profile for user: {uid}")
            return True
        except Exception as e:
            logger.error(f"Error updating Firestore profile for {uid}: {str(e)}")
            return False

    def get_user_profile(self, uid: str) -> Optional[Dict[str, Any]]:
        """Get user profile from Firestore"""
        try:
            doc_ref = self.db.collection('users').document(uid)
            doc = doc_ref.get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            logger.error(f"Error getting Firestore profile for {uid}: {str(e)}")
            return None

    def create_chat_room(self, room_data: Dict[str, Any]) -> Optional[str]:
        """Create chat room in Firestore"""
        try:
            doc_ref = self.db.collection('chat_rooms').add(room_data)
            room_id = doc_ref[1].id
            logger.info(f"Created chat room: {room_id}")
            return room_id
        except Exception as e:
            logger.error(f"Error creating chat room: {str(e)}")
            return None

    def send_message(self, room_id: str, message_data: Dict[str, Any]) -> bool:
        """Send message to chat room"""
        try:
            self.db.collection('chat_rooms').document(room_id).collection('messages').add(message_data)
            # Update last message timestamp
            self.db.collection('chat_rooms').document(room_id).update({
                'last_message_at': firestore.SERVER_TIMESTAMP
            })
            return True
        except Exception as e:
            logger.error(f"Error sending message to room {room_id}: {str(e)}")
            return False

# Global Firebase service instance
firebase_service = FirebaseService()