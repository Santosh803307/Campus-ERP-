from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User


db = SessionLocal()

try:
    user = db.scalar(
        select(User).where(
            User.email == "accounts@campuserp.com"
        )
    )

    if user is None:
        print("❌ Accounts user not found.")
    else:
        user.hashed_password = hash_password(
            "Accounts@12345"
        )

        user.is_active = True

        db.commit()

        print("✅ Accounts password reset successfully.")
        print("Email: accounts@campuserp.com")
        print("Password: Accounts@12345")

finally:
    db.close()