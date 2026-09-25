#!/usr/bin/env python3
"""
Development-only seed script to create the default admin account.
This should only be used in development environments.
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.connection import async_session_factory, engine, Base
from app.models.user import User, UserRole
from app.utils.security import hash_password


ADMIN_EMAIL = "admin@aidrac.com"
ADMIN_NAME = "AIDRAC System Administrator"
ADMIN_PASSWORD = "AIDRAC-Admin@2026!"


async def create_admin_user(db: AsyncSession) -> User:
    """Create the default admin user if it doesn't exist."""
    # Check if admin already exists
    result = await db.execute(select(User).where(User.email == ADMIN_EMAIL))
    existing_admin = result.scalar_one_or_none()

    if existing_admin:
        print(f"Admin user already exists: {ADMIN_EMAIL}")
        return existing_admin

    # Create admin user
    admin = User(
        full_name=ADMIN_NAME,
        email=ADMIN_EMAIL,
        password=hash_password(ADMIN_PASSWORD),
        role=UserRole.ADMIN,
        location_visibility=False,  # Admin doesn't share location by default
        is_online=False,
    )

    db.add(admin)
    await db.flush()
    await db.refresh(admin)

    print(f"Created admin user: {ADMIN_EMAIL}")
    print(f"  Name: {ADMIN_NAME}")
    print(f"  Role: {admin.role.value}")
    print(f"  ID: {admin.id}")

    return admin


async def main():
    print("=" * 60)
    print("AIDRAC Admin Seed Script (Development Only)")
    print("=" * 60)
    print()
    print("This script creates the default admin account:")
    print(f"  Email: {ADMIN_EMAIL}")
    print(f"  Name:  {ADMIN_NAME}")
    print()

    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as db:
        try:
            admin = await create_admin_user(db)
            await db.commit()
            print()
            print("✓ Admin account ready!")
            print()
            print("Login credentials:")
            print(f"  Email:    {ADMIN_EMAIL}")
            print(f"  Password: {ADMIN_PASSWORD}")
            print()
            print("IMPORTANT: Change the password after first login in production!")
        except Exception as e:
            await db.rollback()
            print(f"Error: {e}")
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())