"""
Firebase Admin SDK service for backend authentication and real-time features
"""
import firebase_admin
from firebase_admin import credentials, auth, firestore, storage
from typing import Optional, Dict, Any
import json
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class FirebaseService:
    def __init__(self):
        self.app = None
        self.db = None
        self.storage_bucket = None
        self._initialize_firebase()

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            if not settings.FIREBASE_PROJECT_ID:
                logger.warning("Firebase not configured - skipping initialization")
                return

            # Check if Firebase is already initialized
            if firebase_admin._apps:
                self.app = firebase_admin.get_app()
                logger.info("Using existing Firebase app")
            else:
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
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{settings.FIREBASE_CLIENT_EMAIL.replace('@', '%40')}"
                }

                # Initialize Firebase Admin SDK
                cred = credentials.Certificate(cred_dict)
                self.app = firebase_admin.initialize_app(cred, {
                    'storageBucket': f'{settings.FIREBASE_PROJECT_ID}.appspot.com'
                })

            # Initialize Firestore
            self.db = firestore.client()
            
            # Initialize Storage
            self.storage_bucket = storage.bucket()
            
            logger.info(f"Firebase initialized successfully for project: {settings.FIREBASE_PROJECT_ID}")

        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            self.app = None
            self.db = None
            self.storage_bucket = None

    def verify_token(self, id_token: str) -> Optional[Dict[str, Any]]:
        """Verify Firebase ID token"""
        try:
            if not self.app:
                logger.warning("Firebase not initialized")
                return None

            decoded_token = auth.verify_id_token(id_token)
            return decoded_token

        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            return None

    def get_user(self, uid: str) -> Optional[Dict[str, Any]]:
        """Get user by UID"""
        try:
            if not self.app:
                return None

            user = auth.get_user(uid)
            return {
                'uid': user.uid,
                'email': user.email,
                'email_verified': user.email_verified,
                'display_name': user.display_name,
                'photo_url': user.photo_url,
                'disabled': user.disabled,
                'provider_data': [
                    {
                        'uid': provider.uid,
                        'email': provider.email,
                        'provider_id': provider.provider_id
                    } for provider in user.provider_data
                ]
            }

        except Exception as e:
            logger.error(f"Failed to get user {uid}: {e}")
            return None

    def create_user(self, email: str, password: str, display_name: str = None) -> Optional[str]:
        """Create a new Firebase user"""
        try:
            if not self.app:
                return None

            user_data = {
                'email': email,
                'password': password,
                'email_verified': False,
                'disabled': False
            }
            
            if display_name:
                user_data['display_name'] = display_name

            user = auth.create_user(**user_data)
            logger.info(f"Created Firebase user: {user.uid}")
            return user.uid

        except Exception as e:
            logger.error(f"Failed to create user: {e}")
            return None

    def update_user(self, uid: str, **kwargs) -> bool:
        """Update Firebase user"""
        try:
            if not self.app:
                return False

            auth.update_user(uid, **kwargs)
            logger.info(f"Updated Firebase user: {uid}")
            return True

        except Exception as e:
            logger.error(f"Failed to update user {uid}: {e}")
            return False

    def delete_user(self, uid: str) -> bool:
        """Delete Firebase user"""
        try:
            if not self.app:
                return False

            auth.delete_user(uid)
            logger.info(f"Deleted Firebase user: {uid}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete user {uid}: {e}")
            return False

    # Firestore operations
    def add_document(self, collection: str, document_data: Dict[str, Any], document_id: str = None) -> Optional[str]:
        """Add document to Firestore"""
        try:
            if not self.db:
                return None

            if document_id:
                doc_ref = self.db.collection(collection).document(document_id)
                doc_ref.set(document_data)
                return document_id
            else:
                doc_ref = self.db.collection(collection).add(document_data)
                return doc_ref[1].id

        except Exception as e:
            logger.error(f"Failed to add document to {collection}: {e}")
            return None

    def get_document(self, collection: str, document_id: str) -> Optional[Dict[str, Any]]:
        """Get document from Firestore"""
        try:
            if not self.db:
                return None

            doc_ref = self.db.collection(collection).document(document_id)
            doc = doc_ref.get()
            
            if doc.exists:
                return doc.to_dict()
            return None

        except Exception as e:
            logger.error(f"Failed to get document {document_id} from {collection}: {e}")
            return None

    def update_document(self, collection: str, document_id: str, update_data: Dict[str, Any]) -> bool:
        """Update document in Firestore"""
        try:
            if not self.db:
                return False

            doc_ref = self.db.collection(collection).document(document_id)
            doc_ref.update(update_data)
            return True

        except Exception as e:
            logger.error(f"Failed to update document {document_id} in {collection}: {e}")
            return False

    def delete_document(self, collection: str, document_id: str) -> bool:
        """Delete document from Firestore"""
        try:
            if not self.db:
                return False

            doc_ref = self.db.collection(collection).document(document_id)
            doc_ref.delete()
            return True

        except Exception as e:
            logger.error(f"Failed to delete document {document_id} from {collection}: {e}")
            return False

    def query_collection(self, collection: str, filters: list = None, limit: int = None) -> list:
        """Query collection with filters"""
        try:
            if not self.db:
                return []

            query = self.db.collection(collection)
            
            if filters:
                for filter_item in filters:
                    field, operator, value = filter_item
                    query = query.where(field, operator, value)
            
            if limit:
                query = query.limit(limit)

            docs = query.stream()
            return [{'id': doc.id, **doc.to_dict()} for doc in docs]

        except Exception as e:
            logger.error(f"Failed to query collection {collection}: {e}")
            return []

    def is_initialized(self) -> bool:
        """Check if Firebase is properly initialized"""
        return self.app is not None and self.db is not None

# Global Firebase service instance
firebase_service = FirebaseService()