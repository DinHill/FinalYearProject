"""
Firebase connection test script
Run this after setting up Firebase credentials
"""
import os
from app.core.config import settings

def test_firebase_config():
    """Test Firebase configuration"""
    print("🔥 Firebase Configuration Test")
    print("=" * 40)
    
    # Check if Firebase is configured
    if not settings.FIREBASE_PROJECT_ID:
        print("❌ FIREBASE_PROJECT_ID not set")
        return False
    
    print(f"✅ Project ID: {settings.FIREBASE_PROJECT_ID}")
    
    # Check other required fields
    required_fields = [
        ("FIREBASE_PRIVATE_KEY_ID", settings.FIREBASE_PRIVATE_KEY_ID),
        ("FIREBASE_PRIVATE_KEY", settings.FIREBASE_PRIVATE_KEY),
        ("FIREBASE_CLIENT_EMAIL", settings.FIREBASE_CLIENT_EMAIL),
        ("FIREBASE_CLIENT_ID", settings.FIREBASE_CLIENT_ID),
    ]
    
    all_configured = True
    for field_name, field_value in required_fields:
        if field_value:
            print(f"✅ {field_name}: Configured")
        else:
            print(f"❌ {field_name}: Not configured")
            all_configured = False
    
    if all_configured:
        print("\n🎉 All Firebase credentials configured!")
        try:
            # Test Firebase Admin SDK initialization
            from app.services.firebase_service import firebase_service
            print("✅ Firebase Admin SDK imported successfully")
            return True
        except Exception as e:
            print(f"❌ Firebase initialization error: {e}")
            return False
    else:
        print("\n⚠️  Please configure missing Firebase credentials")
        return False

if __name__ == "__main__":
    test_firebase_config()