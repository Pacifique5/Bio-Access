"""Password hashing and verification using bcrypt."""

import bcrypt


def hash_password(plain_password: str) -> str:
    """Return a bcrypt hash for storage."""
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Compare a plain password against a stored hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        password_hash.encode("utf-8"),
    )
