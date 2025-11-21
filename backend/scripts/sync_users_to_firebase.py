"""
Sync PostgreSQL users to Firebase Authentication
Creates Firebase users for all users in the database
"""
import asyncio
import sys
from pathlib import Path
import asyncpg

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.firebase import FirebaseService, initialize_firebase


async def sync_users_to_firebase():
    """Sync all PostgreSQL users to Firebase"""
    
    # Initialize Firebase first
    if not initialize_firebase():
        print("❌ Failed to initialize Firebase. Please check your credentials.")
        return
    
    print("🔄 Syncing users from PostgreSQL to Firebase...\n")
    
    # Connect to local database
    conn = await asyncpg.connect(
        host="localhost",
        port=5432,
        user="postgres",
        password="postgres",
        database="greenwich_local",
    )
    
    try:
        # Get all active users from PostgreSQL
        users = await conn.fetch("""
            SELECT id, username, email, full_name, role, campus_id, major_id, firebase_uid
            FROM users 
            WHERE status = 'active'
            ORDER BY id
        """)
        
        print(f"📊 Found {len(users)} active users in PostgreSQL\n")
        
        success_count = 0
        skip_count = 0
        error_count = 0
        
        # Default password for all users: Test123!@#
        default_password = "Test123!@#"
        
        for user in users:
            try:
                # Check if user already exists in Firebase
                firebase_uid = None
                try:
                    existing_user = FirebaseService.get_user_by_email(user['email'])
                    print(f"⏭️  Skipped: {user['username']} ({user['email']}) - Already exists in Firebase")
                    skip_count += 1
                    firebase_uid = existing_user.uid
                except Exception:
                    # User doesn't exist, create it
                    pass
                
                if not firebase_uid:
                    # Create user in Firebase
                    firebase_user = FirebaseService.create_user(
                        email=user['email'],
                        password=default_password,
                        display_name=user['full_name']
                    )
                    firebase_uid = firebase_user.uid
                    
                    print(f"✅ Created: {user['username']} ({user['email']})")
                    success_count += 1
                
                # Set custom claims (roles as a list, campus, etc.)
                role_value = user['role']
                claims = {
                    "roles": [role_value],
                    "db_user_id": user['id'],
                    "username": user['username']
                }
                
                if user['campus_id']:
                    claims["campus_id"] = user['campus_id']
                if user['major_id']:
                    claims["major_id"] = user['major_id']
                
                FirebaseService.set_custom_user_claims(firebase_uid, claims)
                
                # Update firebase_uid in PostgreSQL if not set
                if not user['firebase_uid']:
                    await conn.execute("""
                        UPDATE users 
                        SET firebase_uid = $1, updated_at = NOW()
                        WHERE id = $2
                    """, firebase_uid, user['id'])
                
            except Exception as e:
                print(f"❌ Error processing {user['username']}: {str(e)}")
                error_count += 1
                continue
        
        print(f"\n{'='*60}")
        print(f"📊 Summary:")
        print(f"  ✅ Created: {success_count}")
        print(f"  ⏭️  Skipped: {skip_count}")
        print(f"  ❌ Errors:  {error_count}")
        print(f"{'='*60}\n")
        
        if success_count > 0:
            print(f"⚠️  IMPORTANT: Default password for all users: {default_password}")
            print("   Users should change their password after first login!\n")
        
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        await conn.close()


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
