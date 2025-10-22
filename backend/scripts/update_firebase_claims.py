"""
Update Firebase custom claims for existing users using DB records.
This script will read active users from PostgreSQL and ensure their
Firebase custom claims include a 'roles' list consistent with DB.

It requires Firebase credentials to be configured (same as sync script).
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


async def update_claims():
    if not initialize_firebase():
        print("❌ Failed to initialize Firebase. Please check your credentials.")
        return

    async for db in get_db():
        try:
            result = await db.execute(select(User).where(User.status == "active"))
            users = result.scalars().all()
            print(f"📊 Found {len(users)} active users in PostgreSQL\n")

            updated = 0
            skipped = 0
            errors = 0

            for user in users:
                try:
                    if not user.firebase_uid:
                        print(f"⚠️  Skipping {user.username}: no firebase_uid set")
                        skipped += 1
                        continue

                    raw_role = user.role.value if hasattr(user.role, 'value') else user.role
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

                    FirebaseService.set_custom_user_claims(user.firebase_uid, claims)
                    print(f"✅ Updated claims for {user.username} ({user.firebase_uid}) -> roles: {claims['roles']}")
                    updated += 1

                except Exception as e:
                    print(f"❌ Error updating {user.username}: {e}")
                    errors += 1

            print("\n" + "="*60)
            print(f"📊 Summary: Updated: {updated}  Skipped: {skipped}  Errors: {errors}")
            print("="*60 + "\n")

        finally:
            await db.close()
            break


if __name__ == '__main__':
    confirm = input("Proceed to update Firebase claims for existing users? (y/N): ")
    if confirm.lower() == 'y':
        asyncio.run(update_claims())
    else:
        print("Cancelled.")
