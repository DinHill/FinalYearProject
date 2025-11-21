"""Sync all users to Firebase Authentication"""

import asyncio
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.core.firebase import initialize_firebase
from sqlalchemy import select
from firebase_admin import auth as firebase_auth

async def sync_users_to_firebase():
    """Create/update all users in Firebase Authentication"""
    
    # Initialize Firebase
    initialize_firebase()
    print("✅ Firebase initialized\n")
    
    async with AsyncSessionLocal() as session:
        # Get all users
        result = await session.execute(select(User))
        users = result.scalars().all()
        
        default_password = "Test123!@#"
        created_count = 0
        updated_count = 0
        error_count = 0
        
        print(f"🔄 Syncing {len(users)} users to Firebase Authentication...\n")
        
        for user in users:
            try:
                if not user.email:
                    print(f"⚠️  {user.username} - No email, skipping")
                    continue
                
                # Try to get existing Firebase user
                firebase_user = None
                try:
                    if user.firebase_uid:
                        firebase_user = firebase_auth.get_user(user.firebase_uid)
                    else:
                        firebase_user = firebase_auth.get_user_by_email(user.email)
                except firebase_auth.UserNotFoundError:
                    firebase_user = None
                
                if firebase_user:
                    # Update existing user
                    firebase_auth.update_user(
                        firebase_user.uid,
                        email=user.email,
                        password=default_password,
                        display_name=user.full_name,
                        email_verified=True
                    )
                    
                    # Update firebase_uid in database if needed
                    if user.firebase_uid != firebase_user.uid:
                        user.firebase_uid = firebase_user.uid
                        await session.commit()
                    
                    print(f"🔄 Updated: {user.username} ({user.email})")
                    updated_count += 1
                else:
                    # Create new user
                    new_firebase_user = firebase_auth.create_user(
                        email=user.email,
                        password=default_password,
                        display_name=user.full_name,
                        email_verified=True
                    )
                    
                    # Update firebase_uid in database
                    user.firebase_uid = new_firebase_user.uid
                    await session.commit()
                    
                    print(f"✅ Created: {user.username} ({user.email})")
                    created_count += 1
                    
            except Exception as e:
                print(f"❌ {user.username} - Error: {str(e)[:80]}")
                error_count += 1
        
        print(f"\n{'='*60}")
        print(f"✅ Created: {created_count} users")
        print(f"🔄 Updated: {updated_count} users")
        print(f"❌ Errors: {error_count} users")
        print(f"🔑 Firebase password for all users: {default_password}")
        print(f"{'='*60}\n")
        
        print("📧 User emails:")
        result = await session.execute(select(User).where(User.email.isnot(None)))
        users_with_email = result.scalars().all()
        for user in users_with_email[:10]:  # Show first 10
            print(f"   {user.username}: {user.email}")
        if len(users_with_email) > 10:
            print(f"   ... and {len(users_with_email) - 10} more users")

if __name__ == "__main__":
    asyncio.run(sync_users_to_firebase())
