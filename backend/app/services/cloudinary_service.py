"""
Cloudinary Service

Handles file operations with Cloudinary:
- Generate presigned URLs for uploads
- Generate URLs for downloads
- File metadata management
- Secure file access
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import cloudinary
import cloudinary.uploader
import cloudinary.api
from cloudinary.utils import cloudinary_url
import hashlib

from app.core.settings import settings


class CloudinaryService:
    """Service for interacting with Cloudinary"""
    
    def __init__(self):
        """Initialize Cloudinary with credentials"""
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True
        )
    
    def generate_upload_url(
        self,
        file_path: str,
        content_type: Optional[str] = None,
        expiration: int = 3600,
        max_file_size: Optional[int] = None,
    ) -> dict:
        """
        Generate a presigned URL for uploading a file to Cloudinary.
        
        Args:
            file_path: Path where file will be stored (e.g., "documents/student123/file.pdf")
            content_type: MIME type of the file
            expiration: URL expiration time in seconds (default: 1 hour)
            max_file_size: Maximum file size in bytes
            
        Returns:
            Dictionary with upload URL and fields
        """
        # Cloudinary public_id (path without extension)
        public_id = file_path.rsplit('.', 1)[0] if '.' in file_path else file_path
        
        # Determine resource type based on content type
        resource_type = self._get_resource_type(content_type)
        
        # Generate timestamp for signature
        timestamp = int(datetime.now().timestamp()) + expiration
        
        # Prepare upload parameters
        params = {
            'public_id': public_id,
            'timestamp': timestamp,
            'resource_type': resource_type,
            'folder': 'greenwich-portal'  # Optional: organize files in folders
        }
        
        if max_file_size:
            params['max_file_size'] = max_file_size
        
        # Generate signature
        signature = cloudinary.utils.api_sign_request(
            params,
            settings.CLOUDINARY_API_SECRET
        )
        
        # Build upload URL
        upload_url = f"https://api.cloudinary.com/v1_1/{settings.CLOUDINARY_CLOUD_NAME}/{resource_type}/upload"
        
        return {
            'url': upload_url,
            'fields': {
                'public_id': public_id,
                'timestamp': timestamp,
                'signature': signature,
                'api_key': settings.CLOUDINARY_API_KEY,
                'folder': 'greenwich-portal'
            },
            'method': 'POST',
            'expires_at': datetime.now() + timedelta(seconds=expiration)
        }
    
    def generate_download_url(
        self,
        file_path: str,
        expiration: int = 3600,
        content_disposition: Optional[str] = None,
    ) -> str:
        """
        Generate a URL for downloading/viewing a file from Cloudinary.
        
        Args:
            file_path: Path to the file in Cloudinary
            expiration: URL expiration time in seconds (default: 1 hour)
            content_disposition: Content-Disposition header value
            
        Returns:
            Download URL
        """
        # Cloudinary public_id
        public_id = file_path.rsplit('.', 1)[0] if '.' in file_path else file_path
        
        # Determine resource type
        resource_type = self._get_resource_type_from_path(file_path)
        
        # Generate signed URL with expiration
        options = {
            'resource_type': resource_type,
            'type': 'upload',
            'sign_url': True,
            'expires_at': int(datetime.now().timestamp()) + expiration
        }
        
        if content_disposition:
            options['attachment'] = True
            options['attachment_filename'] = content_disposition.split('filename=')[-1].strip('"')
        
        url, _ = cloudinary_url(
            f"greenwich-portal/{public_id}",
            **options
        )
        
        return url
    
    def upload_file(
        self,
        file_data: bytes,
        file_path: str,
        content_type: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> dict:
        """
        Direct upload of file data to Cloudinary.
        
        Args:
            file_data: File content as bytes
            file_path: Destination path for the file
            content_type: MIME type of the file
            metadata: Additional metadata to store with file
            
        Returns:
            Upload result with file info
        """
        public_id = file_path.rsplit('.', 1)[0] if '.' in file_path else file_path
        resource_type = self._get_resource_type(content_type)
        
        upload_options = {
            'public_id': public_id,
            'resource_type': resource_type,
            'folder': 'greenwich-portal',
            'overwrite': False,
            'unique_filename': True
        }
        
        if metadata:
            upload_options['context'] = metadata
        
        result = cloudinary.uploader.upload(
            file_data,
            **upload_options
        )
        
        return {
            'url': result['secure_url'],
            'public_id': result['public_id'],
            'format': result['format'],
            'resource_type': result['resource_type'],
            'bytes': result['bytes'],
            'created_at': result['created_at']
        }
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from Cloudinary.
        
        Args:
            file_path: Path to the file to delete
            
        Returns:
            True if deletion was successful
        """
        public_id = file_path.rsplit('.', 1)[0] if '.' in file_path else file_path
        resource_type = self._get_resource_type_from_path(file_path)
        
        result = cloudinary.uploader.destroy(
            f"greenwich-portal/{public_id}",
            resource_type=resource_type
        )
        
        return result.get('result') == 'ok'
    
    def get_file_info(self, file_path: str) -> Optional[dict]:
        """
        Get metadata and information about a file.
        
        Args:
            file_path: Path to the file
            
        Returns:
            File information or None if not found
        """
        public_id = file_path.rsplit('.', 1)[0] if '.' in file_path else file_path
        resource_type = self._get_resource_type_from_path(file_path)
        
        try:
            result = cloudinary.api.resource(
                f"greenwich-portal/{public_id}",
                resource_type=resource_type
            )
            
            return {
                'url': result['secure_url'],
                'format': result['format'],
                'bytes': result['bytes'],
                'created_at': result['created_at'],
                'width': result.get('width'),
                'height': result.get('height')
            }
        except cloudinary.exceptions.NotFound:
            return None
    
    def generate_file_path(
        self,
        category: str,
        user_id: int,
        filename: str,
        add_timestamp: bool = True,
    ) -> str:
        """
        Generate a standardized file path.
        
        Args:
            category: File category (e.g., "documents", "profiles", "assignments")
            user_id: User ID
            filename: Original filename
            add_timestamp: Whether to add timestamp to filename
            
        Returns:
            Generated file path
        """
        # Sanitize filename
        safe_filename = self._sanitize_filename(filename)
        
        # Add timestamp if requested
        if add_timestamp:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            name, ext = safe_filename.rsplit('.', 1) if '.' in safe_filename else (safe_filename, '')
            safe_filename = f"{name}_{timestamp}.{ext}" if ext else f"{name}_{timestamp}"
        
        # Build path
        return f"{category}/{user_id}/{safe_filename}"
    
    def _get_resource_type(self, content_type: Optional[str]) -> str:
        """Determine Cloudinary resource type from MIME type"""
        if not content_type:
            return 'auto'
        
        if content_type.startswith('image/'):
            return 'image'
        elif content_type.startswith('video/'):
            return 'video'
        else:
            return 'raw'  # PDFs, documents, etc.
    
    def _get_resource_type_from_path(self, file_path: str) -> str:
        """Determine Cloudinary resource type from file extension"""
        ext = file_path.rsplit('.', 1)[-1].lower() if '.' in file_path else ''
        
        image_exts = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'}
        video_exts = {'mp4', 'webm', 'mov', 'avi', 'mkv'}
        
        if ext in image_exts:
            return 'image'
        elif ext in video_exts:
            return 'video'
        else:
            return 'raw'
    
    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename for safe storage"""
        # Remove path separators and dangerous characters
        safe_chars = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-')
        sanitized = ''.join(c if c in safe_chars else '_' for c in filename)
        
        # Remove leading/trailing dots and underscores
        sanitized = sanitized.strip('._')
        
        # Limit length
        if len(sanitized) > 200:
            name, ext = sanitized.rsplit('.', 1) if '.' in sanitized else (sanitized, '')
            sanitized = f"{name[:190]}.{ext}" if ext else name[:200]
        
        return sanitized


# Global instance
cloudinary_service = CloudinaryService()
