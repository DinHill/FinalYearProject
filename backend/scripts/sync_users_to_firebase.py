"""
Sync PostgreSQL users to Firebase Authentication
Creates Firebase users for all users in the database
"""
import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import get_db
from app.core.firebase import FirebaseService, initialize_firebase
from app.models import User
from sqlalchemy import select


async def sync_users_to_firebase():
    """Sync all PostgreSQL users to Firebase"""
    
    # Initialize Firebase first
    if not initialize_firebase():
        print("❌ Failed to initialize Firebase. Please check your credentials.")
        return
    
    print("🔄 Syncing users from PostgreSQL to Firebase...\n")
    
    async for db in get_db():
        try:
            # Get all active users from PostgreSQL
            result = await db.execute(
                select(User).where(User.status == "active")
            )
            users = result.scalars().all()
            
            print(f"📊 Found {len(users)} active users in PostgreSQL\n")
            
            success_count = 0
            skip_count = 0
            error_count = 0
            
            for user in users:
                try:
                    # Check if user already exists in Firebase
                    try:
                        existing_user = FirebaseService.get_user_by_email(user.email)
                        print(f"⏭️  Skipped: {user.username} ({user.email}) - Already exists in Firebase")
                        skip_count += 1
                        continue
                    except Exception:
                        # User doesn't exist, create it
                        pass
                    
                    # Default password: username123 (user should change it)
                    default_password = f"{user.username}123"
                    
                    # Create user in Firebase
                    firebase_user = FirebaseService.create_user(
                        email=user.email,
                        password=default_password,
                        display_name=user.full_name
                    )
                    
                    # Set custom claims (roles as a list, campus, etc.)
                    # Backend expects a 'roles' claim (list) for RBAC checks
                    # Normalize legacy role names to current RBAC names
                    raw_role = user.role.value if hasattr(user.role, 'value') else user.role
                    # Map old 'admin' to 'super_admin' (migration)
                    if raw_role == 'admin':
                        role_value = 'super_admin'
                    else:
                        role_value = raw_role

                    claims = {
                        "roles": [role_value],
                        "db_user_id": user.id,
                        "username": user.username
                    }
                    
                    if user.campus_id:
                        claims["campus_id"] = user.campus_id
                    if user.major_id:
                        claims["major_id"] = user.major_id
                    
                    FirebaseService.set_custom_user_claims(firebase_user.uid, claims)
                    
                    # Update firebase_uid in PostgreSQL
                    user.firebase_uid = firebase_user.uid
                    await db.commit()
                    
                    print(f"✅ Created: {user.username} ({user.email}) - Password: {default_password}")
                    success_count += 1
                    
                except Exception as e:
                    print(f"❌ Error creating {user.username}: {str(e)}")
                    error_count += 1
                    continue
            
            print(f"\n{'='*60}")
            print(f"📊 Summary:")
            print(f"  ✅ Created: {success_count}")
            print(f"  ⏭️  Skipped: {skip_count}")
            print(f"  ❌ Errors:  {error_count}")
            print(f"{'='*60}\n")
            
            if success_count > 0:
                print("⚠️  IMPORTANT: Default passwords are 'username123'")
                print("   Users should change their password after first login!\n")
            
        except Exception as e:
            print(f"❌ Fatal error: {e}")
            raise
        finally:
            await db.close()
            break


if __name__ == "__main__":
    print("="*60)
    print("  SYNC POSTGRESQL USERS TO FIREBASE")
    print("="*60)
    print("\nThis script will:")
    print("  1. Read all active users from PostgreSQL")
    print("  2. Create them in Firebase Authentication")
    print("  3. Set default password: username123")
    print("  4. Set custom claims (role, campus, etc.)")
    print("\n⚠️  Make sure Firebase credentials are configured!")
    print("="*60)
    
    confirm = input("\nProceed? (y/N): ")
    if confirm.lower() == 'y':
        asyncio.run(sync_users_to_firebase())
    else:
        print("Cancelled.")
