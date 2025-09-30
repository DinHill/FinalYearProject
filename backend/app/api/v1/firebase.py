"""
Firebase integration endpoints for real-time features
"""
from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from pydantic import BaseModel
from app.services.firebase_service import firebase_service

router = APIRouter(prefix="/firebase", tags=["firebase"])

class FirebaseStatus(BaseModel):
    initialized: bool
    project_id: str
    services: Dict[str, bool]

class ChatMessage(BaseModel):
    user_id: str
    message: str
    timestamp: str = None

@router.get("/status", response_model=FirebaseStatus)
async def get_firebase_status():
    """Get Firebase service status"""
    return FirebaseStatus(
        initialized=firebase_service.is_initialized(),
        project_id=firebase_service.app.project_id if firebase_service.app else "Not configured",
        services={
            "auth": firebase_service.app is not None,
            "firestore": firebase_service.db is not None,
            "storage": firebase_service.storage_bucket is not None
        }
    )

@router.post("/test-firestore")
async def test_firestore():
    """Test Firestore connection by adding a test document"""
    try:
        if not firebase_service.is_initialized():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Firebase not initialized"
            )

        # Add a test document
        test_data = {
            "message": "Hello from Academic Portal API",
            "timestamp": "2025-09-29T20:00:00Z",
            "test": True
        }
        
        doc_id = firebase_service.add_document("test", test_data)
        
        if doc_id:
            return {
                "success": True,
                "message": "Firestore test successful",
                "document_id": doc_id,
                "data": test_data
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add test document"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Firestore test failed: {str(e)}"
        )

@router.post("/chat/send")
async def send_chat_message(message: ChatMessage):
    """Send a chat message to Firestore"""
    try:
        if not firebase_service.is_initialized():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Firebase not initialized"
            )

        # Add message to chat collection
        from datetime import datetime
        message_data = {
            "user_id": message.user_id,
            "message": message.message,
            "timestamp": message.timestamp or datetime.utcnow().isoformat(),
            "type": "text"
        }
        
        doc_id = firebase_service.add_document("chat_messages", message_data)
        
        if doc_id:
            return {
                "success": True,
                "message": "Message sent successfully",
                "message_id": doc_id,
                "data": message_data
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send message"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send message: {str(e)}"
        )

@router.get("/chat/messages")
async def get_chat_messages(limit: int = 50):
    """Get recent chat messages"""
    try:
        if not firebase_service.is_initialized():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Firebase not initialized"
            )

        messages = firebase_service.query_collection("chat_messages", limit=limit)
        
        return {
            "success": True,
            "messages": messages,
            "count": len(messages)
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get messages: {str(e)}"
        )