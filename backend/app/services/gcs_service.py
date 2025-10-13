"""
Google Cloud Storage Service

Handles file operations with GCS:
- Generate presigned URLs for uploads
- Generate presigned URLs for downloads
- File metadata management
- Secure file access
"""

from datetime import datetime, timedelta
from typing import Optional
from google.cloud import storage
from google.oauth2 import service_account
import hashlib
import mimetypes

from app.core.settings import settings


class GCSService:
    """Service for interacting with Google Cloud Storage"""
    
    def __init__(self):
        """Initialize GCS client with credentials"""
        if settings.GOOGLE_APPLICATION_CREDENTIALS:
            # Load credentials from file
            credentials = service_account.Credentials.from_service_account_file(
                settings.GOOGLE_APPLICATION_CREDENTIALS
            )
            self.client = storage.Client(
                credentials=credentials,
                project=settings.GCP_PROJECT_ID
            )
        else:
            # Use default credentials (for GCP environments)
            self.client = storage.Client(project=settings.GCP_PROJECT_ID)
        
        self.bucket_name = settings.GCS_BUCKET_NAME
        self.bucket = self.client.bucket(self.bucket_name)
    
    def generate_upload_url(
        self,
        file_path: str,
        content_type: Optional[str] = None,
        expiration: int = 3600,
        max_file_size: Optional[int] = None,
    ) -> dict:
        """
        Generate a presigned URL for uploading a file to GCS.
        
        Args:
            file_path: Path in GCS bucket (e.g., "documents/2024/file.pdf")
            content_type: MIME type of file (e.g., "application/pdf")
            expiration: URL expiration time in seconds (default: 1 hour)
            max_file_size: Maximum file size in bytes (optional)
        
        Returns:
            dict with upload_url, file_path, expiration
        """
        blob = self.bucket.blob(file_path)
        
        # Auto-detect content type if not provided
        if not content_type:
            content_type, _ = mimetypes.guess_type(file_path)
            if not content_type:
                content_type = "application/octet-stream"
        
        # Set expiration time
        expiration_time = datetime.utcnow() + timedelta(seconds=expiration)
        
        # Generate signed URL for PUT request
        upload_url = blob.generate_signed_url(
            version="v4",
            expiration=expiration_time,
            method="PUT",
            content_type=content_type,
        )
        
        return {
            "upload_url": upload_url,
            "file_path": file_path,
            "content_type": content_type,
            "method": "PUT",
            "expires_at": expiration_time.isoformat(),
            "bucket": self.bucket_name,
            "headers": {
                "Content-Type": content_type,
            },
            "max_file_size": max_file_size,
        }
    
    def generate_download_url(
        self,
        file_path: str,
        expiration: int = 3600,
        disposition: str = "inline",
        filename: Optional[str] = None,
    ) -> dict:
        """
        Generate a presigned URL for downloading a file from GCS.
        
        Args:
            file_path: Path in GCS bucket
            expiration: URL expiration time in seconds (default: 1 hour)
            disposition: Content disposition ("inline" or "attachment")
            filename: Custom filename for download (optional)
        
        Returns:
            dict with download_url, file_path, expiration
        """
        blob = self.bucket.blob(file_path)
        
        # Check if file exists
        if not blob.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Set expiration time
        expiration_time = datetime.utcnow() + timedelta(seconds=expiration)
        
        # Set response disposition
        response_disposition = disposition
        if filename:
            response_disposition = f'{disposition}; filename="{filename}"'
        
        # Generate signed URL for GET request
        download_url = blob.generate_signed_url(
            version="v4",
            expiration=expiration_time,
            method="GET",
            response_disposition=response_disposition,
        )
        
        # Get file metadata
        blob.reload()
        
        return {
            "download_url": download_url,
            "file_path": file_path,
            "expires_at": expiration_time.isoformat(),
            "bucket": self.bucket_name,
            "size": blob.size,
            "content_type": blob.content_type,
            "updated_at": blob.updated.isoformat() if blob.updated else None,
        }
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from GCS.
        
        Args:
            file_path: Path in GCS bucket
        
        Returns:
            True if deleted successfully
        """
        blob = self.bucket.blob(file_path)
        
        if blob.exists():
            blob.delete()
            return True
        
        return False
    
    def get_file_metadata(self, file_path: str) -> dict:
        """
        Get metadata for a file in GCS.
        
        Args:
            file_path: Path in GCS bucket
        
        Returns:
            dict with file metadata
        """
        blob = self.bucket.blob(file_path)
        
        if not blob.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        blob.reload()
        
        return {
            "file_path": file_path,
            "bucket": self.bucket_name,
            "size": blob.size,
            "content_type": blob.content_type,
            "md5_hash": blob.md5_hash,
            "created_at": blob.time_created.isoformat() if blob.time_created else None,
            "updated_at": blob.updated.isoformat() if blob.updated else None,
            "generation": blob.generation,
        }
    
    def file_exists(self, file_path: str) -> bool:
        """
        Check if a file exists in GCS.
        
        Args:
            file_path: Path in GCS bucket
        
        Returns:
            True if file exists
        """
        blob = self.bucket.blob(file_path)
        return blob.exists()
    
    def calculate_file_hash(self, content: bytes) -> str:
        """
        Calculate SHA-256 hash of file content.
        
        Args:
            content: File content as bytes
        
        Returns:
            Hexadecimal hash string
        """
        return hashlib.sha256(content).hexdigest()
    
    def generate_file_path(
        self,
        category: str,
        user_id: str,
        filename: str,
        include_timestamp: bool = True,
    ) -> str:
        """
        Generate a structured file path for GCS.
        
        Args:
            category: File category (e.g., "documents", "transcripts", "avatars")
            user_id: User ID
            filename: Original filename
            include_timestamp: Include timestamp in path (default: True)
        
        Returns:
            GCS file path (e.g., "documents/2024/10/user-id/filename.pdf")
        """
        now = datetime.utcnow()
        
        # Sanitize filename
        safe_filename = filename.replace(" ", "_").replace("/", "_")
        
        if include_timestamp:
            # Include year/month in path for better organization
            path = f"{category}/{now.year}/{now.month:02d}/{user_id}/{now.timestamp()}_{safe_filename}"
        else:
            path = f"{category}/{user_id}/{safe_filename}"
        
        return path
    
    def copy_file(self, source_path: str, destination_path: str) -> bool:
        """
        Copy a file within GCS.
        
        Args:
            source_path: Source file path in GCS
            destination_path: Destination file path in GCS
        
        Returns:
            True if copied successfully
        """
        source_blob = self.bucket.blob(source_path)
        
        if not source_blob.exists():
            raise FileNotFoundError(f"Source file not found: {source_path}")
        
        # Copy blob
        self.bucket.copy_blob(
            source_blob,
            self.bucket,
            destination_path,
        )
        
        return True
    
    def move_file(self, source_path: str, destination_path: str) -> bool:
        """
        Move a file within GCS (copy then delete).
        
        Args:
            source_path: Source file path in GCS
            destination_path: Destination file path in GCS
        
        Returns:
            True if moved successfully
        """
        # Copy file
        self.copy_file(source_path, destination_path)
        
        # Delete source
        self.delete_file(source_path)
        
        return True
    
    def list_files(
        self,
        prefix: str = "",
        max_results: int = 100,
    ) -> list:
        """
        List files in GCS bucket with a prefix.
        
        Args:
            prefix: Path prefix to filter files
            max_results: Maximum number of results
        
        Returns:
            List of file paths
        """
        blobs = self.bucket.list_blobs(prefix=prefix, max_results=max_results)
        
        return [
            {
                "file_path": blob.name,
                "size": blob.size,
                "content_type": blob.content_type,
                "updated_at": blob.updated.isoformat() if blob.updated else None,
            }
            for blob in blobs
        ]



# Only initialize GCSService if all required config is present
def get_gcs_service():
    if settings.GCP_PROJECT_ID and settings.GCS_BUCKET_NAME:
        return GCSService()
    return None
