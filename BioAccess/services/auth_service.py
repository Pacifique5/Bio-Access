"""Admin authentication and session helpers."""

from typing import Optional

from psycopg2.extras import RealDictCursor

from authentication.password import verify_password
from database.connection import DatabaseConnection, get_connection
from models.admin import Admin


class AuthService:
    """Handles admin login and role checks."""

    @staticmethod
    def authenticate(username: str, password: str) -> Optional[Admin]:
        """Validate credentials and return the admin record."""
        conn = get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT * FROM admins WHERE username = %s",
                    (username.strip(),),
                )
                row = cur.fetchone()
            if row and verify_password(password, row["password_hash"]):
                return Admin.from_row(row)
            return None
        finally:
            DatabaseConnection.release_connection(conn)

    @staticmethod
    def has_permission(admin: Admin, required_role: str = "admin") -> bool:
        """Simple role-based access: admin > manager > viewer."""
        hierarchy = {"admin": 3, "manager": 2, "viewer": 1}
        return hierarchy.get(admin.role, 0) >= hierarchy.get(required_role, 0)

    @staticmethod
    def change_password(admin_id: int, old_password: str, new_password: str) -> bool:
        """Update admin password after verifying the current one."""
        from authentication.password import hash_password

        conn = get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM admins WHERE id = %s", (admin_id,))
                row = cur.fetchone()
                if not row or not verify_password(old_password, row["password_hash"]):
                    return False
                cur.execute(
                    "UPDATE admins SET password_hash = %s WHERE id = %s",
                    (hash_password(new_password), admin_id),
                )
            conn.commit()
            return True
        except Exception:
            conn.rollback()
            raise
        finally:
            DatabaseConnection.release_connection(conn)
