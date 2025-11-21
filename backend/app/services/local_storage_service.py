"""
Local File Storage Service

Handles file operations for development and testing:
- Store files locally in a directory
- Generate mock presigned URLs
- Simulate upload/download operations
"""

import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any
import hashlib
import mimetypes


class LocalStorageService:
    """Service for local file storage (development/testing)"""
    
    def __init__(self, storage_dir: str = "storage"):
        """Initialize local storage with a directory"""
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_file_path(
        self,
        filename: str,
        category: str = "documents",
        user_id: Optional[int] = None,
        add_timestamp: bool = True
    ) -> str:
        """
        Generate a file path for storage.
        
        Args:
            filename: Original filename
            category: Folder/category (e.g., "documents", "avatars")
            user_id: Optional user ID for organization
            add_timestamp: Whether to add timestamp to filename
            
        Returns:
            Relative file path
        """
        # Sanitize filename
        safe_filename = "".join(c for c in filename if c.isalnum() or c in "._- ")
        
        # Add timestamp if requested
        if add_timestamp:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            name, ext = os.path.splitext(safe_filename)
            safe_filename = f"{timestamp}_{name}{ext}"
        
        # Organize by user if provided
        if user_id:
            return f"{category}/user_{user_id}/{safe_filename}"
        
        return f"{category}/{safe_filename}"
    
    def generate_upload_url(
        self,
        file_path: str,
        content_type: str,
        expiration: int = 3600,
        max_file_size: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Generate a mock presigned URL for uploading.
        
        In production, this would return a real presigned URL.
        For local/testing, we return a mock structure.
        """
        expires_at = datetime.utcnow() + timedelta(seconds=expiration)
        
        # Create directory if needed
        full_path = self.storage_dir / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        return {
            "url": f"http://localhost:8000/api/v1/files/upload/{file_path}",
            "upload_url": f"http://localhost:8000/api/v1/files/upload/{file_path}",
            "file_path": file_path,
            "expires_at": expires_at.isoformat() + "Z",
            "method": "PUT",
            "headers": {
                "Content-Type": content_type,
            },
        }
    
    def generate_download_url(
        self,
        file_path: str,
        expiration: int = 3600,
        disposition: str = "inline",
        filename: Optional[str] = None,
    ) -> str:
        """
        Generate a mock presigned URL for downloading.
        """
        return f"http://localhost:8000/api/v1/files/download/{file_path}"
    
    def file_exists(self, file_path: str) -> bool:
        """
        Check if a file exists.
        
        For testing, we'll accept any path as existing.
        """
        full_path = self.storage_dir / file_path
        return True  # For testing, always return True
    
    def get_file_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        Get file metadata.
        
        For testing, return mock metadata.
        """
        return {
            "size": 1024000,  # 1MB
            "content_type": "application/pdf",
            "created": datetime.utcnow().isoformat() + "Z",
            "updated": datetime.utcnow().isoformat() + "Z",
        }
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete a file.
        
        For testing, always return success.
        """
        full_path = self.storage_dir / file_path
        if full_path.exists():
            full_path.unlink()
            return True
        return True  # Return True even if file doesn't exist (idempotent)
    
    def upload_file(self, file_path: str, file_data: bytes, content_type: str) -> bool:
        """
        Upload a file directly (for testing).
        
        Args:
            file_path: Destination path
            file_data: File content as bytes
            content_type: MIME type
            
        Returns:
            True if successful
        """
        full_path = self.storage_dir / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_bytes(file_data)
        return True


# Global instance
_local_storage_service: Optional[LocalStorageService] = None


def get_local_storage_service() -> Optional[LocalStorageService]:
    """Get or create the local storage service instance"""
    global _local_storage_service
    if _local_storage_service is None:
        _local_storage_service = LocalStorageService()
    return _local_storage_service
